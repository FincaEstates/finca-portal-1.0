import Link from "next/link";

export default function TenantPaymentSuccessPage() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Payment Submitted</h1>
        <p className="mt-3 text-sm text-slate-600">
          Your payment was submitted successfully. If the ledger does not update immediately,
          refresh the page in a few seconds.
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            href="/tenant/ledger"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Return to Ledger
          </Link>
          <Link
            href="/tenant"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Back to Portal
          </Link>
        </div>
      </div>
    </main>
  );
}
