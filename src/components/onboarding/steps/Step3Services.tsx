"use client";

import { useMemo, useState } from "react";
import { StepShell } from "../wizard/StepShell";
import { Field, MultiSelectPills, SingleSelectPills } from "../wizard/fields";
import {
  SERVICE_TYPE_OPTIONS,
  TRADE_OPTIONS,
  type TradeCode,
  type WizardState,
} from "../wizard/types";

type Props = {
  state: WizardState["services"];
  onChange: (next: WizardState["services"]) => void;
  onContinue: () => Promise<void> | void;
  onBack: () => void;
  saving?: boolean;
  submitError?: string | null;
};

export function Step3Services({
  state,
  onChange,
  onContinue,
  onBack,
  saving,
  submitError,
}: Props) {
  const [touched, setTouched] = useState(false);

  const errors = useMemo(() => {
    const e: { primaryTrade?: string; serviceTypes?: string } = {};
    if (!state.primaryTrade) e.primaryTrade = "Pick a primary trade";
    if (state.serviceTypes.length === 0)
      e.serviceTypes = "Pick at least one service type";
    return e;
  }, [state]);

  const hasErrors = Object.keys(errors).length > 0;

  const secondaryOptions = TRADE_OPTIONS.filter(
    (t) => t.value !== state.primaryTrade
  );

  return (
    <StepShell
      stepId="services"
      title="Services and trade"
      description="This scopes the Estimator pricing DB and filters incoming leads."
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
      <Field label="Primary trade" required error={touched ? errors.primaryTrade : null}>
        <SingleSelectPills
          options={TRADE_OPTIONS}
          value={state.primaryTrade}
          onChange={(value: TradeCode) => {
            onChange({
              ...state,
              primaryTrade: value,
              secondaryTrades: state.secondaryTrades.filter((t) => t !== value),
            });
          }}
        />
      </Field>

      <Field label="Secondary trades" hint="Optional">
        <MultiSelectPills
          options={secondaryOptions}
          value={state.secondaryTrades}
          onChange={(next) => onChange({ ...state, secondaryTrades: next })}
        />
      </Field>

      <Field
        label="Service types offered"
        required
        error={touched ? errors.serviceTypes : null}
      >
        <MultiSelectPills
          options={SERVICE_TYPE_OPTIONS}
          value={state.serviceTypes}
          onChange={(next) => onChange({ ...state, serviceTypes: next })}
        />
      </Field>
    </StepShell>
  );
}
