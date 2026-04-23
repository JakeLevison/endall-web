"use client";

import { StepShell } from "../wizard/StepShell";
import {
  PAYMENT_TERMS_OPTIONS,
  SERVICE_TYPE_OPTIONS,
  STEP_LABELS,
  TRADE_OPTIONS,
  type StepId,
  type WizardState,
} from "../wizard/types";

type Props = {
  state: WizardState;
  onBack: () => void;
  onFinish: () => Promise<void> | void;
  onJumpTo: (step: StepId) => void;
  saving?: boolean;
  submitError?: string | null;
};

function tradeLabel(v: string) {
  return TRADE_OPTIONS.find((t) => t.value === v)?.label ?? v;
}
function serviceLabel(v: string) {
  return SERVICE_TYPE_OPTIONS.find((t) => t.value === v)?.label ?? v;
}
function termsLabel(v: string) {
  return PAYMENT_TERMS_OPTIONS.find((t) => t.value === v)?.label ?? v;
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="flex gap-3 py-1.5">
      <span className="text-[12px] text-[var(--text-muted)] min-w-[140px]">
        {label}
      </span>
      <span className="text-[13px] text-[var(--text-primary)] break-words">
        {value === "" || value == null ? "—" : value}
      </span>
    </div>
  );
}

function Section({
  step,
  title,
  onJumpTo,
  children,
}: {
  step: StepId;
  title: string;
  onJumpTo: (step: StepId) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-[var(--border)] rounded-lg p-4 bg-[var(--overlay-weak)]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
          {title}
        </h3>
        <button
          type="button"
          onClick={() => onJumpTo(step)}
          className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] underline underline-offset-2 min-h-[36px]"
        >
          Edit
        </button>
      </div>
      <div className="divide-y divide-[var(--border)]">{children}</div>
    </div>
  );
}

export function Step8Review({
  state,
  onBack,
  onFinish,
  onJumpTo,
  saving,
  submitError,
}: Props) {
  return (
    <StepShell
      stepId="review"
      title="Review and finish"
      description="Double-check everything below. Any field can be edited from here."
      onBack={onBack}
      onContinue={onFinish}
      continueLabel="Start using Endall"
      saving={saving}
      error={submitError}
    >
      <Section step="company" title={STEP_LABELS.company} onJumpTo={onJumpTo}>
        <Row label="Legal name" value={state.company.legalName} />
        <Row label="DBA" value={state.company.dba} />
        <Row label="EIN" value={state.company.ein} />
        <Row label="Mailing address" value={state.company.mailingAddress} />
        <Row
          label="Jurisdictions"
          value={state.company.licensedJurisdictions.join(", ")}
        />
      </Section>

      <Section step="services" title={STEP_LABELS.services} onJumpTo={onJumpTo}>
        <Row label="Primary trade" value={tradeLabel(state.services.primaryTrade)} />
        <Row
          label="Secondary trades"
          value={state.services.secondaryTrades.map(tradeLabel).join(", ")}
        />
        <Row
          label="Service types"
          value={state.services.serviceTypes.map(serviceLabel).join(", ")}
        />
      </Section>

      <Section
        step="service-area"
        title={STEP_LABELS["service-area"]}
        onJumpTo={onJumpTo}
      >
        <Row label="Base" value={state["service-area"].baseLocation} />
        <Row
          label="Radius"
          value={`${state["service-area"].serviceRadiusMiles} miles`}
        />
        <Row
          label="Secondary zones"
          value={state["service-area"].secondaryCoverageZones.join(", ")}
        />
      </Section>

      <Section
        step="tech-roster"
        title={STEP_LABELS["tech-roster"]}
        onJumpTo={onJumpTo}
      >
        <Row
          label="Technicians"
          value={`${state["tech-roster"].technicians.length} on roster`}
        />
        {state["tech-roster"].technicians.map((t, i) => (
          <Row
            key={t.id}
            label={`Tech ${i + 1}`}
            value={`${t.name || "(unnamed)"} — ${t.trades.map(tradeLabel).join(", ")}`}
          />
        ))}
      </Section>

      <Section step="pricing" title={STEP_LABELS.pricing} onJumpTo={onJumpTo}>
        <Row label="Markup" value={`${state.pricing.markupPercent}%`} />
        <Row label="Overhead" value={`${state.pricing.overheadPercent}%`} />
        <Row label="Sales tax" value={`${state.pricing.salesTaxRate}%`} />
        <Row
          label="Payment terms"
          value={termsLabel(state.pricing.defaultPaymentTerms)}
        />
      </Section>

      <Section
        step="integrations"
        title={STEP_LABELS.integrations}
        onJumpTo={onJumpTo}
      >
        <Row
          label="QuickBooks"
          value={
            state.integrations.quickbooksConnected
              ? `Connected${state.integrations.quickbooksCompanyId ? ` (${state.integrations.quickbooksCompanyId})` : ""}`
              : "Not connected"
          }
        />
        <Row label="Phone" value="Provisioned" />
      </Section>
    </StepShell>
  );
}
