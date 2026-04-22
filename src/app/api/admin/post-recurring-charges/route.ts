import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { writeAuditLog } from "@/lib/audit";

type RecurringChargeRow = {
  id: string;
  tenant_id: string;
  description: string;
  amount: number;
  day_of_month: number;
  next_post_date: string;
};

function nextMonthlyDate(currentDate: string, dayOfMonth: number) {
  const base = new Date(`${currentDate}T00:00:00.000Z`);
  const safeDay = Math.min(Math.max(dayOfMonth, 1), 28);
  return new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, safeDay)
  )
    .toISOString()
    .slice(0, 10);
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = createAdminClient();
    const body = await request.json().catch(() => ({}));
    const asOfDate =
      body?.as_of_date && String(body.as_of_date).trim()
        ? String(body.as_of_date).trim()
        : new Date().toISOString().slice(0, 10);

    const { data, error } = await supabaseAdmin
      .from("recurring_charges")
      .select("id, tenant_id, description, amount, day_of_month, next_post_date")
      .eq("active", true)
      .lte("next_post_date", asOfDate)
      .order("next_post_date", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const dueCharges = (data || []) as RecurringChargeRow[];
    const results: Array<{ recurring_charge_id: string; posted: boolean; reason?: string }> = [];

    for (const charge of dueCharges) {
      const entryDescription = `Recurring Charge: ${charge.description}`;

      const { data: existing } = await supabaseAdmin
        .from("ledger_entries")
        .select("id")
        .eq("tenant_id", charge.tenant_id)
        .eq("entry_date", charge.next_post_date)
        .eq("description", entryDescription)
        .maybeSingle();

      if (existing?.id) {
        results.push({
          recurring_charge_id: charge.id,
          posted: false,
          reason: "already_posted",
        });

        await supabaseAdmin
          .from("recurring_charges")
          .update({
            next_post_date: nextMonthlyDate(charge.next_post_date, charge.day_of_month),
            last_posted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", charge.id);

        continue;
      }

      const { data: ledgerRow, error: ledgerError } = await supabaseAdmin
        .from("ledger_entries")
        .insert({
          tenant_id: charge.tenant_id,
          entry_date: charge.next_post_date,
          description: entryDescription,
          amount: charge.amount,
          entry_type: "charge",
          status: "open",
        })
        .select("*")
        .single();

      if (ledgerError || !ledgerRow) {
        results.push({
          recurring_charge_id: charge.id,
          posted: false,
          reason: ledgerError?.message || "ledger_insert_failed",
        });
        continue;
      }

      await supabaseAdmin
        .from("recurring_charges")
        .update({
          next_post_date: nextMonthlyDate(charge.next_post_date, charge.day_of_month),
          last_posted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", charge.id);

      await writeAuditLog({
        actor_role: "system",
        entity_type: "recurring_charge",
        entity_id: charge.id,
        action: "posted_to_ledger",
        metadata: {
          tenant_id: charge.tenant_id,
          ledger_entry_id: ledgerRow.id,
          entry_date: charge.next_post_date,
          amount: charge.amount,
        },
      });

      results.push({
        recurring_charge_id: charge.id,
        posted: true,
      });
    }

    return NextResponse.json({
      as_of_date: asOfDate,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("POST /api/admin/post-recurring-charges failed", error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
