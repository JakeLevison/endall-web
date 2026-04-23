"use client";

import { useMemo, useState } from "react";
import { StepShell } from "../wizard/StepShell";
import { Field, TextInput } from "../wizard/fields";
import {
  PAYMENT_TERMS_OPTIONS,
  PRICING_TIERS,
  TRADE_OPTIONS,
  type PricingTier,
  type TradeCode,
  type WizardState,
} from "../wizard/types";

type Props = {
  state: WizardState["pricing"];
  activeTrades: TradeCode[];
  onChange: (next: WizardState["pricing"]) => void;
  onContinue: () => Promise<void> | void;
  onBack: () => void;
  saving?: boolean;
  submitError?: string | null;
};

function parsePercent(v: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function Step6Pricing({
  state,
  activeTrades,
  onChange,
  onContinue,
  onBack,
  saving,
  submitError,
}: Props) {
  const [touched, setTouched] = useState(false);

  const errors = useMemo(() => {
    const e: {
      markupPercent?: string;
      overheadPercent?: string;
      salesTaxRate?: string;
    } = {};
    const m = parsePercent(state.markupPercent);
    if (m === null || m < 0 || m > 100) e.markupPercent = "0–100";
    const o = parsePercent(state.overheadPercent);
    if (o === null || o < 0 || o > 100) e.overheadPercent = "0–100";
    const s = parsePercent(state.salesTaxRate);
    if (s === null || s < 0 || s > 100) e.salesTaxRate = "0–100";
    return e;
  }, [state]);

  const hasErrors = Object.keys(errors).length > 0;

  const tradesToShow = activeTrades.length
    ? TRADE_OPTIONS.filter((t) => activeTrades.includes(t.value))
    : TRADE_OPTIONS;

  return (
    <StepShell
      stepId="pricing"
      title="Pricing inputs"
      description="Without these, the Estimator falls back to demo defaults. Rates can be refined after Day 1."
      onBack={onBack}
      onContinue={async () => {
        setTouched(true);
        if (hasErrors) return;
        await onContinue();
      }}
      continueDisabled={hasErrors}
      saving={saving}
      error={submitError}
    >
      <div>
        <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-2">
          Labor rates ($/hour)
        </p>
        <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--overlay-weak)]">
              <tr>
                <th className="text-left p-2 text-[11px] uppercase tracking-wide text-[var(--text-muted)] font-medium">
                  Trade
                </th>
                {PRICING_TIERS.map((tier) => (
                  <th
                    key={tier}
                    className="text-left p-2 text-[11px] uppercase tracking-wide text-[var(--text-muted)] font-medium"
                  >
                    {tier}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tradesToShow.map((trade) => (
                <tr key={trade.value} className="border-t border-[var(--border)]">
                  <td className="p-2 text-[var(--text-primary)] font-medium whitespace-nowrap">
                    {trade.label}
                  </td>
                  {PRICING_TIERS.map((tier: PricingTier) => (
                    <td key={tier} className="p-1.5 min-w-[90px]">
                      <TextInput
                        type="number"
                        min={0}
                        inputMode="decimal"
                        value={state.laborRates[trade.value]?.[tier] ?? ""}
                        onChange={(e) => {
                          const next = {
                            ...state.laborRates,
                            [trade.value]: {
                              ...(state.laborRates[trade.value] ?? {}),
                              [tier]: e.target.value,
                            },
                          };
                          onChange({ ...state, laborRates: next });
                        }}
                        placeholder="0"
                        className="!py-1.5 !min-h-[36px] !text-[13px]"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field
          label="Standard markup (%)"
          required
          error={touched ? errors.markupPercent : null}
        >
          <TextInput
            type="number"
            min={0}
            max={100}
            inputMode="decimal"
            value={state.markupPercent}
            onChange={(e) => onChange({ ...state, markupPercent: e.target.value })}
          />
        </Field>
        <Field
          label="Overhead (%)"
          required
          error={touched ? errors.overheadPercent : null}
        >
          <TextInput
            type="number"
            min={0}
            max={100}
            inputMode="decimal"
            value={state.overheadPercent}
            onChange={(e) => onChange({ ...state, overheadPercent: e.target.value })}
          />
        </Field>
        <Field label="Sales tax rate (%)" required error={touched ? errors.salesTaxRate : null}>
          <TextInput
            type="number"
            min={0}
            max={100}
            inputMode="decimal"
            value={state.salesTaxRate}
            onChange={(e) => onChange({ ...state, salesTaxRate: e.target.value })}
          />
        </Field>
        <Field label="Default payment terms" required>
          <select
            value={state.defaultPaymentTerms}
            onChange={(e) =>
              onChange({
                ...state,
                defaultPaymentTerms: e.target.value as WizardState["pricing"]["defaultPaymentTerms"],
              })
            }
            className="w-full bg-[var(--overlay-soft)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-[14px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--overlay-strong)] min-h-[44px]"
          >
            {PAYMENT_TERMS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </StepShell>
  );
}
