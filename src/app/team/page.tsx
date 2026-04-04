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
              color: "#ffffff",
              lineHeight: 1.2,
              marginBottom: 48,
            }}
          >
            An AI ops team for MEP contractors.
          </h1>

          {/* Mission */}
          <section style={{ marginBottom: 40 }}>
            <h2
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 18,
                fontWeight: 600,
                color: "#ffffff",
                marginBottom: 12,
              }}
            >
              Our mission
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-secondary)" }}>
              Endall exists to give mechanical, electrical, and plumbing contractors the
              operational firepower that only large general contractors can afford today.
              We build AI that does the back-office work -- financial models, budgets,
              estimates, proposals, competitive analysis -- so owners can focus on winning
              jobs and running crews.
            </p>
          </section>

          {/* Problem */}
          <section style={{ marginBottom: 40 }}>
            <h2
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 18,
                fontWeight: 600,
                color: "#ffffff",
                marginBottom: 12,
              }}
            >
              The problem we solve
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-secondary)" }}>
              Most MEP contractors run their operations on spreadsheets, phone calls, and
              gut instinct. They lose bids because they can&apos;t turn around estimates fast
              enough. They leave money on the table because nobody has time to build a real
              financial model. Endall closes that gap with an AI operations platform that
              produces the same deliverables a full-time analyst would -- in minutes, not
              weeks.
            </p>
          </section>

          {/* Why MEP */}
          <section style={{ marginBottom: 48 }}>
            <h2
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 18,
                fontWeight: 600,
                color: "#ffffff",
                marginBottom: 12,
              }}
            >
              Why MEP contractors
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-secondary)" }}>
              MEP is the backbone of every building, but the trade is underserved by
              technology. These are technically sophisticated businesses that deserve
              modern operational tools. We chose this market because the impact is
              immediate: faster estimates win more work, better financials improve margins,
              and professional proposals build trust with GCs and building owners.
            </p>
          </section>

          {/* Divider */}
          <div
            style={{
              borderTop: "1px solid var(--border)",
              marginBottom: 48,
            }}
          />

          {/* Founder note */}
          <section style={{ marginBottom: 48 }}>
            <h2
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 18,
                fontWeight: 600,
                color: "#ffffff",
                marginBottom: 16,
              }}
            >
              A note from the founder
            </h2>
            <div
              style={{
                padding: "24px",
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: 12,
              }}
            >
              <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-secondary)", marginBottom: 16 }}>
                I come from operations and finance. Before Endall, I spent years watching
                skilled contractors lose time on work that had nothing to do with their
                trade -- formatting spreadsheets, chasing numbers, writing proposals from
                scratch every time. The tools they were offered were either too generic or
                too expensive.
              </p>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-secondary)", marginBottom: 16 }}>
                Endall is the AI ops team I wish those contractors had. It produces real
                deliverables -- Excel workbooks with live formulas, branded proposals,
                competitive reports with sources -- not summaries or suggestions. The goal
                is simple: give every MEP contractor the operational capacity of a firm ten
                times their size.
              </p>
              <p style={{ fontSize: 14, color: "var(--text-tertiary)" }}>
                -- Jake Levison, Founder
              </p>
            </div>
          </section>

          {/* CTA */}
          <div style={{ textAlign: "center" }}>
            <Link
              href="/contact"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 32px",
                fontSize: 14,
                fontWeight: 500,
                color: "#000",
                backgroundColor: "#fff",
                borderRadius: 8,
                textDecoration: "none",
                transition: "background-color 300ms",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e5e5e5")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
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
