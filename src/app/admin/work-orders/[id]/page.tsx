import PortalSection from "@/components/layout/PortalSection";
import PortalShell from "@/components/layout/PortalShell";
import PortalSidebar from "@/components/layout/PortalSidebar";
import styles from "@/components/layout/portal-shell.module.css";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import WorkOrderActions from "./work-order-actions";

const adminNav = [
  { label: "Dashboard", href: "/admin" },
  { label: "Submitted Requests", href: "/admin/requests" },
  { label: "Active Work Orders", href: "/admin/work-orders" },
  { label: "Work Order History", href: "/admin/work-orders/history" },
];

export default async function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: workOrder } = await supabase
    .from("work_orders")
    .select("*")
    .eq("id", id)
    .single();

  if (!workOrder) redirect("/admin/work-orders");

  return (
    <PortalShell
      title="Work Order"
      subtitle="Review and manage the selected work order."
      sidebar={
        <PortalSidebar portalName="Admin Portal" homeHref="/admin" items={adminNav} />
      }
    >
      <PortalSection title="Work Order Details">
        <div className={styles.cardGrid}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Property</h3>
            <p className={styles.cardText}>{workOrder.property_name}</p>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Unit</h3>
            <p className={styles.cardText}>{workOrder.unit}</p>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Assigned To</h3>
            <p className={styles.cardText}>{workOrder.assigned_to || "Unassigned"}</p>
          </div>
        </div>

        <div className={styles.card} style={{ marginTop: 20 }}>
          <h3 className={styles.cardTitle}>Current Status</h3>
          <p className={styles.cardText}>{workOrder.status}</p>
        </div>

        <div style={{ marginTop: 20 }}>
          <WorkOrderActions workOrder={workOrder} />
        </div>
      </PortalSection>
    </PortalShell>
  );
}