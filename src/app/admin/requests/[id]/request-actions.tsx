"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "@/components/layout/portal-shell.module.css";

type RequestRecord = {
  id: string;
  property_name: string;
  unit: string;
  tenant_name: string;
  phone: string;
  issue_category: string;
  priority: string;
  description: string;
};

export default function RequestActions({ request }: { request: RequestRecord }) {
  const router = useRouter();
  const [assignedTo, setAssignedTo] = useState("");
  const [loading, setLoading] = useState(false);

  async function convertToWorkOrder() {
    setLoading(true);

    const response = await fetch("/api/work-orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        maintenanceRequestId: request.id,
        propertyName: request.property_name,
        unit: request.unit,
        assignedTo,
      }),
    });

    setLoading(false);

    if (response.ok) {
      router.push("/admin/work-orders");
      router.refresh();
    }
  }

  async function rejectRequest() {
    setLoading(true);

    const response = await fetch(`/api/requests/${request.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "rejected",
      }),
    });

    setLoading(false);

    if (response.ok) {
      router.push("/admin/requests");
      router.refresh();
    }
  }

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Admin Actions</h3>
      <p className={styles.sectionDescription}>
        Assign this request and convert it into a live work order, or reject it if it should not proceed.
      </p>

      <div className={styles.formGrid}>
        <div className={styles.field + " " + styles.fieldFull}>
          <label className={styles.label}>Assigned To</label>
          <input
            className={styles.input}
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            placeholder="Maintenance Staff or Vendor"
          />
        </div>
      </div>

      <div className={styles.actionRow} style={{ marginTop: 18 }}>
        <button
          className={styles.primaryButton}
          type="button"
          onClick={convertToWorkOrder}
          disabled={loading}
        >
          {loading ? "Processing..." : "Convert to Work Order"}
        </button>

        <button
          className={styles.secondaryButton}
          type="button"
          onClick={rejectRequest}
          disabled={loading}
        >
          Reject Request
        </button>
      </div>
    </div>
  );
}