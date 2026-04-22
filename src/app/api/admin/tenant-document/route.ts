import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { writeAuditLog } from "@/lib/audit";

const ALLOWED_CATEGORIES = new Set(["lease", "notice", "general", "other"]);

export async function POST(request: Request) {
  try {
    const supabaseAdmin = createAdminClient();
    const body = await request.json();

    const tenant_id = String(body?.tenant_id || "").trim();
    const title = String(body?.title || "").trim();
    const file_name = String(body?.file_name || "").trim();
    const file_path = String(body?.file_path || "").trim();
    const bucket = String(body?.bucket || "tenant-documents").trim();
    const mime_type = body?.mime_type ? String(body.mime_type) : null;
    const file_size =
      body?.file_size !== undefined && body?.file_size !== null
        ? Number(body.file_size)
        : null;
    const categoryRaw = String(body?.category || "general").trim().toLowerCase();
    const visible_to_tenant =
      typeof body?.visible_to_tenant === "boolean"
        ? body.visible_to_tenant
        : true;
    const uploaded_by = body?.uploaded_by ? String(body.uploaded_by) : null;

    const category = ALLOWED_CATEGORIES.has(categoryRaw)
      ? categoryRaw
      : "general";

    const document_name = title || file_name || "Document";
    const storage_path = file_path;

    if (!tenant_id || !file_name || !file_path || !bucket) {
      return NextResponse.json(
        {
          error:
            "tenant_id, file_name, file_path, and bucket are required.",
        },
        { status: 400 }
      );
    }

    const insertPayload = {
      tenant_id,
      document_name,
      title: document_name,
      file_name,
      file_path,
      storage_path,
      bucket,
      mime_type,
      file_size,
      category,
      visible_to_tenant,
      uploaded_by,
    };

    const { data, error } = await supabaseAdmin
      .from("tenant_documents")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error || !data) {
      console.error("Create tenant document failed", error);
      return NextResponse.json(
        { error: error?.message || "Failed to create tenant document." },
        { status: 500 }
      );
    }

    await writeAuditLog({
      actor_profile_id: uploaded_by,
      actor_role: "admin",
      entity_type: "tenant_document",
      entity_id: data.id,
      action: "created",
      metadata: {
        tenant_id,
        document_name,
        file_name,
        file_path,
        storage_path,
        bucket,
        category,
      },
    });

    return NextResponse.json({ document: data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/tenant-document failed", error);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
