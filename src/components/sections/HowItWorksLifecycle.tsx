"use client";

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
      "Front desk answers every call, qualifies the lead, books the site visit",
      "Outbound agent prospects target accounts, follows up, surfaces warm replies",
      "Estimates and proposals drafted in hours, not days",
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
  return (
    <div
      className="hiw-stage-card"
      style={{
        border: "1px solid var(--overlay-medium)",
        borderRadius: "12px",
        background: "var(--overlay-soft)",
        padding: "24px",
        display: "grid",
        gridTemplateColumns: "88px 1fr",
        gap: "20px",
        alignItems: "start",
      }}
    >
      {/* Stage number */}
      <div
        style={{
          fontFamily: "var(--font-sans), sans-serif",
          fontSize: "56px",
          fontWeight: 400,
          lineHeight: 1,
          color: "var(--surface-hover)",
          textAlign: "center",
          letterSpacing: "-0.02em",
        }}
      >
        {stage.number}
      </div>

      {/* Content */}
      <div>
        <h3
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: "20px",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "var(--text-primary)",
            marginBottom: "4px",
          }}
        >
          {stage.title}
        </h3>
        <p
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: "15px",
            color: "var(--text-tertiary)",
            lineHeight: 1.55,
            marginBottom: "14px",
          }}
        >
          {stage.tagline}
        </p>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
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
          .hiw-stage-card {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          .hiw-stage-card > div:first-child {
            text-align: left !important;
            font-size: 40px !important;
          }
        }
      `}</style>
    </div>
  );
}
