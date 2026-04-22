import Link from "next/link";
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

function statusClass(status: string | null) {
  if (status === "completed") return styles.badgeGreen;
  if (status === "overdue") return styles.badgeRed;
  if (status === "in_progress") return styles.badgeAmber;
  return styles.badgeGray;
}

export default async function WorkOrdersPage() {
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

  const { data: workOrders } = await supabase
    .from("work_orders")
    .select("*")
    .in("status", ["open", "scheduled", "in_progress", "overdue"])
    .order("created_at", { ascending: false });

  return (
    <PortalShell
      title="Active Work Orders"
      subtitle="Manage open jobs, scheduled work, vendor assignments, and in-progress maintenance activity."
      sidebar={
        <PortalSidebar portalName="Admin Portal" homeHref="/admin" items={adminNav} />
      }
    >
      <PortalSection
        title="Live Work Orders"
        description="All active work orders currently being managed."
      >
        {!workOrders?.length ? (
          <div className={styles.emptyState}>
            <h3 className={styles.emptyTitle}>No Active Work Orders</h3>
            <p className={styles.emptyText}>
              Approved maintenance jobs will appear here once requests are converted into work orders.
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
                  <th>Status</th>
                  <th>Created</th>
                  <th>Open</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.map((workOrder) => (
                  <tr key={workOrder.id}>
                    <td>{workOrder.property_name}</td>
                    <td>{workOrder.unit}</td>
                    <td>{workOrder.assigned_to || "Unassigned"}</td>
                    <td>
                      <span className={`${styles.badge} ${statusClass(workOrder.status)}`}>
                        {workOrder.status}
                      </span>
                    </td>
                    <td>
                      {workOrder.created_at
                        ? new Date(workOrder.created_at).toLocaleString()
                        : ""}
                    </td>
                    <td>
                      <Link
                        href={`/admin/work-orders/${workOrder.id}`}
                        className={styles.secondaryButton}
                      >
                        Open
                      </Link>
                    </td>
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
