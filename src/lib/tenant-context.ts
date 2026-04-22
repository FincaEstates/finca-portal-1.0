import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

type TenantRecord = {
  id: string;
  profile_id: string | null;
};

type ProfileRecord = {
  id: string;
  role: string | null;
  full_name: string | null;
};

export async function getTenantContext() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", user.id)
    .single<ProfileRecord>();

  if (profile?.role === "admin") {
    redirect("/admin");
  }

  const { data: tenantRecord, error: tenantError } = await supabase
    .from("tenants")
    .select("id, profile_id")
    .eq("profile_id", user.id)
    .maybeSingle<TenantRecord>();

  const fallbackTenantId = process.env.DEMO_TENANT_ID?.trim() || "";
  const tenantId = tenantRecord?.id || fallbackTenantId;

  return {
    supabase,
    user,
    profile,
    tenantRecord: tenantRecord ?? null,
    tenantId,
    tenantLookupError:
      tenantId
        ? null
        : tenantError?.message || "No tenant record found for this user.",
  };
}
