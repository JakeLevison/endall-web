"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { DemoProgress } from "@/components/demo/DemoCoach";
import WelcomeStep from "@/components/demo/steps/WelcomeStep";
import AskStep from "@/components/demo/steps/AskStep";
import GenerateStep from "@/components/demo/steps/GenerateStep";
import CallStep from "@/components/demo/steps/CallStep";
import CtaStep from "@/components/demo/steps/CtaStep";

// Simple analytics: log to console for now. Replace with Supabase insert later.
function trackDemoEvent(event: string, payload: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  try {
    // eslint-disable-next-line no-console
    console.log("[demo]", event, payload);
  } catch {
    /* noop */
  }
}

const TOTAL_WALKTHROUGH_STEPS = 4; // steps 1-4 count for progress dots

export default function DemoPage() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    trackDemoEvent("step_viewed", { step });
  }, [step]);

  // Scroll to top on step change so long sections aren't mid-scroll
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [step]);

  const advance = () => setStep((s) => Math.min(s + 1, 4));
  const exit = () => {
    trackDemoEvent("demo_exited", { from_step: step });
    setStep(0);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text-secondary)",
      }}
    >
      {/* Thin top bar — minimal chrome */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          background: "var(--bg)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: 18,
            fontWeight: 600,
            color: "var(--text-primary)",
            textDecoration: "none",
            letterSpacing: "-0.02em",
          }}
        >
          endall
        </Link>

        {step > 0 && step < 4 && (
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <DemoProgress current={step - 1} total={TOTAL_WALKTHROUGH_STEPS} />
          </div>
        )}

        {step > 0 ? (
          <button
            type="button"
            onClick={exit}
            aria-label="Exit demo"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: 8,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 14,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <X size={16} />
            Exit
          </button>
        ) : (
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 14,
              color: "var(--text-muted)",
              textDecoration: "none",
            }}
          >
            ← Back
          </Link>
        )}
      </header>

      {/* Step content */}
      <main>
        {step === 0 && <WelcomeStep onStart={() => { trackDemoEvent("demo_started"); setStep(1); }} />}
        {step === 1 && (
          <AskStep
            onNext={() => { trackDemoEvent("step_completed", { step: 1 }); advance(); }}
            onSuggestionChosen={(suggestion) => trackDemoEvent("suggestion_chosen", { suggestion })}
          />
        )}
        {step === 2 && (
          <GenerateStep
            onNext={() => { trackDemoEvent("step_completed", { step: 2 }); advance(); }}
            onFileDownloaded={() => trackDemoEvent("file_downloaded")}
          />
        )}
        {step === 3 && (
          <CallStep
            onNext={() => { trackDemoEvent("step_completed", { step: 3, called: false }); advance(); }}
          />
        )}
        {step === 4 && <CtaStep />}
      </main>
    </div>
  );
}
