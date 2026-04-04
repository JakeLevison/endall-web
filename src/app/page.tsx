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
import Testimonials from "@/components/sections/Testimonials";
import UseCases from "@/components/sections/UseCases";
import HowItWorks from "@/components/sections/HowItWorks";
import Pricing from "@/components/sections/Pricing";
import FinalCTA from "@/components/sections/FinalCTA";
import Footer from "@/components/sections/Footer";

const features = [
  {
    label: "Front Office",
    title: "Every call answered. Every lead qualified.",
    description:
      "Picks up in under 60 seconds. Qualifies by trade logic. Books qualified jobs on your calendar. No voicemail, no phone tag.",
    mock: <CRMMock />,
  },
  {
    label: "Morning Briefings",
    title: "Wake up knowing what happened.",
    description:
      "Every morning you get a plain-language summary: what came in overnight, what's commercial, what's urgent, what needs a decision.",
    mock: <TasksMock />,
  },
  {
    label: "Smart Outreach",
    title: "Automated follow-ups that close jobs.",
    description:
      "Sequences that send the right message at the right time. Follow up on open bids, re-engage past customers, and nurture leads without lifting a finger.",
    mock: <SequencesMock />,
  },
  {
    label: "Proposals",
    title: "Scoped SOW with pricing in minutes.",
    description:
      "Branded DOCX with executive summary, scope of work, timeline, pricing pulled from your estimate, terms, and company info.",
    mock: <WorkflowsMock />,
  },
  {
    label: "Financial Models",
    title: "P&L, cash flow, job margins, KPI dashboard.",
    description:
      "Ask Endall to build a financial model with live Excel formulas. 6-tab workbook with assumptions, projections, and sensitivity analysis.",
    mock: <AIMock />,
  },
  {
    label: "Budgets & NPV",
    title: "Know your numbers. Finally.",
    description:
      "Monthly budgets with P&L tracking. NPV analysis with IRR, sensitivity tables, and break-even projections. Real formulas, not screenshots.",
    mock: <ReportsMock />,
  },
  {
    label: "Project Estimates",
    title: "Labor, materials, subs, timeline, margins.",
    description:
      "Describe the job and get a 4-tab Excel workbook: summary, itemized detail with formulas, schedule, and margin calculations.",
    mock: <TasksMock />,
  },
  {
    label: "Competitive Analysis",
    title: "Know your market. Name your competitors.",
    description:
      "Competitor profiles with strengths, weaknesses, and sources. SWOT analysis. Positioning recommendations. All in a branded report.",
    mock: <CRMMock />,
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
                  8 actions. Zero busywork.
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

          {/* Testimonials */}
          <div
            style={{
              maxWidth: "1100px",
              margin: "0 auto",
              borderTop: "1px solid var(--border)",
            }}
          />
          <Testimonials />

          {/* Use Cases */}
          <div
            style={{
              maxWidth: "1100px",
              margin: "0 auto",
              borderTop: "1px solid var(--border)",
            }}
          />
          <UseCases />

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
