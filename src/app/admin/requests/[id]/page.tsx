import PortalSection from "@/components/layout/PortalSection";
import PortalShell from "@/components/layout/PortalShell";
import PortalSidebar from "@/components/layout/PortalSidebar";
import styles from "@/components/layout/portal-shell.module.css";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import RequestActions from "./request-actions";

const adminNav = [
  { label: "Dashboard", href: "/admin" },
  { label: "Submitted Requests", href: "/admin/requests" },
  { label: "Active Work Orders", href: "/admin/work-orders" },
  { label: "Work Order History", href: "/admin/work-orders/history" },
];

export default async function AdminRequestDetailPage({
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

  const { data: request } = await supabase
    .from("maintenance_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (!request) redirect("/admin/requests");

  return (
    <PortalShell
      title="Request Review"
      subtitle="Review the request details and decide whether to convert it into a work order."
      sidebar={
        <PortalSidebar portalName="Admin Portal" homeHref="/admin" items={adminNav} />
      }
    >
      <PortalSection title="Request Details">
        <div className={styles.cardGrid}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Property</h3>
            <p className={styles.cardText}>{request.property_name}</p>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Unit</h3>
            <p className={styles.cardText}>{request.unit}</p>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Tenant</h3>
            <p className={styles.cardText}>{request.tenant_name}</p>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Phone</h3>
            <p className={styles.cardText}>{request.phone}</p>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Email</h3>
            <p className={styles.cardText}>{request.email || "—"}</p>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Issue Category</h3>
            <p className={styles.cardText}>{request.issue_category}</p>
          </div>
        </div>

        <div className={styles.card} style={{ marginTop: 20 }}>
          <h3 className={styles.cardTitle}>Priority</h3>
          <p className={styles.cardText}>{request.priority}</p>
        </div>

        <div className={styles.card} style={{ marginTop: 20 }}>
          <h3 className={styles.cardTitle}>Description</h3>
          <p className={styles.cardText}>{request.description}</p>
        </div>

        <div style={{ marginTop: 20 }}>
          <RequestActions request={request} />
        </div>
      </PortalSection>
    </PortalShell>
  );
}