"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

// Rotating words picked for emotional resonance with contractors - these
// are the pain points they feel every day, not abstract operational functions.
const words = ["Calls", "Office", "Mornings", "Pipeline", "Paperwork", "Crew"];

export default function HeroHeadline() {
  const measureRef = useRef<HTMLSpanElement>(null);
  const [stepPx, setStepPx] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  const fadeUp = (delay: number) => ({
    initial: prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: "easeOut" as const, delay },
  });

  // Measure the actual rendered pixel height of a word so the container
  // and animation step are EXACTLY right — no em guessing, no font-metric
  // assumptions. Re-measure on resize since font-size is responsive.
  useEffect(() => {
    function measure() {
      if (measureRef.current) {
        setStepPx(measureRef.current.offsetHeight);
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Build pixel-accurate keyframes from the measured step height. We show
  // N words + 1 duplicate of the first word for a seamless wraparound. Each
  // word holds for ~75% of its slot then slides for the remaining ~25%.
  const slots = words.length + 1; // +1 for the wraparound dup
  const slotPct = 100 / slots;
  const holdPct = slotPct * 0.75;
  const keyframes =
    stepPx > 0
      ? `@keyframes cycle-words-px {\n` +
        Array.from({ length: slots }, (_, i) => {
          const startPct = (i * slotPct).toFixed(2);
          const holdEndPct = (i * slotPct + holdPct).toFixed(2);
          const y = -stepPx * i;
          return `  ${startPct}%, ${holdEndPct}% { transform: translateY(${y}px); }`;
        }).join("\n") +
        `\n}`
      : "";

  // Slightly longer total duration so each visceral word reads clearly.
  const cycleSeconds = (slots * 1.6).toFixed(2);

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
        Your AI ops team
      </motion.p>

      {/* Hidden measurement element — same font/size as headline, measures "Sequences" (has descender) */}
      <span
        ref={measureRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          visibility: "hidden",
          pointerEvents: "none",
          fontFamily: "var(--font-sans), sans-serif",
          fontWeight: 600,
          lineHeight: 1.1,
          letterSpacing: "-0.03em",
          display: "block",
          whiteSpace: "nowrap",
        }}
        className="text-[36px] sm:text-[56px] lg:text-[72px]"
      >
        Sequences
      </span>

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
        <span>We run your</span>
        <br className="sm:hidden" />
        {" "}
        {stepPx > 0 && (
          <span
            style={{
              display: "inline-block",
              height: stepPx - 1,
              overflow: "hidden",
              verticalAlign: "bottom",
              position: "relative",
            }}
          >
            <span
              style={{
                display: "block",
                animation: `cycle-words-px ${cycleSeconds}s cubic-bezier(0.16, 1, 0.3, 1) infinite`,
                willChange: "transform",
              }}
            >
              {[...words, words[0]].map((word, i) => (
                <span
                  key={`${word}-${i}`}
                  style={{
                    display: "block",
                    height: stepPx,
                    lineHeight: `${stepPx}px`,
                    overflow: "hidden",
                    clipPath: "inset(0)",
                    padding: 0,
                    margin: 0,
                    color: "var(--text-primary)",
                  }}
                >
                  {word}
                </span>
              ))}
            </span>
          </span>
        )}
      </motion.h1>

      <motion.p
        {...fadeUp(0.3)}
        style={{
          fontFamily: "var(--font-sans), sans-serif",
          fontSize: "clamp(16px, 3vw, 20px)",
          color: "var(--text-tertiary)",
          maxWidth: "560px",
          margin: "24px auto 0",
          lineHeight: 1.6,
        }}
      >
        Answers your calls. Qualifies leads. Books jobs. Sends proposals. Runs your morning briefing. One platform runs your entire operation.
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
            href="/dashboard/ask-endall"
            style={{
              display: "inline-block",
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "16px",
              fontWeight: 500,
              color: "var(--text-primary)",
              backgroundColor: "transparent",
              padding: "12px 24px",
              borderRadius: "6px",
              textDecoration: "none",
              border: "1px solid var(--overlay-strong)",
              transition: "border-color 200ms cubic-bezier(0.16, 1, 0.3, 1), background-color 200ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.backgroundColor = "var(--overlay-soft)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--overlay-strong)"; e.currentTarget.style.backgroundColor = "transparent"; }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.backgroundColor = "var(--overlay-soft)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--overlay-strong)"; e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            Try Ask Endall
          </Link>
        </div>
      </motion.div>

      {keyframes && <style dangerouslySetInnerHTML={{ __html: keyframes }} />}
    </section>
  );
}
