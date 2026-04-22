import PortalSection from "@/components/layout/PortalSection";
import PortalShell from "@/components/layout/PortalShell";
import PortalSidebar from "@/components/layout/PortalSidebar";
import LogoutButton from "@/components/LogoutButton";
import shellStyles from "@/components/layout/portal-shell.module.css";
import { createClient } from "@/lib/supabase-server";
import { adminNav } from "@/lib/admin-nav";
import { redirect } from "next/navigation";

type TenantRow = {
  id: string;
  profile_id: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  role: string | null;
};

export default async function AdminTenantsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (adminProfile?.role !== "admin") redirect("/tenant");

  const { data: tenantData, error: tenantError } = await supabase
    .from("tenants")
    .select("id, profile_id")
    .order("id", { ascending: true });

  const tenants = (tenantData || []) as TenantRow[];

  const profileIds = tenants
    .map((tenant) => tenant.profile_id)
    .filter((value): value is string => Boolean(value));

  let profilesById: Record<string, ProfileRow> = {};

  if (profileIds.length > 0) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("id", profileIds);

    profilesById = Object.fromEntries(
      ((profileData || []) as ProfileRow[]).map((profile) => [profile.id, profile])
    );
  }

  return (
    <PortalShell
      title="Admin Portal"
      subtitle={`Welcome${
        adminProfile?.full_name ? `, ${adminProfile.full_name}` : ""
      }. Tenant directory for record lookup and portfolio administration.`}
      sidebar={
        <PortalSidebar
          portalName="Admin Portal"
          homeHref="/admin"
          items={adminNav}
        />
      }
    >
      <div className={shellStyles.stack}>
        <PortalSection
          title="Tenant Directory"
          description="Use the Tenant Record id below in the Management workspace."
        >
          <div className={shellStyles.topBarRow}>
            <div />
            <LogoutButton />
          </div>

          {tenantError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              Failed to load tenant directory: {tenantError.message}
            </div>
          ) : tenants.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500">
              No tenant records found.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100 text-left text-slate-700">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Tenant</th>
                      <th className="px-5 py-4 font-semibold">Role</th>
                      <th className="px-5 py-4 font-semibold">Tenant Record id</th>
                      <th className="px-5 py-4 font-semibold">Profile id</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {tenants.map((tenant) => {
                      const profile = tenant.profile_id
                        ? profilesById[tenant.profile_id]
                        : undefined;

                      return (
                        <tr key={tenant.id} className="hover:bg-slate-50">
                          <td className="px-5 py-4 font-medium text-slate-900">
                            {profile?.full_name || "Unnamed Tenant"}
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {profile?.role || "tenant"}
                          </td>
                          <td className="px-5 py-4 font-mono text-xs text-slate-700">
                            {tenant.id}
                          </td>
                          <td className="px-5 py-4 font-mono text-xs text-slate-500">
                            {tenant.profile_id || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </PortalSection>

        <PortalSection
          title="Important"
          description="Use the Tenant Record id in Management. Do not paste the profile id into tenant_id fields."
        >
          <ul className={shellStyles.bulletList}>
            <li>Tenant Record id comes from the tenants table.</li>
            <li>Profile id comes from the profiles table.</li>
            <li>Your management actions use tenant_id, which points to tenants.id.</li>
          </ul>
        </PortalSection>
      </div>
    </PortalShell>
  );
}
