"use client";

import Navbar from "@/components/hero/Navbar";
import Footer from "@/components/sections/Footer";
import Link from "next/link";
import Image from "next/image";

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
            An AI ops team for MEP contractors.
          </h1>

          {/* Mission */}
          <section style={{ marginBottom: 40 }}>
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
                color: "var(--text-primary)",
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
                color: "var(--text-primary)",
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

          {/* Meet the Founder */}
          <section style={{ marginBottom: 48 }}>
            <h2
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 18,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 24,
              }}
            >
              Meet the Founder
            </h2>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, marginBottom: 20 }}>
              <Image
                src="/jake-headshot.png"
                alt="Jake Levison"
                width={250}
                height={250}
                style={{ borderRadius: "50%", objectFit: "cover" }}
              />
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                  Jake Levison
                </p>
                <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 8 }}>
                  Founder
                </p>
                <a
                  href="https://www.linkedin.com/in/jakelevison/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Jake Levison on LinkedIn"
                  style={{ color: "var(--text-tertiary)", transition: "color 200ms" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#0a66c2")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-secondary)", marginBottom: 16 }}>
              Before founding Endall, Jake spent six years as Director of Business
              Development at Post Harvest Technologies, a private investment and operating
              platform dedicated to post-harvest infrastructure and logistics. He led
              capital formation, deal origination, and investor relations {'\u2014'} building
              institutional relationships and advancing transactions across acquisitions,
              real estate, and development.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-secondary)", marginBottom: 16 }}>
              Working closely with PHT&apos;s portfolio companies and their operations teams,
              he saw the same pattern everywhere: skilled operators losing bids, missing
              calls, and leaving money on the table because no one was covering the back
              office. The tools they needed either didn&apos;t exist or cost ten times what a
              growing service business could justify. That gap is what led him to start
              Endall.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-secondary)" }}>
              Prior to PHT, Jake held roles at Blockworks, M&amp;T Bank, and Morgan Stanley.
              He holds a B.A. in Philosophy, Politics, and Economics from the University
              of Pennsylvania, where he played Division I baseball.
            </p>
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
