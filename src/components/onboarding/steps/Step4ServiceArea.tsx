"use client";

import { useMemo, useState } from "react";
import { StepShell } from "../wizard/StepShell";
import { Field, TagInput, TextInput } from "../wizard/fields";
import type { WizardState } from "../wizard/types";

type Props = {
  state: WizardState["service-area"];
  onChange: (next: WizardState["service-area"]) => void;
  onContinue: () => Promise<void> | void;
  onBack: () => void;
  saving?: boolean;
  submitError?: string | null;
};

export function Step4ServiceArea({
  state,
  onChange,
  onContinue,
  onBack,
  saving,
  submitError,
}: Props) {
  const [touched, setTouched] = useState(false);

  const errors = useMemo(() => {
    const e: { baseLocation?: string; serviceRadiusMiles?: string } = {};
    if (!state.baseLocation.trim()) e.baseLocation = "Required";
    if (!state.serviceRadiusMiles || state.serviceRadiusMiles <= 0)
      e.serviceRadiusMiles = "Enter a positive number";
    return e;
  }, [state]);

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <StepShell
      stepId="service-area"
      title="Service area"
      description="Dispatch routes tech assignments by geography. The Estimator uses this to filter out-of-area leads."
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
      <Field label="Base location" required hint="City + state or zip" error={touched ? errors.baseLocation : null}>
        <TextInput
          value={state.baseLocation}
          onChange={(e) => onChange({ ...state, baseLocation: e.target.value })}
          placeholder="Portland, OR or 97201"
          autoComplete="address-level2"
        />
      </Field>

      <Field
        label="Service radius (miles)"
        required
        error={touched ? errors.serviceRadiusMiles : null}
      >
        <TextInput
          type="number"
          min={1}
          max={500}
          inputMode="numeric"
          value={state.serviceRadiusMiles || ""}
          onChange={(e) =>
            onChange({
              ...state,
              serviceRadiusMiles: Number(e.target.value) || 0,
            })
          }
          placeholder="50"
        />
      </Field>

      <Field label="Secondary coverage zones" hint="Optional. Cities or zip ranges.">
        <TagInput
          value={state.secondaryCoverageZones}
          onChange={(next) => onChange({ ...state, secondaryCoverageZones: next })}
          placeholder="Add a zone and press Enter"
        />
      </Field>
    </StepShell>
  );
}
