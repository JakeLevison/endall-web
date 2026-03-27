"use client";

import { useState, useCallback } from "react";
import LogoEntrance from "@/components/hero/LogoEntrance";
import Navbar from "@/components/hero/Navbar";
import HeroHeadline from "@/components/hero/HeroHeadline";
import DashboardMock from "@/components/hero/DashboardMock";
import SocialProofTicker from "@/components/hero/SocialProofTicker";
import CursorGlow from "@/components/shared/CursorGlow";
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
    label: "CRM",
    title: "Every relationship, one view.",
    description:
      "Contacts, companies, deals, pipeline. Custom fields, activity timelines, automatic enrichment.",
    mock: <CRMMock />,
  },
  {
    label: "Sequences",
    title: "Outreach on autopilot.",
    description:
      "Multi-step email cadences. Smart scheduling. Personalization tokens. Auto-unenroll on reply.",
    mock: <SequencesMock />,
  },
  {
    label: "Workflows",
    title: "Automate any process.",
    description:
      "Trigger on any event. Branch on any condition. AI classification, summarization, and research built in.",
    mock: <WorkflowsMock />,
  },
  {
    label: "Tasks",
    title: "Ship work, not updates.",
    description:
      "Issues, projects, boards, sprints. Prioritize, assign, and track without the meetings.",
    mock: <TasksMock />,
  },
  {
    label: "AI",
    title: "Ask anything.",
    description:
      "Natural language across all your data. Meeting prep. Deal briefs. Follow-up drafts. Account research.",
    mock: <AIMock />,
  },
  {
    label: "Reports",
    title: "Decisions, not dashboards.",
    description:
      "Pipeline analytics. Revenue metrics. Activity tracking. Real-time, always current.",
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
        <CursorGlow />

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
                  Platform
                </p>
                <h2
                  style={{
                    fontFamily: "var(--font-serif), serif",
                    fontSize: "36px",
                    fontWeight: 400,
                    color: "#ffffff",
                    textAlign: "center",
                    marginBottom: "48px",
                  }}
                >
                  Everything you need
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
