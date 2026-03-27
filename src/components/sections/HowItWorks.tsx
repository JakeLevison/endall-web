"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "01",
    title: "Connect",
    description: "Link email, calendar, and tools. Data syncs automatically.",
  },
  {
    number: "02",
    title: "Configure",
    description: "Pipeline stages, sequences, workflows. Templates or custom.",
  },
  {
    number: "03",
    title: "Operate",
    description: "AI handles the routine. You handle the relationships.",
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      style={{ padding: "64px 16px" }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <p
          style={{
            fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "#666",
            textAlign: "center",
            marginBottom: 48,
          }}
        >
          Getting started
        </p>

        {/* Desktop: horizontal layout */}
        <div className="hiw-grid">
          {/* Connecting line (desktop) */}
          <div className="hiw-line-h">
            <div
              className="hiw-dot"
              style={{
                opacity: visible ? 1 : 0,
                animation: visible ? "dot-travel-h 3s ease-in-out infinite" : "none",
              }}
            />
          </div>

          {/* Connecting line (mobile) */}
          <div className="hiw-line-v">
            <div
              className="hiw-dot-v"
              style={{
                opacity: visible ? 1 : 0,
                animation: visible ? "dot-travel-v 3s ease-in-out infinite" : "none",
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
                  fontFamily: "var(--font-eb-garamond, 'EB Garamond', serif)",
                  fontSize: 72,
                  color: "#1a1a1a",
                  lineHeight: 1,
                  marginBottom: 8,
                  fontWeight: 400,
                }}
              >
                {step.number}
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-eb-garamond, 'EB Garamond', serif)",
                  fontSize: 24,
                  color: "#fff",
                  fontWeight: 400,
                  marginBottom: 6,
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
                  fontSize: 15,
                  color: "#888",
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
          gap: 48px;
          position: relative;
        }
        .hiw-line-h {
          display: block;
          position: absolute;
          top: 36px;
          left: 15%;
          right: 15%;
          height: 1px;
          background: #222;
        }
        .hiw-line-v {
          display: none;
        }
        .hiw-dot {
          position: absolute;
          top: -3px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #fff;
        }
        .hiw-dot-v {
          position: absolute;
          left: -3px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #fff;
        }

        @keyframes dot-travel-h {
          0% { left: 0; }
          50% { left: calc(100% - 7px); }
          100% { left: 0; }
        }
        @keyframes dot-travel-v {
          0% { top: 0; }
          50% { top: calc(100% - 7px); }
          100% { top: 0; }
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
            background: #222;
          }
        }
      `}</style>
    </section>
  );
}
