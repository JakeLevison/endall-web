"use client";

import { useRef } from "react";
import { useInView, useReducedMotion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Tell us about your business",
    description: "Your service area, job types, hours, and company profile. We configure Endall to match how you run your operation. Setup takes days, not months.",
  },
  {
    number: "02",
    title: "Endall runs your front office",
    description: "Every call answered in under 60 seconds. Leads qualified by trade logic. Qualified jobs booked on your calendar. Morning briefing delivered before you leave the house.",
  },
  {
    number: "03",
    title: "Ask Endall to build anything",
    description: "Financial models, budgets, project estimates, proposals, capabilities docs, competitive analysis, NPV reports, and financial reviews. Ask for it, get a finished file.",
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const prefersReducedMotion = useReducedMotion();
  const visible = prefersReducedMotion ? true : isInView;

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      style={{ padding: "80px 16px" }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <p
          style={{
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "var(--text-muted)",
            textAlign: "center",
            marginBottom: 48,
          }}
        >
          How it works
        </p>

        <h2 style={{
          fontFamily: "var(--font-sans), sans-serif",
          fontSize: "clamp(28px, 5vw, 36px)",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "var(--text-primary)",
          textAlign: "center",
          marginBottom: "48px",
        }}>
          Three steps to a fully staffed operation.
        </h2>

        {/* Desktop: horizontal layout */}
        <div className="hiw-grid">
          {/* Connecting line (desktop) */}
          <div className="hiw-line-h">
            <div
              className="hiw-dot"
              style={{
                opacity: visible ? 1 : 0,
                animation: visible ? "dot-travel-h 1.5s ease-in-out forwards" : "none",
              }}
            />
          </div>

          {/* Connecting line (mobile) */}
          <div className="hiw-line-v">
            <div
              className="hiw-dot-v"
              style={{
                opacity: visible ? 1 : 0,
                animation: visible ? "dot-travel-v 1.5s ease-in-out forwards" : "none",
              }}
            />
          </div>

          {steps.map((step, i) => (
            <div
              key={step.number}
              className="hiw-step"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(20px)",
                transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 150}ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 150}ms`,
              }}
            >
              {/* Large faint step number */}
              <div
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 72,
                  color: "var(--surface-hover)",
                  lineHeight: 1,
                  marginBottom: 8,
                  fontWeight: 400,
                }}
              >
                {step.number}
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 24,
                  color: "var(--text-primary)",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  marginBottom: 6,
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 17,
                  color: "var(--text-tertiary)",
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .hiw-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 36px;
          position: relative;
        }
        .hiw-line-h {
          display: block;
          position: absolute;
          top: 36px;
          left: 15%;
          right: 15%;
          height: 1px;
          background: var(--border);
          container-type: inline-size;
        }
        .hiw-line-v {
          display: none;
          container-type: size;
        }
        .hiw-dot {
          position: absolute;
          top: -3px;
          left: 0;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-primary);
          will-change: transform;
        }
        .hiw-dot-v {
          position: absolute;
          left: -3px;
          top: 0;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-primary);
          will-change: transform;
        }

        @keyframes dot-travel-h {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(100cqi - 6px)); }
        }
        @keyframes dot-travel-v {
          0% { transform: translateY(0); }
          100% { transform: translateY(calc(100cqb - 6px)); }
        }

        @media (max-width: 768px) {
          .hiw-grid {
            grid-template-columns: 1fr;
            gap: 32px;
            padding-left: 24px;
          }
          .hiw-line-h {
            display: none;
          }
          .hiw-line-v {
            display: block;
            position: absolute;
            left: 0;
            top: 36px;
            bottom: 36px;
            width: 1px;
            background: var(--border);
            container-type: size;
          }
        }
      `}</style>
    </section>
  );
}
