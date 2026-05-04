"use client";

import type { JobSummary, TechAssignment } from "../types";

export function TechSection({
  entry,
  summaries,
}: {
  entry: TechAssignment;
  summaries: Record<string, JobSummary>;
}) {
  const sequence =
    entry.sequence_order && entry.sequence_order.length > 0
      ? entry.sequence_order
      : entry.job_ids;
  return (
    <section
      className="rounded-md border p-4"
      style={{ borderColor: "var(--border-soft)" }}
      data-testid="dispatch-tech-section"
    >
      <header className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-medium">
          {entry.tech_name || "Unassigned tech"}
        </h2>
        {typeof entry.travel_minutes_estimated === "number" && (
          <span
            className="text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            {entry.travel_minutes_estimated} min travel
          </span>
        )}
      </header>
      {sequence.length === 0 ? (
        <p
          className="text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          No jobs assigned.
        </p>
      ) : (
        <ol className="space-y-2">
          {sequence.map((jid, i) => {
            const summary = summaries[jid];
            return (
              <li
                key={jid}
                className="flex items-start gap-3 text-sm"
                data-testid="dispatch-job-row"
              >
                <span
                  className="mt-0.5 inline-block min-w-6 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {i + 1}.
                </span>
                <div className="flex-1">
                  <div className="font-medium">
                    {summary?.title || "Untitled job"}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {summary?.customer_name || "Customer not loaded"}
                    {summary?.address ? ` (${summary.address})` : ""}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
