"use client";

import { useState } from "react";
import { posthog } from "@/lib/posthog";

export type JobStatus = "pending" | "confirmed" | "completed" | "cancelled";

export const STATUS_OPTIONS: JobStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

const PILL_COLORS: Record<JobStatus, { bg: string; text: string; border: string }> = {
  pending: { bg: "rgba(148,163,184,0.12)", text: "#94a3b8", border: "rgba(148,163,184,0.3)" },
  confirmed: { bg: "rgba(59,130,246,0.12)", text: "#3b82f6", border: "rgba(59,130,246,0.3)" },
  completed: { bg: "rgba(16,185,129,0.12)", text: "#10b981", border: "rgba(16,185,129,0.3)" },
  cancelled: { bg: "rgba(239,68,68,0.12)", text: "#ef4444", border: "rgba(239,68,68,0.3)" },
};

export function JobStatusControl({
  jobId,
  status,
  onStatusChange,
}: {
  jobId: string;
  status: JobStatus;
  onStatusChange: (next: JobStatus) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const colors = PILL_COLORS[status] || PILL_COLORS.pending;

  async function handleChange(next: JobStatus) {
    if (next === status) return;
    const prior = status;
    setPending(true);
    setError(null);
    onStatusChange(next);
    try {
      const resp = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!resp.ok) throw new Error(`status ${resp.status}`);
      posthog.capture("job_status_changed", {
        job_id: jobId,
        old_status: prior,
        new_status: next,
      });
    } catch (err) {
      onStatusChange(prior);
      setError("Could not update status. Try again.");
      console.error("status update failed:", err);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-0.5">
      <select
        aria-label={`Status for ${jobId}`}
        value={status}
        disabled={pending}
        onChange={(e) => handleChange(e.target.value as JobStatus)}
        onClick={(e) => e.stopPropagation()}
        className="text-[11px] rounded-full px-2 py-0.5 border"
        style={{
          background: colors.bg,
          color: colors.text,
          borderColor: colors.border,
        }}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {error ? (
        <span role="alert" className="text-[10px]" style={{ color: "#ef4444" }}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
