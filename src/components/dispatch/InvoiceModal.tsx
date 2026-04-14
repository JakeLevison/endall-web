"use client";

import { useState } from "react";
import { posthog } from "@/lib/posthog";

export type InvoiceJobSummary = {
  job_id: string;
  caller_name: string | null;
  job_type: string | null;
  preferred_date: string | null;
};

export function InvoiceModal({
  job,
  open,
  onClose,
  onGenerated,
}: {
  job: InvoiceJobSummary;
  open: boolean;
  onClose: () => void;
  onGenerated?: (filename: string, downloadUrl: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [dueDays, setDueDays] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const amountNum = parseFloat(amount);
  const valid = !Number.isNaN(amountNum) && amountNum > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      setError("Amount is required and must be greater than 0.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const resp = await fetch("/api/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: job.job_id,
          amount: amountNum,
          memo: memo || null,
          due_days: dueDays,
        }),
      });
      if (!resp.ok) throw new Error(`status ${resp.status}`);
      const body = await resp.json();
      posthog.capture("invoice_generated", {
        job_id: job.job_id,
        amount: amountNum,
        due_days: dueDays,
      });
      const downloadUrl: string = body.download_url;
      const filename: string = body.filename;
      if (typeof window !== "undefined") {
        const base =
          process.env.NEXT_PUBLIC_BRIDGE_URL ||
          "https://ask-endall-bridge-production.up.railway.app";
        const fullUrl = downloadUrl.startsWith("http")
          ? downloadUrl
          : `${base}${downloadUrl}`;
        const a = document.createElement("a");
        a.href = fullUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      onGenerated?.(filename, downloadUrl);
      onClose();
    } catch (err) {
      console.error("invoice generate failed:", err);
      setError("Could not generate invoice. Try again or email jake@endall.ai");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-label="Generate invoice"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="rounded-lg border p-5 w-full max-w-md space-y-3"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          color: "var(--text-primary)",
        }}
      >
        <h2 className="text-[14px] font-medium">Generate invoice</h2>
        <div
          className="rounded-md border p-3 text-[12px] space-y-0.5"
          style={{
            background: "var(--overlay-soft)",
            borderColor: "var(--border)",
            color: "var(--text-tertiary)",
          }}
        >
          <div>
            <span className="text-[var(--text-muted)]">Caller: </span>
            {job.caller_name || "Unknown"}
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Job: </span>
            {job.job_type || "Unspecified"}
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Scheduled: </span>
            {job.preferred_date || "n/a"}
          </div>
        </div>

        <label className="block text-[12px] space-y-1">
          <span className="text-[var(--text-tertiary)]">Amount ($)</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-md border px-2 py-1.5 text-[13px]"
            style={{
              background: "var(--overlay-soft)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </label>

        <label className="block text-[12px] space-y-1">
          <span className="text-[var(--text-tertiary)]">Memo (optional)</span>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="What was the work? Leave blank to use job type."
            className="w-full rounded-md border px-2 py-1.5 text-[13px]"
            style={{
              background: "var(--overlay-soft)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </label>

        <label className="block text-[12px] space-y-1">
          <span className="text-[var(--text-tertiary)]">Due in</span>
          <select
            value={dueDays}
            onChange={(e) => setDueDays(parseInt(e.target.value, 10))}
            className="w-full rounded-md border px-2 py-1.5 text-[13px]"
            style={{
              background: "var(--overlay-soft)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <option value={15}>15 days</option>
            <option value={30}>30 days</option>
            <option value={45}>45 days</option>
            <option value={60}>60 days</option>
          </select>
        </label>

        {error ? (
          <p role="alert" className="text-[12px]" style={{ color: "#ef4444" }}>
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-[12px] border"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-tertiary)",
              background: "transparent",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !valid}
            className="rounded-md px-3 py-1.5 text-[12px] font-medium"
            style={{
              background: "var(--brand-accent-light)",
              color: "#1a1a1a",
              opacity: submitting || !valid ? 0.6 : 1,
            }}
          >
            {submitting ? "Generating..." : "Generate invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}
