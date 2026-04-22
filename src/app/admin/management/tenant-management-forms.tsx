"use client";

import { useMemo, useState } from "react";
import styles from "./tenant-management-forms.module.css";

type UploadResponse = {
  bucket: string;
  path: string;
  fileName: string;
  mimeType?: string | null;
  fileSize?: number | null;
};

type StatusTone = "neutral" | "success" | "error";

export default function TenantManagementForms() {
  const [tenantId, setTenantId] = useState("");

  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");

  const [ledgerDescription, setLedgerDescription] = useState("");
  const [ledgerAmount, setLedgerAmount] = useState("");

  const [documentTitle, setDocumentTitle] = useState("");
  const [documentCategory, setDocumentCategory] = useState("lease");

  const [requestTitle, setRequestTitle] = useState("");
  const [requestDescription, setRequestDescription] = useState("");

  const [statusMessage, setStatusMessage] = useState("Ready.");
  const [statusTone, setStatusTone] = useState<StatusTone>("neutral");
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const statusClassName = useMemo(() => {
    if (statusTone === "success") {
      return `${styles.status} ${styles.statusSuccess}`;
    }
    if (statusTone === "error") {
      return `${styles.status} ${styles.statusError}`;
    }
    return styles.status;
  }, [statusTone]);

  function setStatus(message: string, tone: StatusTone = "neutral") {
    setStatusMessage(message);
    setStatusTone(tone);
  }

  function requireTenantId() {
    if (!tenantId.trim()) {
      setStatus("Tenant id is required before using these tools.", "error");
      return false;
    }
    return true;
  }

  async function createNote() {
    if (!requireTenantId()) return;
    if (!noteText.trim()) {
      setStatus("Note text is required.", "error");
      return;
    }

    setBusyAction("note");
    setStatus("Creating note...");

    try {
      const res = await fetch("/api/admin/tenant-note", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant_id: tenantId.trim(),
          title: noteTitle.trim() || null,
          note_text: noteText.trim(),
          visible_to_tenant: true,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setStatus(json.error || "Failed to create note.", "error");
        return;
      }

      setNoteTitle("");
      setNoteText("");
      setStatus("Tenant note created successfully.", "success");
    } catch (error) {
      console.error("createNote failed", error);
      setStatus("Unexpected error while creating note.", "error");
    } finally {
      setBusyAction(null);
    }
  }

  async function createLedgerEntry() {
    if (!requireTenantId()) return;
    if (!ledgerDescription.trim()) {
      setStatus("Ledger description is required.", "error");
      return;
    }

    const amount = Number(ledgerAmount);
    if (Number.isNaN(amount)) {
      setStatus("Enter a valid ledger amount.", "error");
      return;
    }

    setBusyAction("ledger");
    setStatus("Creating ledger entry...");

    try {
      const res = await fetch("/api/admin/ledger-entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant_id: tenantId.trim(),
          description: ledgerDescription.trim(),
          amount,
          entry_type: "charge",
          status: "open",
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setStatus(json.error || "Failed to create ledger entry.", "error");
        return;
      }

      setLedgerDescription("");
      setLedgerAmount("");
      setStatus("Ledger entry created successfully.", "success");
    } catch (error) {
      console.error("createLedgerEntry failed", error);
      setStatus("Unexpected error while creating ledger entry.", "error");
    } finally {
      setBusyAction(null);
    }
  }

  async function createAdminRequest() {
    if (!requireTenantId()) return;
    if (!requestTitle.trim() || !requestDescription.trim()) {
      setStatus("Request title and description are required.", "error");
      return;
    }

    setBusyAction("request");
    setStatus("Creating admin request...");

    try {
      const res = await fetch("/api/admin/create-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant_id: tenantId.trim(),
          title: requestTitle.trim(),
          description: requestDescription.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setStatus(json.error || "Failed to create request.", "error");
        return;
      }

      setRequestTitle("");
      setRequestDescription("");
      setStatus("Admin request created successfully.", "success");
    } catch (error) {
      console.error("createAdminRequest failed", error);
      setStatus("Unexpected error while creating request.", "error");
    } finally {
      setBusyAction(null);
    }
  }

  async function uploadDocument(file: File) {
    if (!requireTenantId()) return;

    setBusyAction("document");
    setStatus("Uploading file...");

    try {
      const uploadRes = await fetch("/api/uploads", {
        method: "POST",
        headers: {
          "x-upload-mode": "raw",
          "x-file-name": encodeURIComponent(file.name),
          "x-file-type": file.type || "application/octet-stream",
          "x-bucket": "tenant-documents",
          "x-folder": encodeURIComponent(tenantId.trim()),
        },
        body: file,
        cache: "no-store",
      });

      const uploadJson = await uploadRes.json();

      if (!uploadRes.ok) {
        setStatus(uploadJson.error || "Upload failed.", "error");
        return;
      }

      const uploadData = uploadJson as UploadResponse;

      setStatus("Saving document record...");

      const docRes = await fetch("/api/admin/tenant-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant_id: tenantId.trim(),
          title: documentTitle.trim() || file.name,
          file_name: uploadData.fileName,
          file_path: uploadData.path,
          bucket: uploadData.bucket,
          mime_type: uploadData.mimeType || file.type || null,
          file_size: uploadData.fileSize || file.size || null,
          category: documentCategory,
          visible_to_tenant: true,
        }),
      });

      const docJson = await docRes.json();

      if (!docRes.ok) {
        setStatus(docJson.error || "Failed to create document record.", "error");
        return;
      }

      setDocumentTitle("");
      setDocumentCategory("lease");
      setStatus("Document uploaded and posted to the tenant portal.", "success");
    } catch (error) {
      console.error("uploadDocument failed", error);
      setStatus("Unexpected error while uploading document.", "error");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.banner}>
        <p className={styles.bannerTitle}>Portfolio Operations</p>
        <p className={styles.bannerText}>
          Centralized control over tenant notes, charges, document distribution,
          and internal request intake.
        </p>
      </div>

      <div className={statusClassName}>{statusMessage}</div>

      <div className={styles.grid}>
        <section className={`${styles.card} ${styles.full}`}>
          <h2 className={styles.cardTitle}>Tenant Target</h2>
          <p className={styles.cardSubtitle}>
            All actions below post to the tenant record tied to this id.
          </p>

          <div className={styles.fieldGroup}>
            <div>
              <label className={styles.label} htmlFor="tenant-id">
                Tenant id
              </label>
              <input
                id="tenant-id"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                placeholder="Paste tenant UUID"
                className={styles.input}
              />
              <p className={styles.helper}>
                Use the Tenant Record id from the tenants table.
              </p>
            </div>
          </div>
        </section>

        <section className={`${styles.card} ${styles.half}`}>
          <h2 className={styles.cardTitle}>Create Note</h2>
          <p className={styles.cardSubtitle}>
            Add a tenant-visible note to the portal record.
          </p>

          <div className={styles.fieldGroup}>
            <div>
              <label className={styles.label} htmlFor="note-title">
                Note Title
              </label>
              <input
                id="note-title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Example: Parking Reminder"
                className={styles.input}
              />
            </div>

            <div>
              <label className={styles.label} htmlFor="note-text">
                Note Text
              </label>
              <textarea
                id="note-text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write the note shown to the tenant."
                className={styles.textarea}
              />
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                onClick={createNote}
                disabled={busyAction !== null}
                className={styles.primaryButton}
              >
                {busyAction === "note" ? "Creating..." : "Create Note"}
              </button>
            </div>
          </div>
        </section>

        <section className={`${styles.card} ${styles.half}`}>
          <h2 className={styles.cardTitle}>Create Ledger Entry</h2>
          <p className={styles.cardSubtitle}>
            Post a charge to the tenant ledger.
          </p>

          <div className={styles.fieldGroup}>
            <div>
              <label className={styles.label} htmlFor="ledger-description">
                Description
              </label>
              <input
                id="ledger-description"
                value={ledgerDescription}
                onChange={(e) => setLedgerDescription(e.target.value)}
                placeholder="Example: Late Fee"
                className={styles.input}
              />
            </div>

            <div>
              <label className={styles.label} htmlFor="ledger-amount">
                Amount
              </label>
              <input
                id="ledger-amount"
                value={ledgerAmount}
                onChange={(e) => setLedgerAmount(e.target.value)}
                placeholder="0.00"
                type="number"
                step="0.01"
                className={styles.input}
              />
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                onClick={createLedgerEntry}
                disabled={busyAction !== null}
                className={styles.primaryButton}
              >
                {busyAction === "ledger" ? "Posting..." : "Create Ledger Entry"}
              </button>
            </div>
          </div>
        </section>

        <section className={`${styles.card} ${styles.half}`}>
          <h2 className={styles.cardTitle}>Upload Lease / Document</h2>
          <p className={styles.cardSubtitle}>
            Upload a lease, notice, or general document to the tenant portal.
          </p>

          <div className={styles.fieldGroup}>
            <div>
              <label className={styles.label} htmlFor="document-title">
                Document Title
              </label>
              <input
                id="document-title"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Example: 2026 Lease Agreement"
                className={styles.input}
              />
            </div>

            <div>
              <label className={styles.label} htmlFor="document-category">
                Category
              </label>
              <select
                id="document-category"
                value={documentCategory}
                onChange={(e) => setDocumentCategory(e.target.value)}
                className={styles.select}
              >
                <option value="lease">Lease</option>
                <option value="notice">Notice</option>
                <option value="general">General</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className={styles.label} htmlFor="document-file">
                File
              </label>
              <input
                id="document-file"
                type="file"
                className={styles.fileInput}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    void uploadDocument(file);
                    e.currentTarget.value = "";
                  }
                }}
              />
            </div>
          </div>
        </section>

        <section className={`${styles.card} ${styles.half}`}>
          <h2 className={styles.cardTitle}>Create Admin Request</h2>
          <p className={styles.cardSubtitle}>
            Create a maintenance request internally without the tenant intake form.
          </p>

          <div className={styles.fieldGroup}>
            <div>
              <label className={styles.label} htmlFor="request-title">
                Request Title
              </label>
              <input
                id="request-title"
                value={requestTitle}
                onChange={(e) => setRequestTitle(e.target.value)}
                placeholder="Example: Replace kitchen filter"
                className={styles.input}
              />
            </div>

            <div>
              <label className={styles.label} htmlFor="request-description">
                Description
              </label>
              <textarea
                id="request-description"
                value={requestDescription}
                onChange={(e) => setRequestDescription(e.target.value)}
                placeholder="Describe the issue clearly."
                className={styles.textarea}
              />
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                onClick={createAdminRequest}
                disabled={busyAction !== null}
                className={styles.primaryButton}
              >
                {busyAction === "request" ? "Creating..." : "Create Request"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
