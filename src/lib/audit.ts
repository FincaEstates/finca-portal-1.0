import { createAdminClient } from "@/lib/supabase-server";

type AuditInput = {
  actor_profile_id?: string | null;
  actor_role?: string | null;
  entity_type: string;
  entity_id?: string | null;
  action: string;
  metadata?: Record<string, unknown> | null;
};

export async function writeAuditLog(input: AuditInput) {
  try {
    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin.from("audit_log").insert({
      actor_profile_id: input.actor_profile_id ?? null,
      actor_role: input.actor_role ?? null,
      entity_type: input.entity_type,
      entity_id: input.entity_id ?? null,
      action: input.action,
      metadata: input.metadata ?? null,
    });

    if (error) {
      console.error("writeAuditLog insert failed", error);
    }
  } catch (error) {
    console.error("writeAuditLog failed", error);
  }
}
