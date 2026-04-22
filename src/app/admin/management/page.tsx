import PortalSection from "@/components/layout/PortalSection";
import PortalShell from "@/components/layout/PortalShell";
import PortalSidebar from "@/components/layout/PortalSidebar";
import LogoutButton from "@/components/LogoutButton";
import shellStyles from "@/components/layout/portal-shell.module.css";
import { createClient } from "@/lib/supabase-server";
import { adminNav } from "@/lib/admin-nav";
import { redirect } from "next/navigation";
import TenantManagementForms from "./tenant-management-forms";

export default async function AdminManagementPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/tenant");

  return (
    <PortalShell
      title="Admin Portal"
      subtitle={`Welcome${
        profile?.full_name ? `, ${profile.full_name}` : ""
      }. Portfolio operations workspace for notes, charges, leases, and internal request creation.`}
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
          title="Management"
          description="Admin control center for tenant records, ledger activity, documents, and internal intake."
        >
          <div className={shellStyles.topBarRow}>
            <div />
            <LogoutButton />
          </div>

          <TenantManagementForms />
        </PortalSection>

        <PortalSection
          title="Portfolio Standard"
          description="Use this area for controlled recordkeeping, not casual edits."
        >
          <ul className={shellStyles.bulletList}>
            <li>Post notes only when they should remain in the tenant record.</li>
            <li>Verify charge amounts before posting to the ledger.</li>
            <li>Upload leases and notices through the document workflow.</li>
            <li>Create admin requests when internal operations need a formal trail.</li>
          </ul>
        </PortalSection>
      </div>
    </PortalShell>
  );
}
