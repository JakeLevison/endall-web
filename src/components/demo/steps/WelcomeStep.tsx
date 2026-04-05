"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface WelcomeStepProps {
  onStart: () => void;
}

export default function WelcomeStep({ onStart }: WelcomeStepProps) {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 72px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 24px",
      }}
    >
      <div style={{ maxWidth: 560, textAlign: "center" }}>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: 3,
            color: "var(--text-muted)",
            marginBottom: 20,
          }}
        >
          Interactive walkthrough
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: "clamp(32px, 6vw, 48px)",
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            marginBottom: 16,
          }}
        >
          See what Endall does for your shop.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: 18,
            color: "var(--text-tertiary)",
            lineHeight: 1.6,
            marginBottom: 40,
          }}
        >
          3 minutes. No signup. No sales call.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}
        >
          <button
            type="button"
            onClick={onStart}
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 17,
              fontWeight: 500,
              color: "var(--text-inverse)",
              background: "var(--surface-inverse)",
              border: "none",
              borderRadius: 10,
              padding: "16px 36px",
              cursor: "pointer",
              transition: "background 0.15s, transform 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface-hover)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--surface-inverse)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Start the demo
          </button>

          <Link
            href="/dashboard/ask-endall"
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 14,
              color: "var(--text-muted)",
              textDecoration: "none",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            Or skip the walkthrough and try it yourself →
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
