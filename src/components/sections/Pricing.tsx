"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

const tiers = [
  {
    name: "Radar",
    team: "Monitoring mode",
    description:
      "Visibility and intel without automated action. You still run the office, Endall gives you eyes on everything.",
    features: [
      "Calls logged and summarized",
      "Daily briefings with action items",
      "Competitive + pipeline intel",
      "Ask Endall for analysis on demand",
    ],
    cta: "Talk to us",
    href: "/contact",
  },
  {
    name: "Co-Pilot",
    team: "Recommended",
    description:
      "Endall drafts every email, proposal, and follow-up. You approve before anything goes out.",
    features: [
      "Everything in Radar",
      "Calls answered + qualified in real time",
      "Drafts for every client touchpoint",
      "One-click approve, edit, or reject",
    ],
    cta: "Talk to us",
    href: "/contact",
    highlight: true,
  },
  {
    name: "Autopilot",
    team: "Fully autonomous",
    description:
      "Endall runs the office end-to-end. Calls answered, jobs booked, proposals sent, follow-ups handled, all without your touch.",
    features: [
      "Everything in Co-Pilot",
      "Proposals + follow-ups auto-send",
      "Outreach sequences on autopilot",
      "Weekly check-in, not daily approval",
    ],
    cta: "Talk to us",
    href: "/contact",
  },
];

export default function Pricing() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const prefersReducedMotion = useReducedMotion();

  return (
    <section ref={sectionRef} id="pricing" style={{ padding: "80px 16px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: 3,
            color: "var(--text-muted)",
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          Pricing
        </p>
        <h2
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: "clamp(28px, 5vw, 36px)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            textAlign: "center",
            marginBottom: 12,
            whiteSpace: "nowrap",
          }}
        >
          Three modes. One platform.
        </h2>
        <p
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: 18,
            color: "var(--text-tertiary)",
            textAlign: "center",
            maxWidth: 560,
            margin: "0 auto 48px",
            lineHeight: 1.6,
          }}
        >
          Every mode includes all Ask Endall actions and the full briefing engine. Pricing walked through in the demo.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.1 }}
              whileHover={!tier.highlight && !prefersReducedMotion ? { scale: 1.02 } : {}}
              style={{
                padding: "32px 28px",
                background: tier.highlight ? "var(--overlay-soft)" : "var(--overlay-weak)",
                border: `1px solid ${tier.highlight ? "var(--overlay-medium)" : "var(--overlay-soft)"}`,
                borderRadius: 12,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  color: "var(--text-muted)",
                  marginBottom: 8,
                }}
              >
                {tier.team}
              </p>
              <h3
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 22,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.02em",
                  marginBottom: 8,
                }}
              >
                {tier.name}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 16,
                  color: "var(--text-tertiary)",
                  lineHeight: 1.6,
                  marginBottom: 24,
                }}
              >
                {tier.description}
              </p>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px 0", flex: 1 }}>
                {tier.features.map((feat) => (
                  <li
                    key={feat}
                    style={{
                      fontFamily: "var(--font-sans), sans-serif",
                      fontSize: 16,
                      color: "var(--text-secondary)",
                      padding: "6px 0",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                    }}
                  >
                    <svg
                      width="14"
                      height="11"
                      viewBox="0 0 14 11"
                      fill="none"
                      style={{ flexShrink: 0, marginTop: 3 }}
                    >
                      <path
                        d="M1 5.5L4.5 9L13 1"
                        stroke="var(--text-tertiary)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>

              <a
                href={tier.href}
                style={{
                  display: "block",
                  textAlign: "center",
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 16,
                  fontWeight: 500,
                  padding: "12px 24px",
                  borderRadius: 8,
                  textDecoration: "none",
                  transition: "background-color 0.2s ease",
                  background: tier.highlight ? "var(--text-primary)" : "var(--overlay-soft)",
                  color: tier.highlight ? "var(--text-inverse)" : "var(--text-primary)",
                  border: tier.highlight ? "none" : "1px solid var(--overlay-medium)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = tier.highlight ? "var(--surface-hover)" : "var(--overlay-medium)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = tier.highlight ? "var(--text-primary)" : "var(--overlay-soft)";
                }}
              >
                {tier.cta}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
