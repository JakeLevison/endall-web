"use client";

import Navbar from "@/components/hero/Navbar";
import Footer from "@/components/sections/Footer";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        color: "var(--text-secondary)",
      }}
    >
      <Navbar />
      <main style={{ paddingTop: 120, paddingBottom: 80 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
          {/* Page header */}
          <p
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "3px",
              color: "var(--text-muted)",
              marginBottom: 16,
            }}
          >
            About Endall
          </p>
          <h1
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              lineHeight: 1.2,
              marginBottom: 48,
            }}
          >
            An AI ops team for MEP and specialty contractors.
          </h1>

          {/* Mission */}
          <section style={{ marginBottom: 48 }}>
            <h2
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 18,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 12,
              }}
            >
              Our mission
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.9, color: "var(--text-secondary)", marginBottom: 16 }}>
              The trades are at an inflection point. AI is reshaping what tools can do,
              and the AI buildout is reshaping what the trades have to deliver. Both
              shifts hit at once.
            </p>
            <p style={{ fontSize: 17, lineHeight: 1.9, color: "var(--text-secondary)", marginBottom: 16 }}>
              Endall is built for that moment. We are not a tool your team operates. We
              are a team of AI agents that operates the back office itself. A lead calls
              in and gets qualified on the first ring. A quote is drafted before close of
              business. A crew is dispatched on the morning schedule. An invoice is sent
              the day the job closes. No portal to log into to make any of it happen.
            </p>
            <p style={{ fontSize: 17, lineHeight: 1.9, color: "var(--text-secondary)", marginBottom: 16 }}>
              Our agents sit alongside the platforms your team already uses, or they
              replace the office headcount you would otherwise need to hire. Either way,
              the work runs without your people running it.
            </p>
            <p style={{ fontSize: 17, lineHeight: 1.9, color: "var(--text-secondary)", marginBottom: 16 }}>
              Our customers are mechanical, electrical, plumbing, fire protection,
              low-voltage, and controls contractors. The firms now bidding the data
              center, power, and mission-critical work that everyone is racing to deliver.
            </p>
            <p style={{ fontSize: 17, lineHeight: 1.9, color: "var(--text-secondary)" }}>
              A contractor with ten people in the field should be able to run like they
              have a hundred in the office. That is the standard we build to.
            </p>
          </section>

          <div style={{ borderTop: "1px solid var(--border)", marginBottom: 48 }} />

          {/* Why now */}
          <section style={{ marginBottom: 48 }}>
            <h2
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 18,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 12,
              }}
            >
              Why now
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.9, color: "var(--text-secondary)", marginBottom: 16 }}>
              Two assumptions held for decades. The first was that the back office needed
              people to run it. The second was that demand grew at a normal pace. Both
              broke in the same eighteen months.
            </p>
            <p style={{ fontSize: 17, lineHeight: 1.9, color: "var(--text-secondary)", marginBottom: 16 }}>
              AI agents now run the workflows old tools were designed to monitor. And
              demand is no longer normal. U.S. data center construction starts ran 138%
              above the prior year through late 2025, with 2026 on pace for more than
              $115 billion in spending. The Associated Builders and Contractors estimates
              the construction industry needs 349,000 net new workers in 2026 alone, on
              top of normal hiring. Worker shortages are now the leading cause of project
              delays in the country.
            </p>
            <p style={{ fontSize: 17, lineHeight: 1.9, color: "var(--text-secondary)" }}>
              The constraint has moved from tools to operations, and from crews to
              capacity. You cannot hire your way through a ten-year demand window when the
              industry is already short hundreds of thousands of people. The only path is
              to multiply the back office.
            </p>
          </section>

          <div style={{ borderTop: "1px solid var(--border)", marginBottom: 48 }} />

          {/* CTA */}
          <div style={{ textAlign: "center" }}>
            <Link
              href="/contact"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 32px",
                fontSize: 16,
                fontWeight: 500,
                color: "var(--text-inverse)",
                backgroundColor: "var(--surface-inverse)",
                borderRadius: 8,
                textDecoration: "none",
                transition: "background-color 300ms",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-inverse)")}
            >
              Partner with us
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
