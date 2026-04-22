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
            <p style={{ fontSize: 17, lineHeight: 1.9, color: "var(--text-secondary)" }}>
              MEP contractors build the backbone of every commercial building. They run
              technically sophisticated businesses on outdated back-office tools, and the
              data center buildout is pushing them to scale faster than they can hire.
              Endall is the ops team they&apos;ve never been able to build: AI agents that
              answer the phone, prospect for new work, draft estimates, dispatch crews,
              push invoices, and keep the books. Not software your team operates. A team
              itself.
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
              The tools that cover the contractor back office today were built for the
              last decade. They assumed a large office staff operating dashboards, and
              priced themselves accordingly. Two things changed. AI became capable enough
              to actually do the work, not just track it. The AI data center buildout
              opened a ten-year window for MEP contractors who can scale their operations
              as fast as they scale their crews.
            </p>
            <p style={{ fontSize: 17, lineHeight: 1.9, color: "var(--text-secondary)" }}>
              Endall is built for that window. Every function in the back office is an
              agent, not a module. Every workflow runs end-to-end, not one form at a
              time. A contractor with ten people in the field can run like they have a
              hundred in the office. No implementation consultants. No training. Live in
              48 hours.
            </p>
          </section>

          {/* Divider */}
          <div
            style={{
              borderTop: "1px solid var(--border)",
              marginBottom: 48,
            }}
          />

          {/* Leadership */}
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
              Leadership
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
                <p style={{ fontSize: 16, color: "var(--text-muted)", marginBottom: 8 }}>
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
            <p style={{ fontSize: 17, lineHeight: 1.9, color: "var(--text-secondary)", marginBottom: 16 }}>
              Before founding Endall, Jake spent six years at PHT Investment Group as
              Director of Business Development, where he raised institutional capital,
              sourced acquisitions, and worked directly with the operating teams of
              industrial and infrastructure businesses. He watched skilled operators lose
              bids, miss calls, and leave money on the table because they didn&apos;t
              have the back-office capacity to keep up with their own growth. The tools
              they needed either didn&apos;t exist or cost ten times what a growing
              service business could justify. That gap is what led him to start Endall.
            </p>
            <p style={{ fontSize: 17, lineHeight: 1.9, color: "var(--text-secondary)", marginBottom: 16 }}>
              Prior to PHT, Jake held roles at Blockworks, M&amp;T Bank, and Morgan
              Stanley. He holds a B.A. in Philosophy, Politics, and Economics from the
              University of Pennsylvania, where he played Division I baseball.
            </p>
            <p style={{ fontSize: 17, lineHeight: 1.9, color: "var(--text-secondary)" }}>
              Jake is supported by a growing team across engineering, product, sales, and
              channel partnerships, with advisors from construction, data centers, and
              private markets.
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
