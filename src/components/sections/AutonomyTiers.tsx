"use client";

import { useState } from "react";
import { Zap, Gauge, Radar as RadarIcon } from "lucide-react";
import ScrollReveal from "@/components/shared/ScrollReveal";

type Tier = {
  id: "autopilot" | "copilot" | "radar";
  name: string;
  hook: string;
  icon: typeof Zap;
  summary: string;
  bullets: string[];
  best: string;
};

const TIERS: Tier[] = [
  {
    id: "autopilot",
    name: "Autopilot",
    hook: "Endall runs everything.",
    icon: Zap,
    summary:
      "Full 360 management. Endall answers calls, books jobs, sends proposals, follows up with leads, runs briefings, and manages outreach.",
    bullets: [
      "Calls answered and qualified end-to-end",
      "Proposals sent without your approval",
      "Outreach + follow-ups fully automated",
      "Daily briefings + action items delivered",
    ],
    best: "For contractors who want to stop thinking about admin entirely.",
  },
  {
    id: "copilot",
    name: "Co-Pilot",
    hook: "Endall does the work. You approve it.",
    icon: Gauge,
    summary:
      "Same capabilities as Autopilot, but every client-facing action drafts to your inbox first. Nothing goes out without your sign-off.",
    bullets: [
      "Endall drafts every email, proposal, follow-up",
      "One-click approve or edit before send",
      "Calls still answered in real time",
      "Briefings + intel still delivered daily",
    ],
    best: "For contractors who want control over client touchpoints, not a blank inbox.",
  },
  {
    id: "radar",
    name: "Radar",
    hook: "Endall watches. You act.",
    icon: RadarIcon,
    summary:
      "Monitoring mode. Endall tracks calls, logs leads, generates briefings, and flags action items - but takes no client-facing action.",
    bullets: [
      "Every call logged and summarized",
      "Daily briefings with action items",
      "Competitive and pipeline intel surfaced",
      "Zero outbound from Endall",
    ],
    best: "For contractors who want visibility and intel, not automation.",
  },
];

export default function AutonomyTiers() {
  const [activeId, setActiveId] = useState<Tier["id"]>("copilot");
  const active = TIERS.find((t) => t.id === activeId)!;

  return (
    <ScrollReveal>
      <section style={{ padding: "80px 16px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <p
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: "13px",
              textTransform: "uppercase",
              letterSpacing: "3px",
              color: "var(--text-muted)",
              textAlign: "center",
              marginBottom: "16px",
            }}
          >
            Your call
          </p>
          <h2
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "clamp(28px, 5vw, 36px)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              textAlign: "center",
              marginBottom: "12px",
            }}
          >
            Choose your operating mode.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "clamp(15px, 2.2vw, 17px)",
              color: "var(--text-tertiary)",
              textAlign: "center",
              marginBottom: "40px",
              maxWidth: "600px",
              margin: "0 auto 40px",
              lineHeight: 1.55,
            }}
          >
            You decide how much Endall takes off your plate. Flip modes from
            Settings - takes effect on the next call.
          </p>

          {/* Mode switcher - tabs that feel like a toggle on a truck dashboard */}
          <div
            role="tablist"
            aria-label="Operating mode"
            style={{
              display: "flex",
              gap: "6px",
              padding: "5px",
              background: "var(--overlay-soft)",
              border: "1px solid var(--overlay-medium)",
              borderRadius: "12px",
              marginBottom: "32px",
              maxWidth: "560px",
              marginInline: "auto",
              boxShadow: "var(--shadow-inset)",
            }}
          >
            {TIERS.map((tier) => {
              const isActive = tier.id === activeId;
              return (
                <button
                  key={tier.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveId(tier.id)}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "none",
                    background: isActive ? "var(--brand-accent-light)" : "transparent",
                    color: isActive ? "#1a1a1a" : "var(--text-tertiary)",
                    fontSize: "14px",
                    fontWeight: isActive ? 600 : 500,
                    cursor: "pointer",
                    transition: "background 200ms ease, color 200ms ease",
                    fontFamily: "inherit",
                    minHeight: "40px",
                  }}
                >
                  <tier.icon size={14} />
                  <span>{tier.name}</span>
                </button>
              );
            })}
          </div>

          {/* Active tier card */}
          <div
            key={active.id}
            style={{
              border: "1px solid var(--overlay-medium)",
              borderRadius: "16px",
              padding: "28px 28px 24px",
              background: "var(--overlay-weak)",
              boxShadow: "var(--shadow-card)",
              animation: "tier-fade 300ms ease-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
              <h3
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: "clamp(22px, 3.4vw, 28px)",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                {active.name}
              </h3>
              <span
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: "clamp(15px, 2.2vw, 17px)",
                  color: "var(--brand-accent-light)",
                  fontWeight: 500,
                }}
              >
                {active.hook}
              </span>
            </div>
            <p
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "15px",
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                marginBottom: "20px",
              }}
            >
              {active.summary}
            </p>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "0 0 18px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "8px 18px",
              }}
            >
              {active.bullets.map((b) => (
                <li
                  key={b}
                  style={{
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: "14px",
                    color: "var(--text-tertiary)",
                    lineHeight: 1.5,
                    paddingLeft: "14px",
                    position: "relative",
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "0.55em",
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "var(--brand-accent-light)",
                    }}
                  />
                  {b}
                </li>
              ))}
            </ul>
            <p
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "13px",
                color: "var(--text-muted)",
                borderTop: "1px solid var(--overlay-medium)",
                paddingTop: "14px",
                margin: 0,
                fontStyle: "italic",
              }}
            >
              {active.best}
            </p>
          </div>
        </div>

        <style jsx>{`
          @keyframes tier-fade {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </section>
    </ScrollReveal>
  );
}
