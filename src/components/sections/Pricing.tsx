"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

const tiers = [
  {
    name: "Starter",
    team: "1-10 employees",
    description: "Front office + Ask Endall with all 8 document actions. Perfect for owner-operators.",
    features: [
      "Call answering & lead qualification",
      "Morning briefings",
      "Financial models & budgets",
      "Project estimates & proposals",
      "Competitive analysis",
      "Capabilities docs & financial reviews",
    ],
    cta: "Request a Demo",
    href: "/demo",
  },
  {
    name: "Growth",
    team: "11-50 employees",
    description: "Everything in Starter, plus higher call volume, priority setup, and dedicated onboarding.",
    features: [
      "Everything in Starter",
      "Higher call volume capacity",
      "Priority onboarding",
      "Dedicated setup specialist",
    ],
    cta: "Request a Demo",
    href: "/demo",
    highlight: true,
  },
  {
    name: "Enterprise",
    team: "50+ employees",
    description: "Custom configuration for multi-location or multi-trade operations.",
    features: [
      "Everything in Growth",
      "Multi-location support",
      "Custom integrations",
      "Dedicated account manager",
    ],
    cta: "Contact Us",
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
            fontSize: 10,
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
            fontSize: 36,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          Priced for your team size.
        </h2>
        <p
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: 16,
            color: "var(--text-tertiary)",
            textAlign: "center",
            maxWidth: 480,
            margin: "0 auto 48px",
            lineHeight: 1.6,
          }}
        >
          Every plan includes all 8 Ask Endall actions, call answering, and morning briefings. We&rsquo;ll walk through pricing in your demo.
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
                  fontSize: 14,
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
                      fontSize: 13,
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
                  fontSize: 14,
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
