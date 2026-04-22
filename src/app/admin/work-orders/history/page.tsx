import PortalSection from "@/components/layout/PortalSection";
import PortalShell from "@/components/layout/PortalShell";
import PortalSidebar from "@/components/layout/PortalSidebar";
import styles from "@/components/layout/portal-shell.module.css";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

const adminNav = [
  { label: "Dashboard", href: "/admin" },
  { label: "Submitted Requests", href: "/admin/requests" },
  { label: "Active Work Orders", href: "/admin/work-orders" },
  { label: "Work Order History", href: "/admin/work-orders/history" },
];

export default async function WorkOrderHistoryPage() {
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

  if (profile?.role !== "admin") redirect("/tenant");

  const { data: history } = await supabase
    .from("work_orders")
    .select("*")
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  return (
    <PortalShell
      title="Work Order History"
      subtitle="Archive of completed maintenance activity."
      sidebar={
        <PortalSidebar portalName="Admin Portal" homeHref="/admin" items={adminNav} />
      }
    >
      <PortalSection
        title="Completed Work Orders"
        description="Completed records remain here for documentation and review."
      >
        {!history?.length ? (
          <div className={styles.emptyState}>
            <h3 className={styles.emptyTitle}>No Completed Work Orders</h3>
            <p className={styles.emptyText}>
              Completed work orders will appear here after they are closed.
            </p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Unit</th>
                  <th>Assigned To</th>
                  <th>Completed</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {history.map((workOrder) => (
                  <tr key={workOrder.id}>
                    <td>{workOrder.property_name}</td>
                    <td>{workOrder.unit}</td>
                    <td>{workOrder.assigned_to || "Unassigned"}</td>
                    <td>
                      {workOrder.completed_at
                        ? new Date(workOrder.completed_at).toLocaleString()
                        : ""}
                    </td>
                    <td>{workOrder.completion_notes || "—"}</td>
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
