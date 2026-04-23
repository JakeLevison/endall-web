"use client";

import { useEffect } from "react";
import { StepShell } from "../wizard/StepShell";
import type { WizardState } from "../wizard/types";

type Props = {
  state: WizardState["identity"];
  adminEmail: string;
  tenantName: string;
  onChange: (next: WizardState["identity"]) => void;
  onContinue: () => void;
};

export function Step1Identity({
  state,
  adminEmail,
  tenantName,
  onChange,
  onContinue,
}: Props) {
  useEffect(() => {
    if (!state.confirmedAt) {
      onChange({ confirmedAt: new Date().toISOString() });
    }
  }, [state.confirmedAt, onChange]);

  return (
    <StepShell
      stepId="identity"
      title={`Welcome, ${adminEmail || "there"}.`}
      description={`Setting up ${tenantName}. Click confirm to continue.`}
      onContinue={onContinue}
      continueLabel="Confirm and continue"
    >
      <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-lg p-4">
        <p className="text-[13px] text-emerald-300 font-medium mb-1">
          Passwordless sign-in confirmed
        </p>
        <p className="text-[12px] text-emerald-200/80">
          Your session is live. The next six steps collect the data your
          tenant needs to run on Day 1. You can come back to any step before
          finishing.
        </p>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="border border-[var(--border)] rounded-lg p-3 bg-[var(--overlay-weak)]">
          <dt className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            Admin email
          </dt>
          <dd className="text-[13px] text-[var(--text-primary)] mt-0.5 break-all">
            {adminEmail || "—"}
          </dd>
        </div>
        <div className="border border-[var(--border)] rounded-lg p-3 bg-[var(--overlay-weak)]">
          <dt className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            Tenant
          </dt>
          <dd className="text-[13px] text-[var(--text-primary)] mt-0.5">
            {tenantName}
          </dd>
        </div>
      </dl>
    </StepShell>
  );
}
