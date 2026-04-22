import PortalSection from "@/components/layout/PortalSection";
import PortalShell from "@/components/layout/PortalShell";
import PortalSidebar from "@/components/layout/PortalSidebar";
import RequestForm from "@/components/RequestForm";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

const tenantNav = [
  { label: "Dashboard", href: "/tenant" },
  { label: "Maintenance Request", href: "/request" },
  { label: "Ledger", href: "/tenant/ledger" },
  { label: "Lease & Documents", href: "/tenant/lease" },
  { label: "Notes", href: "/tenant/notes" },
  { label: "Maintenance History", href: "/tenant/history" },
];

export default async function RequestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "tenant") redirect("/admin");

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, property_name, unit")
    .eq("profile_id", user.id)
    .single();

  return (
    <PortalShell
      title="Maintenance Request"
      subtitle="Submit a maintenance issue for your unit."
      sidebar={
        <PortalSidebar portalName="Tenant Portal" homeHref="/tenant" items={tenantNav} />
      }
    >
      <PortalSection
        title="Request Form"
        description="Provide the issue type, priority, and a clear description so the request can be reviewed and processed."
      >
        <RequestForm tenantId={tenant?.id ?? ""} propertyName={tenant?.property_name ?? ""} unit={tenant?.unit ?? ""} />
      </PortalSection>
    </PortalShell>
  );
}
