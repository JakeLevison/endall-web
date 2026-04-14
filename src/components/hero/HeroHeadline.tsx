"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

export default function HeroHeadline() {
  const prefersReducedMotion = useReducedMotion();

  const fadeUp = (delay: number) => ({
    initial: prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: "easeOut" as const, delay },
  });

  // Hero headline candidates (Jake to pick). Sentence case, no em dashes,
  // savings-first, "ops" framing, no "replace/cut staff" vibes.
  // Alt A: "Cut your back-office cost by 90% and go back on the tools."
  // Alt B: "An ops layer that saves you 30 hours a week (and about 170 grand a year)."
  // Chosen: savings-first, plain-spoken, no AI-flavor.

  return (
    <section
      style={{
        paddingTop: "140px",
        paddingBottom: "60px",
        textAlign: "center",
        paddingLeft: "16px",
        paddingRight: "16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Tagline */}
      <motion.p
        {...fadeUp(0)}
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "3px",
          color: "var(--text-muted)",
          marginBottom: "20px",
        }}
      >
        An ops layer that compounds
      </motion.p>

      <motion.h1
        {...fadeUp(0.15)}
        style={{
          fontFamily: "var(--font-sans), sans-serif",
          fontWeight: 600,
          color: "var(--text-secondary)",
          lineHeight: 1.1,
          letterSpacing: "-0.03em",
          margin: "0 auto",
          maxWidth: "900px",
        }}
        className="text-[36px] sm:text-[56px] lg:text-[72px]"
      >
        Save 90% on your back office so you can win on the field.
      </motion.h1>

      <motion.p
        {...fadeUp(0.3)}
        style={{
          fontFamily: "var(--font-sans), sans-serif",
          fontSize: "clamp(16px, 2.5vw, 20px)",
          color: "var(--text-tertiary)",
          maxWidth: "680px",
          margin: "24px auto 0",
          lineHeight: 1.6,
        }}
      >
        Endall is an ops layer for MEP and specialty contractors. It scales your
        team across the bookkeeper, office manager, and sales coordinator seats
        for a fraction of what a full back office costs.
      </motion.p>

      <motion.div {...fadeUp(0.45)} style={{ marginTop: "40px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            href="/demo"
            style={{
              display: "inline-block",
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "16px",
              fontWeight: 500,
              color: "var(--text-inverse)",
              backgroundColor: "var(--surface-inverse)",
              padding: "12px 24px",
              borderRadius: "6px",
              textDecoration: "none",
              transition: "background-color 200ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-inverse)")}
            onFocus={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-hover)")}
            onBlur={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-inverse)")}
          >
            See it in action
          </Link>
          <Link
            href="/dashboard"
            style={{
              display: "inline-block",
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "16px",
              fontWeight: 500,
              color: "var(--text-inverse)",
              backgroundColor: "var(--surface-inverse)",
              padding: "12px 24px",
              borderRadius: "6px",
              textDecoration: "none",
              border: "1px solid var(--surface-inverse)",
              transition: "opacity 200ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            onFocus={(e) => { e.currentTarget.style.opacity = "0.85"; }}
            onBlur={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            Open App
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
