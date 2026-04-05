"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Phone } from "lucide-react";

interface CallStepProps {
  onNext: () => void;
}

const PHONE_DISPLAY = "+1 (571) 200-7813";
const PHONE_TEL = "+15712007813";

export default function CallStep({ onNext }: CallStepProps) {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div
      style={{
        minHeight: "calc(100vh - 72px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{ maxWidth: 560, width: "100%", textAlign: "center" }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "var(--overlay-soft)",
            border: "1px solid var(--overlay-medium)",
            marginBottom: 24,
          }}
        >
          <Phone size={28} style={{ color: "var(--text-primary)" }} />
        </div>

        <p
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: 3,
            color: "var(--text-muted)",
            marginBottom: 16,
          }}
        >
          AI Front Desk
        </p>

        <h2
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: "clamp(28px, 5vw, 38px)",
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
            marginBottom: 16,
          }}
        >
          Call this number from your phone.
        </h2>

        <p
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: 18,
            color: "var(--text-tertiary)",
            lineHeight: 1.5,
            marginBottom: 36,
            maxWidth: 480,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          It&rsquo;s your AI front desk — try booking a service call. Ask it
          anything a customer would ask.
        </p>

        {mobile ? (
          <a
            href={`tel:${PHONE_TEL}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              width: "100%",
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 22,
              fontWeight: 600,
              color: "var(--text-inverse)",
              background: "var(--surface-inverse)",
              border: "none",
              borderRadius: 12,
              padding: "20px 24px",
              textDecoration: "none",
              letterSpacing: "-0.01em",
              marginBottom: 20,
            }}
          >
            <Phone size={20} />
            {PHONE_DISPLAY}
          </a>
        ) : (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 36,
              fontWeight: 600,
              color: "var(--text-primary)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: "24px 40px",
              letterSpacing: "-0.02em",
              marginBottom: 24,
            }}
          >
            <Phone size={28} style={{ color: "var(--text-tertiary)" }} />
            {PHONE_DISPLAY}
          </div>
        )}

        <p
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: 14,
            color: "var(--text-muted)",
            lineHeight: 1.5,
            marginBottom: 40,
          }}
        >
          This is a real AI voice agent. It answers every call, qualifies the
          lead, and books the job on your calendar.
        </p>

        <button
          type="button"
          onClick={onNext}
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: 15,
            color: "var(--text-tertiary)",
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "12px 24px",
            cursor: "pointer",
            transition: "background 0.15s, color 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--overlay-soft)";
            e.currentTarget.style.color = "var(--text-primary)";
            e.currentTarget.style.borderColor = "var(--border-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "none";
            e.currentTarget.style.color = "var(--text-tertiary)";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          I&rsquo;ve heard enough →
        </button>
      </motion.div>
    </div>
  );
}
