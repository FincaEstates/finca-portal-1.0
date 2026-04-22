"use client";

import { useState } from "react";

type Props = {
  tenantid: string;
  ledgerEntryid: string;
};

export default function PaymentButton({ tenantid, ledgerEntryid }: Props) {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    try {
      setLoading(true);

      const response = await fetch("/api/payments/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantId: tenantid,
          ledgerEntryId: ledgerEntryid,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to start payment.");
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Payment start failed", error);
      alert("Unable to start payment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handlePay}
      disabled={loading}
      className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-60"
    >
      {loading ? "Loading..." : "Pay Now"}
    </button>
  );
}
