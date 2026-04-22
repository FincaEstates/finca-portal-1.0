import Link from "next/link";
import PortalSection from "@/components/layout/PortalSection";
import PortalShell from "@/components/layout/PortalShell";
import PortalSidebar from "@/components/layout/PortalSidebar";
import LogoutButton from "@/components/LogoutButton";
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

export default async function TenantPage() {
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

  if (profile?.role !== "tenant") redirect("/admin");

  return (
    <PortalShell
      title="Tenant Portal"
      subtitle={`Welcome${profile?.full_name ? `, ${profile.full_name}` : ""}. Access maintenance requests, ledger records, lease documents, notes, and maintenance history.`}
      sidebar={
        <PortalSidebar portalName="Tenant Portal" homeHref="/tenant" items={tenantNav} />
      }
    >
      <div className={styles.stack}>
        <PortalSection
          title="Dashboard"
          description="Use the navigation menu to access your tenant tools and property information."
        >
          <div className={styles.topBarRow}>
            <div />
            <LogoutButton />
          </div>

          <div className={styles.cardGrid}>
            <Link href="/request" className={styles.card}>
              <h3 className={styles.cardTitle}>Maintenance Request</h3>
              <p className={styles.cardText}>Submit a maintenance issue and attach supporting photos when needed.</p>
            </Link>

            <Link href="/tenant/ledger" className={styles.card}>
              <h3 className={styles.cardTitle}>Ledger</h3>
              <p className={styles.cardText}>Review your charges, payments, balances, and account activity.</p>
            </Link>

            <Link href="/tenant/lease" className={styles.card}>
              <h3 className={styles.cardTitle}>Lease & Documents</h3>
              <p className={styles.cardText}>Access your lease and related property documents.</p>
            </Link>

            <Link href="/tenant/notes" className={styles.card}>
              <h3 className={styles.cardTitle}>Notes</h3>
              <p className={styles.cardText}>View communication updates, notices, and tenant-facing notes.</p>
            </Link>

            <Link href="/tenant/history" className={styles.card}>
              <h3 className={styles.cardTitle}>Maintenance History</h3>
              <p className={styles.cardText}>Review completed maintenance activity related to your property.</p>
            </Link>
          </div>
        </PortalSection>
      </div>
    </PortalShell>
  );
}
