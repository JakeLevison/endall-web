"use client";

import Link from "next/link";
import Navbar from "@/components/hero/Navbar";
import Footer from "@/components/sections/Footer";

export default function DemoConfirmation() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        color: "var(--text-secondary)",
      }}
    >
      <Navbar />
      <main style={{ paddingTop: 160, paddingBottom: 80 }}>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
              <path d="M2 9L8 15L20 3" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "clamp(24px, 5vw, 36px)",
              fontWeight: 600,
              color: "#fff",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              marginBottom: 12,
            }}
          >
            You&rsquo;re all set.
          </h1>

          <p
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 16,
              color: "var(--text-tertiary)",
              lineHeight: 1.7,
              marginBottom: 40,
            }}
          >
            We received your request. Pick a time below and we&rsquo;ll walk you through Endall live.
          </p>

          <a
            href="https://calendly.com/jakelevison/30min"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              background: "#fff",
              color: "#000",
              padding: "14px 40px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
              fontFamily: "var(--font-sans), sans-serif",
              transition: "background-color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e5e5e5")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
          >
            Schedule Your Demo
          </a>

          <p
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 13,
              color: "var(--text-muted)",
              marginTop: 16,
            }}
          >
            20 minutes &middot; no prep needed
          </p>

          <div
            style={{
              marginTop: 56,
              paddingTop: 24,
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <Link
              href="/"
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 13,
                color: "var(--text-muted)",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              &larr; Back to endall.ai
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
