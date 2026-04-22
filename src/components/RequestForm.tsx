"use client";

import { FormEvent, useState } from "react";

type RequestFormProps = {
  tenantId: string;
  propertyId?: string | null;
  propertyName?: string | null;
  unitId?: string | null;
  unit?: string | null;
  phone?: string | null;
};

export default function RequestForm({
  tenantId,
  propertyId = null,
  propertyName = null,
  unitId = null,
  unit = null,
  phone = null,
}: RequestFormProps) {
  const [title, setTitle] = useState("");
  const [issueCategory, setIssueCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          property_id: propertyId || null,
          property_name: propertyName || null,
          unit_id: unitId || null,
          unit: unit || null,
          title: title.trim() || "Maintenance Request",
          description: message.trim(),
          category: issueCategory,
          priority,
          phone: phone || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to submit request.");
      }

      setTitle("");
      setIssueCategory("general");
      setMessage("");
      setPriority("normal");
      setSuccessMessage("Request submitted successfully.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Short title (e.g. Leaking sink)"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-black"
          required
        />
      </div>

      <div>
        <label
          htmlFor="issueCategory"
          className="mb-1 block text-sm font-medium"
        >
          Category
        </label>
        <select
          id="issueCategory"
          value={issueCategory}
          onChange={(e) => setIssueCategory(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-black"
        >
          <option value="general">General</option>
          <option value="plumbing">Plumbing</option>
          <option value="electrical">Electrical</option>
          <option value="hvac">HVAC</option>
          <option value="appliance">Appliance</option>
          <option value="locksmith">Locksmith</option>
          <option value="pest-control">Pest Control</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="priority" className="mb-1 block text-sm font-medium">
          Priority
        </label>
        <select
          id="priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-black"
        >
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="mb-1 block text-sm font-medium">
          Description
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe the issue"
          className="min-h-[140px] w-full rounded-md border border-gray-300 px-3 py-2 text-black"
          required
        />
      </div>

      {successMessage ? (
        <p className="text-sm text-green-700">{successMessage}</p>
      ) : null}

      {errorMessage ? (
        <p className="text-sm text-red-700">{errorMessage}</p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
      >
        {submitting ? "Submitting..." : "Submit Request"}
      </button>
    </form>
  );
}
