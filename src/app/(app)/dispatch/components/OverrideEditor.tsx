"use client";

import { useMemo, useState } from "react";

import type {
  DayPlan,
  JobSummary,
  OverrideRequest,
  TechAssignment,
} from "../types";
import { JobMoveControl, type TechOption } from "./JobMoveControl";

// TODO(Slice 3): Marking a job unassigned drops it from `tech_assignments`
// entirely; the contractor cannot recover it without canceling the edit
// and starting over. Spec line 360 envisions an "unassigned pool" surface
// for moves both ways. Defer until backend GET /day-plans response surfaces
// `unassigned_jobs[]` (it's spec-only today; not on `DayPlanOut`).

const NOTES_MAX = 500;

function cloneDraft(plan: DayPlan): TechAssignment[] {
  return plan.tech_assignments.map((entry) => ({
    ...entry,
    job_ids: [...entry.job_ids],
    sequence_order: entry.sequence_order
      ? [...entry.sequence_order]
      : undefined,
  }));
}

function getSequence(entry: TechAssignment): string[] {
  return entry.sequence_order && entry.sequence_order.length > 0
    ? entry.sequence_order
    : entry.job_ids;
}

export function OverrideEditor({
  plan,
  saving,
  errorMessage,
  onSave,
  onCancel,
}: {
  plan: DayPlan;
  saving: boolean;
  errorMessage: string | null;
  onSave: (req: OverrideRequest) => void;
  onCancel: () => void;
}) {
  const initialDraft = useMemo(() => cloneDraft(plan), [plan]);
  const [draft, setDraft] = useState<TechAssignment[]>(initialDraft);
  const [notes, setNotes] = useState("");

  const summaries: Record<string, JobSummary> = plan.job_summaries || {};
  const techs: TechOption[] = draft.map((e) => ({
    tech_id: e.tech_id,
    tech_name: e.tech_name,
  }));

  function moveJob(
    jobId: string,
    fromTechId: string,
    toTechId: string | null,
  ) {
    setDraft((prev) => {
      const next = prev.map((e) => ({
        ...e,
        job_ids: [...e.job_ids],
        sequence_order: e.sequence_order ? [...e.sequence_order] : undefined,
      }));
      const src = next.find((e) => e.tech_id === fromTechId);
      if (src) {
        src.job_ids = src.job_ids.filter((j) => j !== jobId);
        if (src.sequence_order) {
          src.sequence_order = src.sequence_order.filter((j) => j !== jobId);
        }
      }
      if (toTechId === null) return next;
      const dst = next.find((e) => e.tech_id === toTechId);
      if (dst) {
        dst.job_ids = [...dst.job_ids, jobId];
        if (dst.sequence_order) {
          dst.sequence_order = [...dst.sequence_order, jobId];
        }
      }
      return next;
    });
  }

  function reorderJob(
    techId: string,
    jobId: string,
    direction: "up" | "down",
  ) {
    setDraft((prev) => {
      const next = prev.map((e) => ({
        ...e,
        job_ids: [...e.job_ids],
        sequence_order: e.sequence_order ? [...e.sequence_order] : undefined,
      }));
      const entry = next.find((e) => e.tech_id === techId);
      if (!entry) return next;
      const seq = getSequence(entry);
      const idx = seq.indexOf(jobId);
      if (idx < 0) return next;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= seq.length) return next;
      const newSeq = [...seq];
      [newSeq[idx], newSeq[newIdx]] = [newSeq[newIdx], newSeq[idx]];
      entry.job_ids = newSeq;
      if (entry.sequence_order) entry.sequence_order = newSeq;
      return next;
    });
  }

  function handleSave() {
    const trimmed = notes.trim();
    const payload: OverrideRequest = {
      tech_assignments: draft,
      ...(trimmed ? { notes: trimmed } : {}),
    };
    onSave(payload);
  }

  return (
    <div data-testid="dispatch-override-editor" className="pb-32 sm:pb-0">
      <p
        className="mb-4 text-sm"
        style={{ color: "var(--text-muted)" }}
        data-testid="dispatch-override-editor-help"
      >
        Move jobs between techs or mark them unassigned. Reorder with the
        arrow buttons. Save when finished, or cancel to discard.
      </p>

      <div className="space-y-4">
        {draft.map((entry, idx) => {
          const sequence = getSequence(entry);
          return (
            <section
              key={entry.tech_id || `tech-${idx}`}
              className="rounded-md border p-4"
              style={{ borderColor: "var(--border-soft)" }}
              data-testid="dispatch-edit-tech-section"
            >
              <header className="mb-3 flex items-baseline justify-between">
                <h2 className="text-lg font-medium">
                  {entry.tech_name || "Unassigned tech"}
                </h2>
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
                  {sequence.map((jid, i) => (
                    <JobMoveControl
                      key={jid}
                      jobId={jid}
                      index={i}
                      total={sequence.length}
                      fromTechId={entry.tech_id}
                      techs={techs}
                      summary={summaries[jid]}
                      onMove={moveJob}
                      onReorder={reorderJob}
                    />
                  ))}
                </ol>
              )}
            </section>
          );
        })}
      </div>

      <div className="mt-6">
        <label
          htmlFor="dispatch-override-notes"
          className="block text-sm font-medium"
        >
          Reason for override (optional)
        </label>
        <textarea
          id="dispatch-override-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value.slice(0, NOTES_MAX))}
          maxLength={NOTES_MAX}
          rows={3}
          className="mt-1 w-full rounded-md border p-2 text-sm"
          style={{
            borderColor: "var(--border-soft)",
            background: "var(--surface-canvas)",
            color: "var(--text-primary)",
          }}
          data-testid="dispatch-override-notes"
        />
        <p
          className="mt-1 text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          {notes.length}/{NOTES_MAX}
        </p>
      </div>

      {errorMessage && (
        <div
          className="mt-4 rounded-md border p-3 text-sm"
          style={{ borderColor: "var(--border-soft)" }}
          data-testid="dispatch-override-error"
        >
          {errorMessage}
        </div>
      )}

      <div
        className="fixed inset-x-0 bottom-0 flex flex-col gap-2 border-t p-4 sm:static sm:mt-8 sm:flex-row sm:border-t-0 sm:p-0"
        style={{
          borderColor: "var(--border-soft)",
          background: "var(--surface-canvas)",
        }}
      >
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-md px-4 py-3 text-sm font-medium sm:w-auto"
          style={{
            background: "var(--accent-primary)",
            color: "var(--on-accent)",
            opacity: saving ? 0.6 : 1,
            minHeight: 44,
          }}
          data-testid="dispatch-override-save"
        >
          {saving ? "Saving..." : "Save override"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="w-full rounded-md border px-4 py-3 text-sm font-medium sm:w-auto"
          style={{
            borderColor: "var(--border-soft)",
            color: "var(--text-primary)",
            background: "var(--surface-canvas)",
            minHeight: 44,
          }}
          data-testid="dispatch-override-cancel"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
