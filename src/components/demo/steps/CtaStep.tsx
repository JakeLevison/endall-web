"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Phone, FileText, Zap } from "lucide-react";

const POINTS = [
  {
    icon: Phone,
    text: "Answers every call. Books jobs. Sends alerts.",
  },
  {
    icon: FileText,
    text: "Builds budgets, NPVs, estimates, proposals.",
  },
  {
    icon: Zap,
    text: "No training. No FTE. Plugs in 48 hours.",
  },
];

export default function CtaStep() {
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
      <div style={{ maxWidth: 680, width: "100%", textAlign: "center" }}>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: "clamp(32px, 6vw, 48px)",
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            marginBottom: 40,
          }}
        >
          That&rsquo;s your AI ops team.
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 12,
            marginBottom: 40,
          }}
          className="md:grid-cols-3"
        >
          {POINTS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.text}
                style={{
                  padding: 20,
                  background: "var(--overlay-weak)",
                  border: "1px solid var(--overlay-soft)",
                  borderRadius: 12,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  textAlign: "left",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "var(--overlay-soft)",
                    border: "1px solid var(--overlay-medium)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={18} style={{ color: "var(--text-primary)" }} />
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: 15,
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {p.text}
                </p>
              </div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
          style={{
            padding: "20px 24px",
            background: "var(--overlay-soft)",
            border: "1px solid var(--overlay-medium)",
            borderRadius: 12,
            marginBottom: 32,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 18,
              color: "var(--text-primary)",
              fontWeight: 500,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Set up in days, not months.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <Link
            href="/contact"
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 17,
              fontWeight: 500,
              color: "var(--text-inverse)",
              background: "var(--surface-inverse)",
              border: "none",
              borderRadius: 10,
              padding: "16px 36px",
              textDecoration: "none",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--surface-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "var(--surface-inverse)")
            }
          >
            Get started
          </Link>

          <Link
            href="/dashboard/ask-endall"
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 14,
              color: "var(--text-muted)",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            Keep exploring →
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
