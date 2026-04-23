"use client";

import type { ReactNode } from "react";
import { STEP_LABELS, STEP_ORDER, type StepId } from "./types";

type Props = {
  stepId: StepId;
  title: string;
  description?: string;
  children: ReactNode;
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  saving?: boolean;
  error?: string | null;
};

export function StepShell({
  stepId,
  title,
  description,
  children,
  onBack,
  onContinue,
  continueLabel = "Continue",
  continueDisabled,
  saving,
  error,
}: Props) {
  const index = STEP_ORDER.indexOf(stepId);
  const total = STEP_ORDER.length;
  const progress = ((index + 1) / total) * 100;

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            Step {index + 1} of {total}
          </span>
          <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">
            {STEP_LABELS[stepId]}
          </span>
        </div>
        <div className="h-1 bg-[var(--overlay-soft)] rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <h2 className="text-[20px] sm:text-[22px] font-semibold text-[var(--text-primary)] tracking-tight mb-1">
        {title}
      </h2>
      {description && (
        <p className="text-[13px] text-[var(--text-muted)] mb-5">{description}</p>
      )}

      <div className="space-y-5">{children}</div>

      {error && (
        <div className="mt-5 text-[13px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={!onBack || saving}
          className="w-full sm:w-auto border border-[var(--border)] text-[var(--text-primary)] text-[13px] rounded-lg py-2.5 px-4 hover:bg-[var(--overlay-soft)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={continueDisabled || saving}
          className="w-full sm:w-auto bg-[var(--surface-inverse)] text-black font-medium text-[13px] rounded-lg py-2.5 px-4 hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          {saving ? "Saving…" : continueLabel}
        </button>
      </div>
    </div>
  );
}
