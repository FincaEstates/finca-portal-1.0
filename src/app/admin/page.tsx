import PortalSection from "@/components/layout/PortalSection";
import PortalShell from "@/components/layout/PortalShell";
import PortalSidebar from "@/components/layout/PortalSidebar";
import LogoutButton from "@/components/LogoutButton";
import styles from "@/components/layout/portal-shell.module.css";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export const adminNav = [
  { label: "Dashboard", href: "/admin" },
  { label: "Management", href: "/admin/management" },
  { label: "Submitted Requests", href: "/admin/requests" },
  { label: "Active Work Orders", href: "/admin/work-orders" },
  { label: "Work Order History", href: "/admin/work-orders/history" },
  { label: "Tenant Directory", href: "/admin/tenants" },
];

export default async function AdminPage() {
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

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString();

  const [
    openRequestsRes,
    activeWorkOrdersRes,
    overdueWorkOrdersRes,
    completedThisMonthRes,
  ] = await Promise.all([
    supabase
      .from("maintenance_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "submitted"),
    supabase
      .from("work_orders")
      .select("*", { count: "exact", head: true })
      .in("status", ["open", "scheduled", "in_progress"]),
    supabase
      .from("work_orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "overdue"),
    supabase
      .from("work_orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("completed_at", firstOfMonth),
  ]);

  return (
    <PortalShell
      title="Admin Portal"
      subtitle={`Welcome${profile?.full_name ? `, ${profile.full_name}` : ""}. Internal operations workspace for maintenance requests, active work orders, historical records, and property management workflows.`}
      sidebar={
        <PortalSidebar
          portalName="Admin Portal"
          homeHref="/admin"
          items={adminNav}
        />
      }
    >
      <div className={styles.stack}>
        <PortalSection
          title="Dashboard"
          description="Live operational metrics pulled from maintenance requests and work orders."
        >
          <div className={styles.topBarRow}>
            <div />
            <LogoutButton />
          </div>

          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Open Requests</p>
              <p className={styles.kpiValue}>{openRequestsRes.count ?? 0}</p>
            </div>
            <div className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Active Work Orders</p>
              <p className={styles.kpiValue}>{activeWorkOrdersRes.count ?? 0}</p>
            </div>
            <div className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Overdue</p>
              <p className={styles.kpiValue}>{overdueWorkOrdersRes.count ?? 0}</p>
            </div>
            <div className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Completed This Month</p>
              <p className={styles.kpiValue}>
                {completedThisMonthRes.count ?? 0}
              </p>
            </div>
          </div>
        </PortalSection>

        <PortalSection
          title="Operational Standard"
          description="This dashboard is the control center for admin operations."
        >
          <ul className={styles.bulletList}>
            <li>Use Submitted Requests as the intake queue.</li>
            <li>Use Active Work Orders as the live execution board.</li>
            <li>Use Work Order History as the archive.</li>
            <li>Do not expose tenant financial or document data outside role boundaries.</li>
          </ul>
        </PortalSection>
      </div>
    </PortalShell>
  );
}
