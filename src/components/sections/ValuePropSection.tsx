import ScrollReveal from "@/components/shared/ScrollReveal";

// "What Endall covers" section: capacity framing plus the $170K stat.
export default function ValuePropSection() {
  return (
    <ScrollReveal>
      <section
        style={{
          padding: "48px 16px 48px",
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
              marginBottom: "28px",
            }}
          >
            What Endall covers
          </p>

          {/* Role cards: 3-column on desktop, stacked on mobile */}
          <div
            className="role-cards-grid"
            style={{
              display: "grid",
              gap: "20px",
              marginBottom: "48px",
            }}
          >
            {[
              {
                title: "Your bookkeeper",
                desc: "A daily ops briefing hits your inbox every morning with overnight leads, today's schedule, and what needs follow-up. Revenue, pipeline, and job status all in one dashboard.",
              },
              {
                title: "Your office manager",
                desc: "Endall answers every call, qualifies every lead, and books jobs to your calendar. Nothing falls through.",
              },
              {
                title: "Your sales coordinator",
                desc: "Endall prospects for you, sends proposals, and follows up automatically. You close. The ops layer does the rest.",
              },
            ].map((card) => (
              <div
                key={card.title}
                style={{
                  border: "1px solid var(--overlay-medium)",
                  borderRadius: "12px",
                  padding: "24px",
                  background: "var(--overlay-weak)",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: "clamp(18px, 2.5vw, 22px)",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: "10px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: "clamp(15px, 2vw, 17px)",
                    color: "var(--text-secondary)",
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  {card.desc}
                </p>
              </div>
            ))}
          </div>

          <p
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "clamp(17px, 2.4vw, 20px)",
              fontWeight: 600,
              color: "var(--text-primary)",
              textAlign: "center",
              marginBottom: "48px",
              letterSpacing: "-0.01em",
            }}
          >
            Save roughly $170K a year on back-office spend. Get 30+ hours a week back on the tools.
          </p>

          {/* $170K stat - hero of this section */}
          <div
            style={{
              borderLeft: "3px solid var(--brand-accent-light)",
              paddingLeft: "24px",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "clamp(44px, 8vw, 72px)",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.03em",
                lineHeight: 1,
                margin: "0 0 12px",
              }}
            >
              $170K<span style={{ color: "var(--brand-accent-light)" }}>/yr</span>
            </p>
            <p
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "clamp(17px, 2.4vw, 20px)",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
                margin: 0,
                fontWeight: 500,
              }}
            >
              Average back-office spend for a 15-tech contractor. Endall
              covers it for a fraction of the cost.
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
              Industry salary data: office manager + bookkeeper + sales
              coordinator, loaded with benefits and overhead.
            </p>
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}
