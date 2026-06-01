"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type Stage = {
  number: string;
  title: string;
  tagline: string;
  bullets: string[];
};

const STAGES: Stage[] = [
  {
    number: "01",
    title: "Win the work",
    tagline: "Every lead captured, every bid out the door fast.",
    bullets: [
      "Every call answered, every lead qualified and added to your CRM, every appointment booked to your calendar",
      "Outbound agent prospects target accounts, follows up, surfaces warm replies",
      "Estimates and proposals drafted in minutes, not days",
    ],
  },
  {
    number: "02",
    title: "Start the work",
    tagline: "Jobs kicked off without the Monday morning scramble.",
    bullets: [
      "Permits tracked with deadlines and inspector contacts",
      "Crews scheduled, customers confirmed, kickoff docs drafted",
      "Materials, scope, and site details in one place before the truck rolls",
    ],
  },
  {
    number: "03",
    title: "Do the work",
    tagline: "Crews in the right place, with the right info, every day.",
    bullets: [
      "Dispatch routes techs to the right site with the right materials",
      "Change orders flagged in real time, not at invoicing",
      "Daily logs and compliance docs generated as the work happens",
    ],
  },
  {
    number: "04",
    title: "Get paid",
    tagline: "Invoices out the day the job closes. Collections on autopilot.",
    bullets: [
      "Invoices drafted from job data and pushed to QuickBooks",
      "Follow-up sequences run on overdue accounts",
      "Books kept clean and month-end ready for the CPA",
    ],
  },
  {
    number: "05",
    title: "Grow the next job",
    tagline: "Every job makes the next bid smarter.",
    bullets: [
      "Pipeline visibility from first call to signed contract",
      "Margin tracking and job costing by customer, crew, and job type",
      "Capacity planning so the next bid reflects what the business can actually deliver",
      "Weekly competitive and market intelligence: who you're up against, material pricing shifts, and new bid opportunities in your area",
    ],
  },
];

export default function HowItWorksLifecycle() {
  return (
    <section
      id="how-it-works"
      style={{
        padding: "80px 16px 40px",
        scrollMarginTop: "100px",
      }}
    >
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        {/* Eyebrow */}
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
          How it works
        </p>

        {/* Heading */}
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
          The contractor lifecycle, run end to end.
        </h2>

        {/* Subhead */}
        <p
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: "clamp(15px, 2.2vw, 17px)",
            color: "var(--text-tertiary)",
            textAlign: "center",
            maxWidth: "620px",
            margin: "0 auto 48px",
            lineHeight: 1.55,
          }}
        >
          Five stages. Every one covered by an agent, not a form to fill out.
        </p>

        {/* Stage cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {STAGES.map((stage) => (
            <StageCard key={stage.number} stage={stage} />
          ))}
        </div>

        {/* Closing */}
        <p
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: "clamp(15px, 2.2vw, 17px)",
            color: "var(--text-tertiary)",
            textAlign: "center",
            marginTop: "40px",
            fontStyle: "italic",
          }}
        >
          One ops layer. One login. No implementation consultants.
        </p>
      </div>
    </section>
  );
}

function StageCard({ stage }: { stage: Stage }) {
  const [isOpen, setIsOpen] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLUListElement>(null);
  const panelId = `hiw-panel-${stage.number}`;

  // Measure the bullets so the open height fits exactly (no clipping on
  // narrow screens, no blank space) and stays correct as text re-wraps.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const update = () => setContentHeight(el.scrollHeight);
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="hiw-stage-card"
      style={{
        border: "1px solid var(--overlay-medium)",
        borderColor: isOpen ? "var(--brand-accent-light)" : "var(--overlay-medium)",
        borderRadius: "12px",
        background: isOpen ? "var(--overlay-weak)" : "var(--overlay-soft)",
        overflow: "hidden",
        transition: "background 200ms ease, border-color 200ms ease, box-shadow 240ms ease",
        boxShadow: isOpen ? "var(--shadow-card)" : "none",
      }}
    >
      {/* Header: clickable toggle (number + title + tagline + chevron) */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="hiw-stage-header"
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "72px 1fr auto",
          gap: "16px",
          alignItems: "center",
          padding: "20px 24px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          color: "inherit",
          fontFamily: "inherit",
        }}
      >
        {/* Stage number */}
        <span
          className="hiw-stage-number"
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: "48px",
            fontWeight: 400,
            lineHeight: 1,
            color: "#f97316",
            textAlign: "center",
            letterSpacing: "-0.02em",
          }}
        >
          {stage.number}
        </span>

        {/* Title + tagline */}
        <span style={{ display: "block", minWidth: 0 }}>
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "20px",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "var(--text-primary)",
              marginBottom: "4px",
            }}
          >
            {stage.title}
          </span>
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "15px",
              color: "var(--text-tertiary)",
              lineHeight: 1.55,
            }}
          >
            {stage.tagline}
          </span>
        </span>

        <ChevronDown
          size={20}
          style={{
            color: "var(--text-muted)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
            flexShrink: 0,
          }}
        />
      </button>

      {/* Collapsible bullets. max-height transition avoids the grid
          sub-pixel rendering bug noted in CapabilityAccordion. */}
      <div
        id={panelId}
        style={{
          maxHeight: isOpen ? `${contentHeight}px` : "0",
          overflow: "hidden",
          transition: "max-height 320ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <ul
          ref={contentRef}
          className="hiw-stage-bullets"
          style={{
            listStyle: "none",
            padding: "4px 24px 22px 112px",
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {stage.bullets.map((bullet) => (
            <li
              key={bullet}
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "15px",
                color: "var(--text-secondary)",
                lineHeight: 1.55,
                paddingLeft: "16px",
                position: "relative",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: 0,
                  top: "9px",
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  background: "var(--text-muted)",
                }}
              />
              {bullet}
            </li>
          ))}
        </ul>
      </div>

      <style jsx>{`
        @media (max-width: 560px) {
          .hiw-stage-header {
            grid-template-columns: 48px 1fr auto !important;
            gap: 12px !important;
            padding: 16px 18px !important;
          }
          .hiw-stage-number {
            font-size: 34px !important;
          }
          .hiw-stage-bullets {
            padding-left: 18px !important;
            padding-right: 18px !important;
          }
        }
      `}</style>
    </div>
  );
}
