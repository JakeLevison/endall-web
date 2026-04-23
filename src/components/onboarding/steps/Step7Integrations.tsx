"use client";

import { useEffect } from "react";
import { Check } from "lucide-react";
import { StepShell } from "../wizard/StepShell";
import type { WizardState } from "../wizard/types";

type Props = {
  state: WizardState["integrations"];
  onChange: (next: WizardState["integrations"]) => void;
  onContinue: () => Promise<void> | void;
  onBack: () => void;
  saving?: boolean;
  submitError?: string | null;
};

export function Step7Integrations({
  state,
  onChange,
  onContinue,
  onBack,
  saving,
  submitError,
}: Props) {
  // Read the QuickBooks connection return state the existing CT2a flow posts
  // back into the URL after the OAuth round-trip.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const qbStatus = url.searchParams.get("qb");
    if (qbStatus === "connected") {
      const realm = url.searchParams.get("realm_id");
      onChange({
        ...state,
        quickbooksConnected: true,
        quickbooksCompanyId: realm,
      });
      url.searchParams.delete("qb");
      url.searchParams.delete("realm_id");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [onChange, state]);

  const connectQuickBooks = () => {
    // Use the existing CT2a QuickBooks authorize flow. Preserve the step so we
    // land back on step 7 of the wizard after the round-trip.
    const returnTo = `${window.location.pathname}?step=integrations&qb=connected`;
    const href = `/api/quickbooks/authorize?return_to=${encodeURIComponent(
      returnTo
    )}`;
    window.location.href = href;
  };

  return (
    <StepShell
      stepId="integrations"
      title="Integrations"
      description="Invoicing depends on QuickBooks being connected. Phone number is already provisioned."
      onBack={onBack}
      onContinue={onContinue}
      saving={saving}
      error={submitError}
    >
      <div className="border border-[var(--border)] rounded-lg p-4 bg-[var(--overlay-weak)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">
              QuickBooks Online
            </p>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              Scopes requested: accounting.read, accounting.write (for
              invoicing + customer sync).
            </p>
          </div>
          {state.quickbooksConnected ? (
            <div className="inline-flex items-center gap-2 text-[13px] text-emerald-300">
              <Check className="size-4" />
              Connected{" "}
              {state.quickbooksCompanyId
                ? `(realm ${state.quickbooksCompanyId})`
                : ""}
            </div>
          ) : (
            <button
              type="button"
              onClick={connectQuickBooks}
              className="bg-[var(--surface-inverse)] text-black font-medium text-[13px] rounded-lg py-2.5 px-4 hover:opacity-90 min-h-[44px]"
            >
              Connect QuickBooks
            </button>
          )}
        </div>
      </div>

      <div className="border border-[var(--border)] rounded-lg p-4 bg-[var(--overlay-weak)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">
              Phone number
            </p>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              Your Twilio number was provisioned during tenant setup. The
              dashboard will show the active number.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-[13px] text-emerald-300">
            <Check className="size-4" /> Provisioned
          </div>
        </div>
      </div>

      <div className="border border-[var(--border)] rounded-lg p-4 bg-[var(--overlay-weak)] opacity-70">
        <p className="text-[14px] font-semibold text-[var(--text-primary)]">
          CRM
        </p>
        <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
          No third-party CRM integrations yet. Coming in a later release.
        </p>
      </div>

      <p className="text-[12px] text-[var(--text-muted)]">
        You can skip the QuickBooks connect and come back to it from Settings.
        Invoicing is blocked until it is connected.
      </p>
    </StepShell>
  );
}
