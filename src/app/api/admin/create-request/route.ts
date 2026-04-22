import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { writeAuditLog } from "@/lib/audit";

const ALLOWED_PRIORITIES = new Set(["low", "normal", "high", "urgent"]);

export async function POST(request: Request) {
  try {
    const supabaseAdmin = createAdminClient();
    const body = await request.json();

    const tenant_id = String(body?.tenant_id || "").trim();
    const property_id = body?.property_id ? String(body.property_id).trim() : null;
    const title = String(body?.title || "").trim();
    const description = String(body?.description || "").trim();
    const category = String(body?.category || "general").trim();
    const priorityRaw = String(body?.priority || "normal").trim().toLowerCase();
    const created_by = body?.created_by ? String(body.created_by).trim() : null;

    const priority = ALLOWED_PRIORITIES.has(priorityRaw) ? priorityRaw : "normal";

    if (!tenant_id || !title || !description) {
      return NextResponse.json(
        { error: "tenant_id, title, and description are required." },
        { status: 400 }
      );
    }

    const { data: tenantRecord, error: tenantLookupError } = await supabaseAdmin
      .from("tenants")
      .select("id, profile_id")
      .eq("id", tenant_id)
      .maybeSingle();

    if (tenantLookupError || !tenantRecord) {
      return NextResponse.json(
        { error: "Invalid tenant_id. No tenant record found." },
        { status: 400 }
      );
    }

    let full_name = "Tenant";
    let email = `tenant-${tenant_id}@finca.local`;
    let property_name = "Property";

    if (tenantRecord.profile_id) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("id", tenantRecord.profile_id)
        .maybeSingle();

      if (profile?.full_name && profile.full_name.trim()) {
        full_name = profile.full_name.trim();
      }

      try {
        const authResult = await supabaseAdmin.auth.admin.getUserById(
          tenantRecord.profile_id
        );

        const authEmail = authResult.data.user?.email?.trim();
        if (authEmail) {
          email = authEmail;
        }
      } catch (authError) {
        console.error("Auth user lookup failed", authError);
      }
    }

    if (body?.property_name && String(body.property_name).trim()) {
      property_name = String(body.property_name).trim();
    } else if (property_id) {
      try {
        const { data: property } = await supabaseAdmin
          .from("properties")
          .select("name")
          .eq("id", property_id)
          .maybeSingle();

        const maybeName =
          property && "name" in property && typeof property.name === "string"
            ? property.name.trim()
            : "";

        if (maybeName) {
          property_name = maybeName;
        }
      } catch (propertyLookupError) {
        console.error("Property lookup failed", propertyLookupError);
      }
    }

    const insertPayload = {
      tenant_id,
      property_id,
      title,
      description,
      category,
      priority,
      status: "submitted",
      created_by,
      full_name,
      email,
      property_name,
    };

    const { data, error } = await supabaseAdmin
      .from("maintenance_requests")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error || !data) {
      console.error("Create admin request failed", error);
      return NextResponse.json(
        { error: error?.message || "Failed to create request." },
        { status: 500 }
      );
    }

    await writeAuditLog({
      actor_profile_id: created_by,
      actor_role: "admin",
      entity_type: "maintenance_request",
      entity_id: data.id,
      action: "created_by_admin",
      metadata: {
        tenant_id,
        property_id,
        property_name,
        category,
        priority,
        full_name,
        email,
      },
    });

    return NextResponse.json({ request: data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/create-request failed", error);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
