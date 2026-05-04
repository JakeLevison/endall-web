"use client";

import type { JobSummary } from "../types";

export type TechOption = { tech_id: string; tech_name?: string };

export function JobMoveControl({
  jobId,
  index,
  total,
  fromTechId,
  techs,
  summary,
  onMove,
  onReorder,
}: {
  jobId: string;
  index: number;
  total: number;
  fromTechId: string;
  techs: TechOption[];
  summary: JobSummary | undefined;
  onMove: (jobId: string, fromTechId: string, toTechId: string | null) => void;
  onReorder: (techId: string, jobId: string, direction: "up" | "down") => void;
}) {
  const id = `job-move-${jobId}`;
  return (
    <li
      className="flex flex-col gap-2 rounded-md border p-3 text-sm sm:flex-row sm:items-center sm:gap-3"
      style={{ borderColor: "var(--border-soft)" }}
      data-testid="dispatch-edit-job-row"
    >
      <span
        className="text-xs"
        style={{ color: "var(--text-muted)", minWidth: 24 }}
      >
        {index + 1}.
      </span>
      <div className="flex-1">
        <div className="font-medium">{summary?.title || "Untitled job"}</div>
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
          {summary?.customer_name || "Customer not loaded"}
          {summary?.address ? ` (${summary.address})` : ""}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onReorder(fromTechId, jobId, "up")}
          disabled={index === 0}
          aria-label="Move job earlier"
          className="rounded-md border px-2 text-sm"
          style={{
            borderColor: "var(--border-soft)",
            color: "var(--text-primary)",
            background: "var(--surface-canvas)",
            minHeight: 44,
            minWidth: 44,
            opacity: index === 0 ? 0.4 : 1,
          }}
          data-testid={`dispatch-edit-move-up-${jobId}`}
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => onReorder(fromTechId, jobId, "down")}
          disabled={index === total - 1}
          aria-label="Move job later"
          className="rounded-md border px-2 text-sm"
          style={{
            borderColor: "var(--border-soft)",
            color: "var(--text-primary)",
            background: "var(--surface-canvas)",
            minHeight: 44,
            minWidth: 44,
            opacity: index === total - 1 ? 0.4 : 1,
          }}
          data-testid={`dispatch-edit-move-down-${jobId}`}
        >
          ↓
        </button>
        <label htmlFor={id} className="sr-only">
          Move job to tech
        </label>
        <select
          id={id}
          value={fromTechId}
          onChange={(e) => {
            const v = e.target.value;
            onMove(jobId, fromTechId, v === "__unassigned__" ? null : v);
          }}
          className="rounded-md border px-2 py-1 text-sm"
          style={{
            borderColor: "var(--border-soft)",
            color: "var(--text-primary)",
            background: "var(--surface-canvas)",
            minHeight: 44,
          }}
          data-testid={`dispatch-edit-tech-select-${jobId}`}
        >
          {techs.map((t) => (
            <option key={t.tech_id} value={t.tech_id}>
              {t.tech_name || "Unassigned tech"}
            </option>
          ))}
          <option value="__unassigned__">Unassigned</option>
        </select>
      </div>
    </li>
  );
}
