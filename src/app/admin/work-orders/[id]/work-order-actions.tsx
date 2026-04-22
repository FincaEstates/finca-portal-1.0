"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "@/components/layout/portal-shell.module.css";

type WorkOrderRecord = {
  id: string;
  status: string;
  assigned_to: string | null;
};

export default function WorkOrderActions({
  workOrder,
}: {
  workOrder: WorkOrderRecord;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(workOrder.status || "open");
  const [assignedTo, setAssignedTo] = useState(workOrder.assigned_to || "");
  const [completionNotes, setCompletionNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function saveChanges() {
    setLoading(true);

    const response = await fetch(`/api/work-orders/${workOrder.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
        assignedTo,
        completionNotes,
      }),
    });

    setLoading(false);

    if (response.ok) {
      if (status === "completed") {
        router.push("/admin/work-orders/history");
      } else {
        router.refresh();
      }
    }
  }

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Update Work Order</h3>

      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label className={styles.label}>Status</label>
          <select
            className={styles.select}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="open">Open</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="overdue">Overdue</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Assigned To</label>
          <input
            className={styles.input}
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
          />
        </div>

        <div className={`${styles.field} ${styles.fieldFull}`}>
          <label className={styles.label}>Completion Notes</label>
          <textarea
            className={styles.textarea}
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.buttonRow}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={saveChanges}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}