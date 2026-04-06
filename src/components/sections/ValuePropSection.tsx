import ScrollReveal from "@/components/shared/ScrollReveal";

// "What Endall replaces" — concrete role replacement, then $170K stat.
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
            What Endall replaces
          </p>

          {/* Role replacement — two-column on desktop, stacked on mobile */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "32px",
              marginBottom: "48px",
            }}
          >
            <div>
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
                Your office manager
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
                Endall answers every call, qualifies every lead, and books jobs
                to your calendar. Nothing falls through.
              </p>
            </div>

            <div>
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
                Your bookkeeper
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
                Track revenue, job costs, and crew utilization from a single
                dashboard. Morning briefings land before your first coffee.
              </p>
            </div>

            <div>
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
                Your sales coordinator
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
                Endall prospects for you — finds opportunities, sends proposals,
                follows up automatically. You close. It does the rest.
              </p>
            </div>
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
            One AI ops team. A fraction of the cost. Up and running fast.
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
              replaces it.
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
