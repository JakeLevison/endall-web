"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  STEP_ENDPOINTS,
  STEP_ORDER,
  initialWizardState,
  storageKey,
  type StepId,
  type WizardState,
} from "./types";
import { StepErrorBoundary } from "./StepErrorBoundary";
import { Step1Identity } from "../steps/Step1Identity";
import { Step2Company } from "../steps/Step2Company";
import { Step3Services } from "../steps/Step3Services";
import { Step4ServiceArea } from "../steps/Step4ServiceArea";
import { Step5TechRoster } from "../steps/Step5TechRoster";
import { Step6Pricing } from "../steps/Step6Pricing";
import { Step7Integrations } from "../steps/Step7Integrations";
import { Step8Review } from "../steps/Step8Review";

type Props = {
  adminEmail: string;
  tenantName: string;
  tenantId: string | null;
  token: string | null;
};

function isStepId(v: string | null): v is StepId {
  return !!v && (STEP_ORDER as string[]).includes(v);
}

export function OnboardingWizard({
  adminEmail,
  tenantName,
  tenantId,
  token,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const desiredStep = searchParams.get("step");
  const initialStep: StepId = isStepId(desiredStep) ? desiredStep : "identity";

  const [step, setStep] = useState<StepId>(initialStep);
  const [state, setState] = useState<WizardState>(() => initialWizardState());
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [epoch, setEpoch] = useState(0); // bump to reset error boundary

  const key = useMemo(() => storageKey(tenantId), [tenantId]);

  // Hydrate from localStorage after mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<WizardState>;
        setState((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore — fresh state wins
    } finally {
      setHydrated(true);
    }
  }, [key]);

  // Persist on every change, once hydrated.
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // quota errors, Safari private mode — best-effort only
    }
  }, [hydrated, key, state]);

  // Keep step in URL so refresh preserves progress.
  useEffect(() => {
    const sp = new URLSearchParams(searchParams.toString());
    if (sp.get("step") !== step) {
      sp.set("step", step);
      const qs = sp.toString();
      router.replace(qs ? `?${qs}` : "?step=" + step, { scroll: false });
    }
    // Scroll to top on step change per Operating Standards.
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step, router, searchParams]);

  const stepIndex = STEP_ORDER.indexOf(step);
  const hardBackDisabled = stepIndex <= 0;

  const goPrev = useCallback(() => {
    if (stepIndex > 0) setStep(STEP_ORDER[stepIndex - 1]);
  }, [stepIndex]);

  const goNext = useCallback(() => {
    if (stepIndex < STEP_ORDER.length - 1) setStep(STEP_ORDER[stepIndex + 1]);
  }, [stepIndex]);

  const postStep = useCallback(
    async <K extends keyof typeof STEP_ENDPOINTS>(
      stepKey: K,
      payload: unknown
    ): Promise<boolean> => {
      setSaving(true);
      setSubmitError(null);
      try {
        const res = await fetch(STEP_ENDPOINTS[stepKey], {
          method: stepKey === "tech-roster" || stepKey === "integrations"
            ? "POST"
            : stepKey === "pricing"
              ? "POST"
              : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenantId, ...(payload as object) }),
        });
        if (res.status === 501) {
          // Stubbed endpoint — accept and move on. Backend work is a separate
          // session per the handoff plan.
          return true;
        }
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          setSubmitError(
            text || `Save failed (${res.status}). Your data is still here — try again.`
          );
          return false;
        }
        return true;
      } catch (err) {
        setSubmitError(
          err instanceof Error
            ? `${err.message}. Your data is still here — try again.`
            : "Network error. Your data is still here — try again."
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [tenantId]
  );

  const resetBoundary = useCallback(() => setEpoch((e) => e + 1), []);

  const handleFinish = useCallback(async () => {
    setSaving(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });
      if (res.ok || res.status === 501) {
        setState((prev) => ({
          ...prev,
          review: { completedAt: new Date().toISOString() },
        }));
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(key);
        }
        router.push("/dispatch");
        return;
      }
      const text = await res.text().catch(() => "");
      setSubmitError(text || `Unable to finish (${res.status}).`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setSaving(false);
    }
  }, [tenantId, router, key]);

  // Stable onChange callbacks keyed to the step slice.
  const onChange = useMemo(
    () => ({
      identity: (next: WizardState["identity"]) =>
        setState((s) => ({ ...s, identity: next })),
      company: (next: WizardState["company"]) =>
        setState((s) => ({ ...s, company: next })),
      services: (next: WizardState["services"]) =>
        setState((s) => ({ ...s, services: next })),
      serviceArea: (next: WizardState["service-area"]) =>
        setState((s) => ({ ...s, ["service-area"]: next })),
      techRoster: (next: WizardState["tech-roster"]) =>
        setState((s) => ({ ...s, ["tech-roster"]: next })),
      pricing: (next: WizardState["pricing"]) =>
        setState((s) => ({ ...s, pricing: next })),
      integrations: (next: WizardState["integrations"]) =>
        setState((s) => ({ ...s, integrations: next })),
    }),
    []
  );

  const stateRef = useRef(state);
  stateRef.current = state;

  return (
    <main className="min-h-screen bg-[#0A0A0B] flex flex-col items-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-[560px]">
        <div className="text-center mb-6 sm:mb-8">
          <h1
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "22px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            endall
          </h1>
        </div>

        <StepErrorBoundary
          key={`${step}-${epoch}`}
          stepLabel={step}
          onReset={resetBoundary}
        >
          {step === "identity" && (
            <Step1Identity
              state={state.identity}
              adminEmail={adminEmail}
              tenantName={tenantName}
              onChange={onChange.identity}
              onContinue={goNext}
            />
          )}
          {step === "company" && (
            <Step2Company
              state={state.company}
              onChange={onChange.company}
              onContinue={async () => {
                const ok = await postStep("company", {
                  company: stateRef.current.company,
                });
                if (ok) goNext();
              }}
              onBack={hardBackDisabled ? () => undefined : goPrev}
              saving={saving}
              submitError={submitError}
            />
          )}
          {step === "services" && (
            <Step3Services
              state={state.services}
              onChange={onChange.services}
              onContinue={async () => {
                const ok = await postStep("services", {
                  services: stateRef.current.services,
                });
                if (ok) goNext();
              }}
              onBack={goPrev}
              saving={saving}
              submitError={submitError}
            />
          )}
          {step === "service-area" && (
            <Step4ServiceArea
              state={state["service-area"]}
              onChange={onChange.serviceArea}
              onContinue={async () => {
                const ok = await postStep("service-area", {
                  serviceArea: stateRef.current["service-area"],
                });
                if (ok) goNext();
              }}
              onBack={goPrev}
              saving={saving}
              submitError={submitError}
            />
          )}
          {step === "tech-roster" && (
            <Step5TechRoster
              state={state["tech-roster"]}
              onChange={onChange.techRoster}
              onContinue={async () => {
                const ok = await postStep("tech-roster", {
                  technicians: stateRef.current["tech-roster"].technicians,
                });
                if (ok) goNext();
              }}
              onBack={goPrev}
              saving={saving}
              submitError={submitError}
            />
          )}
          {step === "pricing" && (
            <Step6Pricing
              state={state.pricing}
              activeTrades={[
                ...(state.services.primaryTrade
                  ? [state.services.primaryTrade]
                  : []),
                ...state.services.secondaryTrades,
              ]}
              onChange={onChange.pricing}
              onContinue={async () => {
                const ok = await postStep("pricing", {
                  pricing: stateRef.current.pricing,
                });
                if (ok) goNext();
              }}
              onBack={goPrev}
              saving={saving}
              submitError={submitError}
            />
          )}
          {step === "integrations" && (
            <Step7Integrations
              state={state.integrations}
              onChange={onChange.integrations}
              onContinue={async () => {
                const ok = await postStep("integrations", {
                  integrations: stateRef.current.integrations,
                });
                if (ok) goNext();
              }}
              onBack={goPrev}
              saving={saving}
              submitError={submitError}
            />
          )}
          {step === "review" && (
            <Step8Review
              state={state}
              onBack={goPrev}
              onFinish={handleFinish}
              onJumpTo={setStep}
              saving={saving}
              submitError={submitError}
            />
          )}
        </StepErrorBoundary>

        {token && step === "identity" && (
          <p className="text-center text-[11px] text-[var(--text-muted)] mt-6">
            Invite token validated. Session is live.
          </p>
        )}
      </div>
    </main>
  );
}
