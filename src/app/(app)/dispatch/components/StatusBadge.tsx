"use client";

import type { DayPlanStatus } from "../types";

export function StatusBadge({ status }: { status: DayPlanStatus }) {
  const label =
    status === "approved"
      ? "Approved"
      : status === "overridden"
        ? "Overridden"
        : status === "expired"
          ? "Expired"
          : "Proposed";
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs"
      style={{
        background: "var(--overlay-soft)",
        color: "var(--text-primary)",
      }}
      data-testid="dispatch-status-badge"
    >
      {label}
    </span>
  );
}
