import PortalSection from "@/components/layout/PortalSection";
import PortalShell from "@/components/layout/PortalShell";
import PortalSidebar from "@/components/layout/PortalSidebar";
import styles from "@/components/layout/portal-shell.module.css";
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

export default async function TenantHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "tenant") redirect("/admin");

  const { data: tenant } = await supabase.from("tenants").select("id").eq("profile_id", user.id).single();

  const { data: requests } = await supabase
    .from("maintenance_requests")
    .select("*")
    .eq("tenant_id", tenant?.id)
    .in("status", ["approved", "completed", "closed"])
    .order("created_at", { ascending: false });

  return (
    <PortalShell
      title="Maintenance History"
      subtitle="Review previously submitted and completed maintenance activity tied to your unit."
      sidebar={<PortalSidebar portalName="Tenant Portal" homeHref="/tenant" items={tenantNav} />}
    >
      <PortalSection title="Request History">
        {!requests?.length ? (
          <div className={styles.emptyState}>
            <h3 className={styles.emptyTitle}>No Maintenance History Found</h3>
            <p className={styles.emptyText}>Completed or approved maintenance activity will appear here once available.</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.issue_category}</td>
                    <td>{request.priority}</td>
                    <td>{request.status}</td>
                    <td>{new Date(request.created_at).toLocaleString()}</td>
                    <td>{request.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PortalSection>
    </PortalShell>
  );
}
