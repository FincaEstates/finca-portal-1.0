import PortalSection from "@/components/layout/PortalSection";
import PortalShell from "@/components/layout/PortalShell";
import PortalSidebar from "@/components/layout/PortalSidebar";
import LogoutButton from "@/components/LogoutButton";
import shellStyles from "@/components/layout/portal-shell.module.css";
import { tenantNav } from "@/lib/tenant-nav";
import { getTenantContext } from "@/lib/tenant-context";
import PaymentButton from "./payment-button";

type LedgerRow = {
  id: string;
  entry_date: string | null;
  description: string | null;
  amount: number | null;
  entry_type: string | null;
  status: string | null;
  created_at?: string | null;
};

function signedAmount(entry: LedgerRow) {
  const raw = Math.abs(Number(entry.amount || 0));
  const type = (entry.entry_type || "charge").toLowerCase();

  if (type === "payment" || type === "credit") {
    return -raw;
  }

  return raw;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default async function TenantLedgerPage() {
  const { profile, supabase, tenantId, tenantLookupError } =
    await getTenantContext();

  let entries: LedgerRow[] = [];
  let ledgerError: string | null = null;

  if (tenantId) {
    const { data, error } = await supabase
      .from("ledger_entries")
      .select("id, entry_date, description, amount, entry_type, status, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      ledgerError = error.message;
    } else {
      entries = (data || []) as LedgerRow[];
    }
  }

  const activeEntries = entries.filter(
    (entry) =>
      (entry.status || "").toLowerCase() !== "paid" &&
      (entry.status || "").toLowerCase() !== "void"
  );

  const currentBalance = activeEntries.reduce(
    (sum, entry) => sum + signedAmount(entry),
    0
  );

  const totalCharges = entries
    .filter((entry) => {
      const type = (entry.entry_type || "charge").toLowerCase();
      return type === "charge" || type === "fee";
    })
    .reduce((sum, entry) => sum + Math.abs(Number(entry.amount || 0)), 0);

  const totalCreditsAndPayments = entries
    .filter((entry) => {
      const type = (entry.entry_type || "").toLowerCase();
      return type === "payment" || type === "credit";
    })
    .reduce((sum, entry) => sum + Math.abs(Number(entry.amount || 0)), 0);

  const openItemCount = activeEntries.filter((entry) => signedAmount(entry) > 0).length;

  return (
    <PortalShell
      title="Tenant Portal"
      subtitle={`Welcome${
        profile?.full_name ? `, ${profile.full_name}` : ""
      }. Current balance and historical financial activity for your tenancy.`}
      sidebar={
        <PortalSidebar
          portalName="Tenant Portal"
          homeHref="/tenant"
          items={tenantNav}
        />
      }
    >
      <div className={shellStyles.stack}>
        <PortalSection
          title="Ledger"
          description="Current balance and historical financial activity for your tenancy."
        >
          <div className={shellStyles.topBarRow}>
            <div />
            <LogoutButton />
          </div>

          {tenantLookupError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {tenantLookupError}
            </div>
          ) : ledgerError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {ledgerError}
            </div>
          ) : (
            <>
              <div className="mb-6 grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Current Balance
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {formatCurrency(currentBalance)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total Charges
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {formatCurrency(totalCharges)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Payments & Credits
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {formatCurrency(totalCreditsAndPayments)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Open Items
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {openItemCount}
                  </p>
                </div>
              </div>

              {entries.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                  <div className="text-2xl font-semibold text-slate-900">
                    No Ledger Activity
                  </div>
                  <p className="mt-3">Ledger items will appear here when posted.</p>
                  <p className="mt-4 text-xs text-slate-400">
                    Tenant record: {tenantId || "missing"}
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-100 text-left text-slate-700">
                        <tr>
                          <th className="px-5 py-4 font-semibold">Date</th>
                          <th className="px-5 py-4 font-semibold">Description</th>
                          <th className="px-5 py-4 font-semibold">Type</th>
                          <th className="px-5 py-4 font-semibold">Status</th>
                          <th className="px-5 py-4 font-semibold">Amount</th>
                          <th className="px-5 py-4 font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {entries.map((entry) => {
                          const displayAmount = signedAmount(entry);
                          const canPay =
                            tenantId &&
                            displayAmount > 0 &&
                            (entry.status || "").toLowerCase() !== "paid" &&
                            (entry.status || "").toLowerCase() !== "void";

                          return (
                            <tr key={entry.id} className="hover:bg-slate-50">
                              <td className="px-5 py-4 text-slate-600">
                                {entry.entry_date || "—"}
                              </td>
                              <td className="px-5 py-4 font-medium text-slate-900">
                                {entry.description || "Ledger Item"}
                              </td>
                              <td className="px-5 py-4 text-slate-600">
                                {entry.entry_type || "charge"}
                              </td>
                              <td className="px-5 py-4 text-slate-600">
                                {entry.status || "open"}
                              </td>
                              <td className="px-5 py-4 font-semibold text-slate-900">
                                {formatCurrency(displayAmount)}
                              </td>
                              <td className="px-5 py-4">
                                {canPay ? (
                                  <PaymentButton
                                    tenantid={tenantId}
                                    ledgerEntryid={entry.id}
                                  />
                                ) : (
                                  <span className="text-xs text-slate-400">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </PortalSection>
      </div>
    </PortalShell>
  );
}
