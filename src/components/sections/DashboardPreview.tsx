import DashboardMock from "@/components/hero/DashboardMock";
import ScrollReveal from "@/components/shared/ScrollReveal";

// Relocated dashboard screenshot. It sits AFTER the capability accordion
// so the contractor now has context for what they're looking at.
export default function DashboardPreview() {
  return (
    <ScrollReveal>
      <section style={{ padding: "80px 16px 40px" }}>
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            textAlign: "center",
            marginBottom: "40px",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "clamp(28px, 5vw, 36px)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              marginBottom: "12px",
            }}
          >
            Your entire operation. One screen.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "clamp(16px, 2.4vw, 18px)",
              color: "var(--text-tertiary)",
              lineHeight: 1.55,
              maxWidth: "620px",
              margin: "0 auto",
            }}
          >
            Every call, every lead, every job, every dollar - visible at a glance.
          </p>
        </div>
        {/* Contained panel behind the screenshot — subtle depth, rounded, floating */}
        <div
          style={{
            maxWidth: "980px",
            margin: "0 auto",
            padding: "clamp(20px, 4vw, 40px)",
            background: "var(--overlay-weak)",
            border: "1px solid var(--overlay-medium)",
            borderRadius: "20px",
            boxShadow: "var(--shadow-elevated)",
          }}
        >
          <DashboardMock />
        </div>
      </section>
    </ScrollReveal>
  );
}
