"use client";

import type { DayPlan } from "../types";
import { StatusBadge } from "./StatusBadge";
import { TechSection } from "./TechSection";

export function DayPlanView({
  plan,
  approving,
  onApprove,
  onOverride,
}: {
  plan: DayPlan;
  approving: boolean;
  onApprove: () => void;
  onOverride: () => void;
}) {
  const summaries = plan.job_summaries || {};

  if (plan.status === "expired") {
    return (
      <div
        className="rounded-md border p-6 text-sm"
        style={{ borderColor: "var(--border-soft)" }}
        data-testid="dispatch-expired"
      >
        <p className="font-medium">This plan expired at 6am.</p>
        <p className="mt-2" style={{ color: "var(--text-muted)" }}>
          Yesterday&apos;s assignments are in effect.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-2" data-testid="dispatch-status">
        <StatusBadge status={plan.status} />
        {plan.expand_partial && (
          <span
            className="text-xs"
            style={{ color: "var(--text-muted)" }}
            data-testid="dispatch-partial-warning"
          >
            Some details could not be loaded.
          </span>
        )}
      </div>

      <div className="space-y-4">
        {plan.tech_assignments.length === 0 ? (
          <div
            className="rounded-md border p-6 text-sm"
            style={{ borderColor: "var(--border-soft)" }}
            data-testid="dispatch-no-assignments"
          >
            <p style={{ color: "var(--text-muted)" }}>
              No technician assignments on this plan yet.
            </p>
          </div>
        ) : (
          plan.tech_assignments.map((entry, idx) => (
            <TechSection
              key={entry.tech_id || `tech-${idx}`}
              entry={entry}
              summaries={summaries}
            />
          ))
        )}
      </div>

      {plan.status === "proposed" && (
        <div
          className="fixed inset-x-0 bottom-0 flex flex-col gap-2 border-t p-4 sm:static sm:mt-8 sm:flex-row sm:border-t-0 sm:p-0"
          style={{
            borderColor: "var(--border-soft)",
            background: "var(--surface-canvas)",
          }}
        >
          <button
            type="button"
            onClick={onApprove}
            disabled={approving}
            className="w-full rounded-md px-4 py-3 text-sm font-medium sm:w-auto"
            style={{
              background: "var(--accent-primary)",
              color: "var(--on-accent)",
              opacity: approving ? 0.6 : 1,
              minHeight: 44,
            }}
            data-testid="dispatch-approve"
          >
            {approving ? "Approving..." : "Approve plan"}
          </button>
          <button
            type="button"
            onClick={onOverride}
            disabled={approving}
            className="w-full rounded-md border px-4 py-3 text-sm font-medium sm:w-auto"
            style={{
              borderColor: "var(--border-soft)",
              color: "var(--text-primary)",
              background: "var(--surface-canvas)",
              minHeight: 44,
            }}
            data-testid="dispatch-override-entry"
          >
            Override
          </button>
        </div>
      )}
    </>
  );
}
