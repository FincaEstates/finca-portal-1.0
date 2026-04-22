import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { writeAuditLog } from "@/lib/audit";

function nextOccurrence(dayOfMonth: number, fromDate = new Date()) {
  const year = fromDate.getUTCFullYear();
  const month = fromDate.getUTCMonth();
  const today = fromDate.getUTCDate();
  const safeDay = Math.min(Math.max(dayOfMonth, 1), 28);

  if (today <= safeDay) {
    return new Date(Date.UTC(year, month, safeDay)).toISOString().slice(0, 10);
  }

  return new Date(Date.UTC(year, month + 1, safeDay)).toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin
      .from("recurring_charges")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ recurringCharges: data || [] });
  } catch (error) {
    console.error("GET /api/admin/recurring-charge failed", error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = createAdminClient();
    const body = await request.json();

    const tenant_id = String(body?.tenant_id || "").trim();
    const description = String(body?.description || "").trim();
    const amount = Number(body?.amount);
    const day_of_month = Math.min(
      Math.max(Number(body?.day_of_month || 1), 1),
      28
    );
    const frequency = "monthly";
    const next_post_date =
      body?.next_post_date && String(body.next_post_date).trim()
        ? String(body.next_post_date).trim()
        : nextOccurrence(day_of_month);

    if (!tenant_id || !description || Number.isNaN(amount)) {
      return NextResponse.json(
        { error: "tenant_id, description, and valid amount are required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("recurring_charges")
      .insert({
        tenant_id,
        description,
        amount,
        frequency,
        day_of_month,
        next_post_date,
        active: true,
      })
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Failed to create recurring charge." },
        { status: 500 }
      );
    }

    await writeAuditLog({
      actor_role: "admin",
      entity_type: "recurring_charge",
      entity_id: data.id,
      action: "created",
      metadata: {
        tenant_id,
        description,
        amount,
        day_of_month,
        next_post_date,
      },
    });

    return NextResponse.json({ recurringCharge: data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/recurring-charge failed", error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
