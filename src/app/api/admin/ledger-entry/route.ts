import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { writeAuditLog } from "@/lib/audit";

const ALLOWED_ENTRY_TYPES = new Set(["charge", "credit", "payment", "fee"]);
const ALLOWED_STATUSES = new Set(["open", "paid", "void"]);

export async function POST(request: Request) {
  try {
    const supabaseAdmin = createAdminClient();
    const body = await request.json();

    const tenant_id = String(body?.tenant_id || "").trim();
    const description = String(body?.description || "").trim();
    const amountRaw = Number(body?.amount);
    const entry_date = body?.entry_date
      ? String(body.entry_date)
      : new Date().toISOString().slice(0, 10);
    const entry_typeRaw = String(body?.entry_type || "charge").trim().toLowerCase();
    const statusRaw = String(body?.status || "open").trim().toLowerCase();
    const created_by = body?.created_by ? String(body.created_by) : null;

    const entry_type = ALLOWED_ENTRY_TYPES.has(entry_typeRaw)
      ? entry_typeRaw
      : "charge";

    const status = ALLOWED_STATUSES.has(statusRaw) ? statusRaw : "open";

    if (!tenant_id || !description || Number.isNaN(amountRaw)) {
      return NextResponse.json(
        { error: "tenant_id, description, and valid amount are required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("ledger_entries")
      .insert({
        tenant_id,
        entry_date,
        description,
        amount: amountRaw,
        entry_type,
        status,
        created_by,
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error("Create ledger entry failed", error);
      return NextResponse.json(
        { error: error?.message || "Failed to create ledger entry." },
        { status: 500 }
      );
    }

    await writeAuditLog({
      actor_profile_id: created_by,
      actor_role: "admin",
      entity_type: "ledger_entry",
      entity_id: data.id,
      action: "created",
      metadata: {
        tenant_id,
        amount: amountRaw,
        entry_type,
      },
    });

    return NextResponse.json({ ledgerEntry: data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/ledger-entry failed", error);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
