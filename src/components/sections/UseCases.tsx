"use client";

import { Calculator, Sun, Phone } from "lucide-react";
import ScrollReveal from "@/components/shared/ScrollReveal";

const scenarios = [
  {
    icon: Calculator,
    hook: "You just won a data center subcontract.",
    detail:
      "Ask Endall to estimate the job, generate the proposal, and model the financials \u2014 in under 5 minutes.",
    badge: null,
  },
  {
    icon: Sun,
    hook: "It\u2019s Monday morning.",
    detail:
      "Your daily briefing shows 3 new leads, 2 overdue invoices, and a job hitting margin targets.",
    badge: null,
  },
  {
    icon: Phone,
    hook: "A GC calls at 7 PM.",
    detail:
      "Endall answers, qualifies the job, and books a site visit on your calendar.",
    badge: "Coming Soon",
  },
];

export default function UseCases() {
  return (
    <ScrollReveal>
      <section style={{ padding: "80px 16px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
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
            See it in action
          </p>
          <h2
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "clamp(28px, 5vw, 36px)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              textAlign: "center",
              marginBottom: "48px",
            }}
          >
            Real scenarios. Real results.
          </h2>

          <div
            className="grid grid-cols-1 md:grid-cols-3"
            style={{ gap: "16px" }}
          >
            {scenarios.map((s, i) => {
              const Icon = s.icon;
              return (
                <ScrollReveal key={s.hook} delay={i * 100}>
                  <div
                    style={{
                      padding: "32px 28px",
                      background: "var(--overlay-weak)",
                      border: "1px solid var(--overlay-soft)",
                      borderRadius: 12,
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                      height: "100%",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: "var(--overlay-soft)",
                          border: "1px solid var(--overlay-medium)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={18} color="var(--text-tertiary)" strokeWidth={1.5} />
                      </div>
                      {s.badge && (
                        <span
                          style={{
                            fontFamily: "var(--font-mono), monospace",
                            fontSize: 9,
                            textTransform: "uppercase",
                            letterSpacing: 2,
                            color: "var(--overlay-strong)",
                            border: "1px solid var(--overlay-medium)",
                            borderRadius: 4,
                            padding: "3px 8px",
                          }}
                        >
                          {s.badge}
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        fontFamily: "var(--font-sans), sans-serif",
                        fontSize: 18,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        lineHeight: 1.3,
                      }}
                    >
                      {s.hook}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-sans), sans-serif",
                        fontSize: 16,
                        color: "var(--text-tertiary)",
                        lineHeight: 1.7,
                      }}
                    >
                      {s.detail}
                    </p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}
