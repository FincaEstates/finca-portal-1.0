import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase-server";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  try {
    if (!stripeSecretKey || !webhookSecret) {
      return NextResponse.json(
        { error: "Missing Stripe webhook configuration." },
        { status: 500 }
      );
    }

    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json(
        { error: "Missing Stripe signature header." },
        { status: 400 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const payload = await request.text();

    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );

    const supabaseAdmin = createAdminClient();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const tenant_id = String(session.metadata?.tenant_id || "").trim();
      const ledger_entry_id = String(session.metadata?.ledger_entry_id || "").trim();
      const checkout_session_id = session.id;
      const payment_intent_id =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : null;

      if (!tenant_id || !ledger_entry_id || !checkout_session_id) {
        return NextResponse.json(
          { error: "Webhook metadata is missing required fields." },
          { status: 400 }
        );
      }

      const { data: transaction, error: transactionLookupError } =
        await supabaseAdmin
          .from("payment_transactions")
          .select("id, status, ledger_entry_id, tenant_id")
          .eq("stripe_checkout_session_id", checkout_session_id)
          .maybeSingle();

      if (transactionLookupError || !transaction) {
        console.error(
          "Webhook transaction lookup failed",
          transactionLookupError
        );
        return NextResponse.json(
          { error: "Payment transaction not found." },
          { status: 404 }
        );
      }

      const currentStatus = String(transaction.status || "").toLowerCase();

      if (currentStatus !== "paid") {
        const { error: paymentUpdateError } = await supabaseAdmin
          .from("payment_transactions")
          .update({
            status: "paid",
            stripe_payment_intent_id: payment_intent_id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", transaction.id);

        if (paymentUpdateError) {
          console.error("Payment transaction update failed", paymentUpdateError);
          return NextResponse.json(
            { error: paymentUpdateError.message },
            { status: 500 }
          );
        }

        const { error: ledgerUpdateError } = await supabaseAdmin
          .from("ledger_entries")
          .update({
            status: "paid",
            updated_at: new Date().toISOString(),
          })
          .eq("id", ledger_entry_id)
          .eq("tenant_id", tenant_id);

        if (ledgerUpdateError) {
          console.error("Ledger update failed", ledgerUpdateError);
          return NextResponse.json(
            { error: ledgerUpdateError.message },
            { status: 500 }
          );
        }

        await writeAuditLog({
          actor_role: "system",
          entity_type: "payment_transaction",
          entity_id: transaction.id,
          action: "checkout_session_completed",
          metadata: {
            tenant_id,
            ledger_entry_id,
            stripe_checkout_session_id: checkout_session_id,
            stripe_payment_intent_id: payment_intent_id,
          },
        });
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;

      await createAdminClient()
        .from("payment_transactions")
        .update({
          status: "expired",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_checkout_session_id", session.id);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("POST /api/payments/webhook failed", error);
    return NextResponse.json(
      { error: "Webhook signature verification failed." },
      { status: 400 }
    );
  }
}
