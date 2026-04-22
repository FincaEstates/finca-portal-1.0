import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase-server";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function POST(request: Request) {
  try {
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY." },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const supabaseAdmin = createAdminClient();
    const body = await request.json();

    const tenant_id = String(body?.tenant_id || "").trim();
    const ledger_entry_id = String(body?.ledger_entry_id || "").trim();

    if (!tenant_id || !ledger_entry_id) {
      return NextResponse.json(
        { error: "tenant_id and ledger_entry_id are required." },
        { status: 400 }
      );
    }

    const { data: ledgerEntry, error: ledgerError } = await supabaseAdmin
      .from("ledger_entries")
      .select("id, tenant_id, description, amount, entry_type, status")
      .eq("id", ledger_entry_id)
      .eq("tenant_id", tenant_id)
      .maybeSingle();

    if (ledgerError || !ledgerEntry) {
      return NextResponse.json(
        { error: "Ledger entry not found for this tenant." },
        { status: 404 }
      );
    }

    const type = String(ledgerEntry.entry_type || "charge").toLowerCase();
    const status = String(ledgerEntry.status || "open").toLowerCase();
    const amount = Math.abs(Number(ledgerEntry.amount || 0));

    if (type !== "charge" && type !== "fee") {
      return NextResponse.json(
        { error: "Only open charges or fees can be paid." },
        { status: 400 }
      );
    }

    if (status === "paid" || status === "void") {
      return NextResponse.json(
        { error: "This ledger entry is not payable." },
        { status: 400 }
      );
    }

    if (!amount || Number.isNaN(amount)) {
      return NextResponse.json(
        { error: "Ledger entry amount is invalid." },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: ledgerEntry.description || "Tenant Charge",
            },
          },
        },
      ],
      metadata: {
        tenant_id,
        ledger_entry_id,
      },
      success_url: `${siteUrl}/tenant/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/tenant/ledger`,
    });

    const { error: paymentInsertError } = await supabaseAdmin
      .from("payment_transactions")
      .insert({
        tenant_id,
        ledger_entry_id,
        stripe_checkout_session_id: session.id,
        amount,
        currency: "usd",
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (paymentInsertError) {
      console.error("payment transaction insert failed", paymentInsertError);
      return NextResponse.json(
        { error: paymentInsertError.message },
        { status: 500 }
      );
    }

    await writeAuditLog({
      actor_role: "tenant",
      entity_type: "payment_transaction",
      action: "checkout_session_created",
      metadata: {
        tenant_id,
        ledger_entry_id,
        stripe_checkout_session_id: session.id,
        amount,
      },
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("POST /api/payments/create-checkout-session failed", error);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
