"use client";

import { useMemo, useState } from "react";
import { StepShell } from "../wizard/StepShell";
import { Field, TagInput, TextInput } from "../wizard/fields";
import type { WizardState } from "../wizard/types";

type Props = {
  state: WizardState["company"];
  onChange: (next: WizardState["company"]) => void;
  onContinue: () => Promise<void> | void;
  onBack: () => void;
  saving?: boolean;
  submitError?: string | null;
};

const EIN_REGEX = /^\d{2}-\d{7}$/;

export function Step2Company({
  state,
  onChange,
  onContinue,
  onBack,
  saving,
  submitError,
}: Props) {
  const [touched, setTouched] = useState<{ [k in keyof WizardState["company"]]?: boolean }>({});

  const errors = useMemo(() => {
    const e: { [k in keyof WizardState["company"]]?: string } = {};
    if (!state.legalName.trim()) e.legalName = "Required";
    if (state.ein && !EIN_REGEX.test(state.ein)) e.ein = "Format: XX-XXXXXXX";
    if (!state.mailingAddress.trim()) e.mailingAddress = "Required";
    if (state.licensedJurisdictions.length === 0)
      e.licensedJurisdictions = "Add at least one jurisdiction";
    return e;
  }, [state]);

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <StepShell
      stepId="company"
      title="Company details"
      description="Legal name goes on estimates and invoices. DBA is optional."
      onBack={onBack}
      onContinue={async () => {
        setTouched({
          legalName: true,
          ein: true,
          mailingAddress: true,
          licensedJurisdictions: true,
        });
        if (hasErrors) return;
        await onContinue();
      }}
      continueDisabled={hasErrors}
      saving={saving}
      error={submitError}
    >
      <Field label="Legal name" required error={touched.legalName ? errors.legalName : null}>
        <TextInput
          value={state.legalName}
          onChange={(e) => onChange({ ...state, legalName: e.target.value })}
          onBlur={() => setTouched((t) => ({ ...t, legalName: true }))}
          placeholder="Acme Mechanical, LLC"
          autoComplete="organization"
        />
      </Field>

      <Field label="DBA" hint="Only if different from legal name">
        <TextInput
          value={state.dba}
          onChange={(e) => onChange({ ...state, dba: e.target.value })}
          placeholder="Acme MEP"
        />
      </Field>

      <Field
        label="EIN"
        hint="Optional now, required before first invoice"
        error={touched.ein ? errors.ein : null}
      >
        <TextInput
          value={state.ein}
          onChange={(e) => onChange({ ...state, ein: e.target.value })}
          onBlur={() => setTouched((t) => ({ ...t, ein: true }))}
          placeholder="12-3456789"
          inputMode="numeric"
        />
      </Field>

      <Field
        label="Business mailing address"
        required
        error={touched.mailingAddress ? errors.mailingAddress : null}
      >
        <TextInput
          value={state.mailingAddress}
          onChange={(e) => onChange({ ...state, mailingAddress: e.target.value })}
          onBlur={() => setTouched((t) => ({ ...t, mailingAddress: true }))}
          placeholder="123 Main St, Ste 200, City, ST 00000"
          autoComplete="street-address"
        />
      </Field>

      <Field
        label="Licensed jurisdictions"
        required
        hint="Press Enter after each (e.g. CA, OR, Clark County NV)"
        error={touched.licensedJurisdictions ? errors.licensedJurisdictions : null}
      >
        <TagInput
          value={state.licensedJurisdictions}
          onChange={(next) => onChange({ ...state, licensedJurisdictions: next })}
          placeholder="Type a jurisdiction and press Enter"
        />
      </Field>
    </StepShell>
  );
}
