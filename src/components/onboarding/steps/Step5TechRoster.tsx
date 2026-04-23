"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { StepShell } from "../wizard/StepShell";
import {
  Field,
  MultiSelectPills,
  TextInput,
} from "../wizard/fields";
import {
  DAYS,
  SKILL_OPTIONS,
  TRADE_OPTIONS,
  newTechnician,
  type Technician,
  type WizardState,
} from "../wizard/types";

type Props = {
  state: WizardState["tech-roster"];
  onChange: (next: WizardState["tech-roster"]) => void;
  onContinue: () => Promise<void> | void;
  onBack: () => void;
  saving?: boolean;
  submitError?: string | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function techErrors(t: Technician) {
  const e: Partial<Record<keyof Technician, string>> = {};
  if (!t.name.trim()) e.name = "Required";
  if (!t.email.trim()) e.email = "Required";
  else if (!EMAIL_RE.test(t.email)) e.email = "Invalid email";
  if (!t.phone.trim()) e.phone = "Required";
  if (t.trades.length === 0) e.trades = "Pick at least one";
  return e;
}

export function Step5TechRoster({
  state,
  onChange,
  onContinue,
  onBack,
  saving,
  submitError,
}: Props) {
  const [touched, setTouched] = useState(false);

  const allErrors = useMemo(
    () => state.technicians.map((t) => techErrors(t)),
    [state.technicians]
  );
  const hasErrors =
    state.technicians.length === 0 ||
    allErrors.some((e) => Object.keys(e).length > 0);

  return (
    <StepShell
      stepId="tech-roster"
      title="Tech roster"
      description="Dispatch needs at least one tech on the roster. For solo shops, add yourself."
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
      <div className="space-y-4">
        {state.technicians.map((tech, idx) => {
          const errs = touched ? allErrors[idx] : {};
          return (
            <div
              key={tech.id}
              className="border border-[var(--border)] rounded-lg p-4 bg-[var(--overlay-weak)] space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">
                  Technician {idx + 1}
                </h3>
                {state.technicians.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        technicians: state.technicians.filter(
                          (_, i) => i !== idx
                        ),
                      })
                    }
                    className="inline-flex items-center gap-1 text-[12px] text-red-300 hover:text-red-200 min-h-[36px] px-2"
                    aria-label={`Remove technician ${idx + 1}`}
                  >
                    <Trash2 className="size-3.5" />
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Name" required error={errs.name}>
                  <TextInput
                    value={tech.name}
                    onChange={(e) => {
                      const next = [...state.technicians];
                      next[idx] = { ...tech, name: e.target.value };
                      onChange({ technicians: next });
                    }}
                    placeholder="Jane Doe"
                    autoComplete="name"
                  />
                </Field>
                <Field label="Email" required error={errs.email}>
                  <TextInput
                    type="email"
                    value={tech.email}
                    onChange={(e) => {
                      const next = [...state.technicians];
                      next[idx] = { ...tech, email: e.target.value };
                      onChange({ technicians: next });
                    }}
                    placeholder="jane@acme.com"
                    autoComplete="email"
                  />
                </Field>
                <Field label="Phone" required error={errs.phone}>
                  <TextInput
                    type="tel"
                    value={tech.phone}
                    onChange={(e) => {
                      const next = [...state.technicians];
                      next[idx] = { ...tech, phone: e.target.value };
                      onChange({ technicians: next });
                    }}
                    placeholder="(555) 123-4567"
                    autoComplete="tel"
                  />
                </Field>
                <Field label="Vehicle">
                  <TextInput
                    value={tech.vehicle}
                    onChange={(e) => {
                      const next = [...state.technicians];
                      next[idx] = { ...tech, vehicle: e.target.value };
                      onChange({ technicians: next });
                    }}
                    placeholder="Truck 1"
                  />
                </Field>
              </div>

              <Field label="Trades" required error={errs.trades}>
                <MultiSelectPills
                  options={TRADE_OPTIONS}
                  value={tech.trades}
                  onChange={(next) => {
                    const copy = [...state.technicians];
                    copy[idx] = { ...tech, trades: next };
                    onChange({ technicians: copy });
                  }}
                />
              </Field>

              <Field label="Skills tags" hint="Optional">
                <MultiSelectPills
                  options={SKILL_OPTIONS}
                  value={tech.skillsTags}
                  onChange={(next) => {
                    const copy = [...state.technicians];
                    copy[idx] = { ...tech, skillsTags: next };
                    onChange({ technicians: copy });
                  }}
                />
              </Field>

              <Field label="Standard hours">
                <div className="space-y-2">
                  {DAYS.map((d) => {
                    const sched = tech.standardHours[d.value];
                    return (
                      <div
                        key={d.value}
                        className="flex flex-wrap items-center gap-2 text-[13px]"
                      >
                        <label className="inline-flex items-center gap-2 min-w-[60px]">
                          <input
                            type="checkbox"
                            checked={sched.enabled}
                            onChange={(e) => {
                              const copy = [...state.technicians];
                              copy[idx] = {
                                ...tech,
                                standardHours: {
                                  ...tech.standardHours,
                                  [d.value]: {
                                    ...sched,
                                    enabled: e.target.checked,
                                  },
                                },
                              };
                              onChange({ technicians: copy });
                            }}
                            className="size-4 accent-emerald-500"
                          />
                          <span className="text-[var(--text-primary)]">{d.label}</span>
                        </label>
                        <TextInput
                          type="time"
                          value={sched.start}
                          disabled={!sched.enabled}
                          onChange={(e) => {
                            const copy = [...state.technicians];
                            copy[idx] = {
                              ...tech,
                              standardHours: {
                                ...tech.standardHours,
                                [d.value]: { ...sched, start: e.target.value },
                              },
                            };
                            onChange({ technicians: copy });
                          }}
                          className="!w-auto flex-1 min-w-[120px]"
                        />
                        <span className="text-[var(--text-muted)]">to</span>
                        <TextInput
                          type="time"
                          value={sched.end}
                          disabled={!sched.enabled}
                          onChange={(e) => {
                            const copy = [...state.technicians];
                            copy[idx] = {
                              ...tech,
                              standardHours: {
                                ...tech.standardHours,
                                [d.value]: { ...sched, end: e.target.value },
                              },
                            };
                            onChange({ technicians: copy });
                          }}
                          className="!w-auto flex-1 min-w-[120px]"
                        />
                      </div>
                    );
                  })}
                </div>
              </Field>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() =>
            onChange({ technicians: [...state.technicians, newTechnician()] })
          }
          className="w-full border border-dashed border-[var(--border)] text-[13px] text-[var(--text-primary)] rounded-lg py-3 hover:bg-[var(--overlay-soft)] transition-colors min-h-[44px]"
        >
          + Add technician
        </button>
      </div>
    </StepShell>
  );
}
