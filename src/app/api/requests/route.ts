import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { sendSms } from "@/lib/sms";
import { writeAuditLog } from "@/lib/audit";

const ALLOWED_PRIORITIES = new Set(["low", "normal", "high", "urgent"]);

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin
      .from("maintenance_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET requests failed", error);
      return NextResponse.json(
        { error: "Failed to load requests." },
        { status: 500 }
      );
    }

    return NextResponse.json({ requests: data ?? [] });
  } catch (error) {
    console.error("GET /api/requests failed", error);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = createAdminClient();
    const body = await request.json();

    const tenant_id = String(body?.tenant_id || "").trim();
    const property_id = body?.property_id ? String(body.property_id) : null;
    const unit_id = body?.unit_id ? String(body.unit_id) : null;
    const title = String(body?.title || "").trim();
    const description = String(body?.description || "").trim();
    const category = String(body?.category || "general").trim();
    const priorityRaw = String(body?.priority || "normal").trim().toLowerCase();
    const phone = body?.phone ? String(body.phone).trim() : null;

    const priority = ALLOWED_PRIORITIES.has(priorityRaw) ? priorityRaw : "normal";

    if (!tenant_id || !title || !description) {
      return NextResponse.json(
        { error: "tenant_id, title, and description are required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("maintenance_requests")
      .insert({
        tenant_id,
        property_id,
        unit_id,
        title,
        description,
        category,
        priority,
        status: "submitted",
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error("Insert maintenance request failed", error);
      return NextResponse.json(
        { error: "Failed to create request." },
        { status: 500 }
      );
    }

    await writeAuditLog({
      actor_role: "tenant",
      entity_type: "maintenance_request",
      entity_id: data.id,
      action: "created",
      metadata: {
        tenant_id,
        category,
        priority,
      },
    });

    if (phone) {
      await sendSms({
        to: phone,
        body: `FINCA received your request: ${title}`,
      });
    }

    return NextResponse.json({ request: data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/requests failed", error);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
