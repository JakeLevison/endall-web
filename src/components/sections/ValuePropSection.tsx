import ScrollReveal from "@/components/shared/ScrollReveal";

// Shorter, punchier block. One paragraph that lands the pain, then the
// $170K stat as the hero visual element of this section.
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
              marginBottom: "28px",
            }}
          >
            The math
          </p>

          <p
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "clamp(20px, 3vw, 24px)",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
              marginBottom: "48px",
              letterSpacing: "-0.01em",
            }}
          >
            You started this company to do the work - not to answer phones,
            chase invoices, and write proposals at 10 PM. Endall runs the
            office so you don&rsquo;t have to.
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
