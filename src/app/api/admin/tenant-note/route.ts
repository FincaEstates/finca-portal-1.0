import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { writeAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const supabaseAdmin = createAdminClient();
    const body = await request.json();

    const tenant_id = String(body?.tenant_id || "").trim();
    const title = body?.title ? String(body.title).trim() : null;
    const note_text = String(body?.note_text || "").trim();
    const visible_to_tenant =
      typeof body?.visible_to_tenant === "boolean"
        ? body.visible_to_tenant
        : true;
    const created_by = body?.created_by ? String(body.created_by) : null;

    if (!tenant_id || !note_text) {
      return NextResponse.json(
        { error: "tenant_id and note_text are required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("tenant_notes")
      .insert({
        tenant_id,
        title,
        note_text,
        visible_to_tenant,
        created_by,
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error("Create tenant note failed", error);
      return NextResponse.json(
        { error: error?.message || "Failed to create tenant note." },
        { status: 500 }
      );
    }

    await writeAuditLog({
      actor_profile_id: created_by,
      actor_role: "admin",
      entity_type: "tenant_note",
      entity_id: data.id,
      action: "created",
      metadata: {
        tenant_id,
        visible_to_tenant,
      },
    });

    return NextResponse.json({ note: data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/tenant-note failed", error);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
