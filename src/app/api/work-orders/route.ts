import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { sendSms } from "@/lib/sms";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { maintenanceRequestId, propertyName, unit, assignedTo } = body;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { data: existingRequest } = await supabase
      .from("maintenance_requests")
      .select("id, tenant_id, phone")
      .eq("id", maintenanceRequestId)
      .single();

    if (!existingRequest) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    const { data: workOrder, error } = await supabase
      .from("work_orders")
      .insert({
        maintenance_request_id: maintenanceRequestId,
        property_name: propertyName,
        unit,
        assigned_to: assignedTo || null,
        status: "open",
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase
      .from("maintenance_requests")
      .update({ status: "approved" })
      .eq("id", maintenanceRequestId);

   if (existingRequest.phone) {
  await sendSms({
    to: existingRequest.phone,
    body: `Your maintenance request has been approved and converted into a work order.
Work Order id: ${workOrder.id}`,
  });
}

    return NextResponse.json({ success: true, id: workOrder.id });
  } catch {
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
