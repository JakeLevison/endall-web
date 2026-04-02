"use client";

import { useState, useCallback } from "react";
import LogoEntrance from "@/components/hero/LogoEntrance";
import Navbar from "@/components/hero/Navbar";
import HeroHeadline from "@/components/hero/HeroHeadline";
import DashboardMock from "@/components/hero/DashboardMock";
import SocialProofTicker from "@/components/hero/SocialProofTicker";
import ScrollReveal from "@/components/shared/ScrollReveal";
import FeatureCard from "@/components/features/FeatureCard";
import CRMMock from "@/components/features/CRMMock";
import SequencesMock from "@/components/features/SequencesMock";
import WorkflowsMock from "@/components/features/WorkflowsMock";
import TasksMock from "@/components/features/TasksMock";
import AIMock from "@/components/features/AIMock";
import ReportsMock from "@/components/features/ReportsMock";
import HowItWorks from "@/components/sections/HowItWorks";
import Pricing from "@/components/sections/Pricing";
import FinalCTA from "@/components/sections/FinalCTA";
import Footer from "@/components/sections/Footer";

const features = [
  {
    label: "Calls",
    title: "Every call answered. Every time.",
    description:
      "Picks up in under 60 seconds. Knows the difference between a GC, a property manager, and a homeowner. No more voicemail.",
    mock: <CRMMock />,
  },
  {
    label: "Qualification",
    title: "Knows what's worth your time.",
    description:
      "Qualifies every lead using logic built for electrical and MEP contractors. Commercial, residential, emergency, service call.",
    mock: <SequencesMock />,
  },
  {
    label: "Booking",
    title: "Jobs on your calendar. Automatically.",
    description:
      "Books qualified opportunities directly on your calendar. No phone tag. No back-and-forth. The right jobs, scheduled.",
    mock: <WorkflowsMock />,
  },
  {
    label: "Briefings",
    title: "Wake up knowing what happened.",
    description:
      "Every morning you get a plain-language summary: what came in overnight, what's commercial, what's urgent, what needs a decision.",
    mock: <TasksMock />,
  },
  {
    label: "Financial Models",
    title: "Know your numbers. Finally.",
    description:
      "Ask Endall to build a budget, run project returns, or generate a 13-week cash flow. Live Excel formulas, not screenshots.",
    mock: <AIMock />,
  },
  {
    label: "Proposals & Docs",
    title: "Capabilities decks in 10 seconds.",
    description:
      "Endall builds proposals, capabilities docs, and project estimates from your company profile. No input required for the capabilities deck.",
    mock: <ReportsMock />,
  },
  {
    label: "Speed",
    title: "Live in 48 hours. Not 48 days.",
    description:
      "No training manuals. No 90-day onboarding. Endall deploys on your existing phone number and calendar in two days.",
    mock: <AIMock />,
  },
  {
    label: "Control",
    title: "Your business. Your rules.",
    description:
      "Set your service area, your hours, your job types. Pause anytime. No contracts. Cancel whenever you want.",
    mock: <ReportsMock />,
  },
];

export default function Home() {
  const [entranceDone, setEntranceDone] = useState(false);

  const handleEntranceComplete = useCallback(() => {
    setEntranceDone(true);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        color: "var(--text-secondary)",
      }}
    >
      <LogoEntrance onComplete={handleEntranceComplete} />

      <div
        style={{
          opacity: entranceDone ? 1 : 0,
          transition: "opacity 800ms cubic-bezier(0.16, 1, 0.3, 1)",
          pointerEvents: entranceDone ? "auto" : "none",
        }}
      >
        <Navbar />

        <main style={{ position: "relative", zIndex: 2 }}>
          <HeroHeadline />
          <DashboardMock />
          <SocialProofTicker />

          {/* Features */}
          <ScrollReveal>
            <div
              style={{
                maxWidth: "1100px",
                margin: "0 auto",
                borderTop: "1px solid var(--border)",
              }}
            />
            <section id="features" style={{ padding: "80px 16px" }}>
              <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <p
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "3px",
                    color: "var(--text-muted)",
                    textAlign: "center",
                    marginBottom: "16px",
                  }}
                >
                  What Endall does
                </p>
                <h2
                  style={{
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: "36px",
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    color: "#ffffff",
                    textAlign: "center",
                    marginBottom: "48px",
                  }}
                >
                  The front office you never had to hire
                </h2>
                <div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  style={{ gap: "12px" }}
                >
                  {features.map((feature, i) => (
                    <ScrollReveal key={feature.label} delay={i * 80}>
                      <FeatureCard
                        label={feature.label}
                        title={feature.title}
                        description={feature.description}
                      >
                        {feature.mock}
                      </FeatureCard>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </section>
          </ScrollReveal>

          {/* How it works */}
          <div
            style={{
              maxWidth: "1100px",
              margin: "0 auto",
              borderTop: "1px solid var(--border)",
            }}
          />
          <HowItWorks />

          {/* Pricing */}
          <div
            style={{
              maxWidth: "1100px",
              margin: "0 auto",
              borderTop: "1px solid var(--border)",
            }}
          />
          <Pricing />

          {/* Final CTA */}
          <div
            style={{
              maxWidth: "1100px",
              margin: "0 auto",
              borderTop: "1px solid var(--border)",
            }}
          />
          <FinalCTA />

          {/* Footer */}
          <Footer />
        </main>
      </div>
    </div>
  );
}
