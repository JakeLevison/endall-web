import ScrollReveal from "@/components/shared/ScrollReveal";

// Sits right after the hero. Bridges "we run your ___" to the capability
// cards below. Goal: the contractor says "that's me" before they see any
// product details.
export default function ValuePropSection() {
  return (
    <ScrollReveal>
      <section
        style={{
          padding: "100px 16px",
          borderTop: "1px solid var(--border)",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <p
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: "13px",
              textTransform: "uppercase",
              letterSpacing: "3px",
              color: "var(--text-muted)",
              marginBottom: "32px",
            }}
          >
            Sound familiar?
          </p>

          <p
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "clamp(20px, 3.2vw, 26px)",
              color: "var(--text-secondary)",
              lineHeight: 1.55,
              marginBottom: "28px",
              letterSpacing: "-0.01em",
            }}
          >
            You started this company to do the work. Now you spend half your day
            answering phones, chasing invoices, and wondering which leads fell
            through the cracks. You can&rsquo;t afford a full-time office
            manager, and the ones you&rsquo;ve tried don&rsquo;t last. Meanwhile
            your phone rings at 7 PM and nobody&rsquo;s there to pick it up.
            That lead is gone.
          </p>

          <p
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "clamp(20px, 3.2vw, 26px)",
              color: "var(--text-primary)",
              lineHeight: 1.55,
              marginBottom: "48px",
              letterSpacing: "-0.01em",
              fontWeight: 500,
            }}
          >
            Endall is your AI ops team. It answers every call, qualifies every
            lead, books every job, runs your morning briefing, sends your
            proposals, and tracks your numbers. No hiring. No training. Live in
            48 hours.
          </p>

          {/* Stat callout */}
          <div
            style={{
              borderLeft: "2px solid var(--text-primary)",
              paddingLeft: "20px",
              marginTop: "40px",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "clamp(16px, 2.4vw, 19px)",
                color: "var(--text-tertiary)",
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              The average 15-technician contractor spends roughly{" "}
              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                $170K a year
              </span>{" "}
              on back-office staff. Endall replaces all of it.
            </p>
            <p
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "12px",
                lineHeight: 1.5,
              }}
            >
              Based on industry salary data for office manager, bookkeeper, and
              sales coordinator roles, including benefits and overhead.
            </p>
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}
