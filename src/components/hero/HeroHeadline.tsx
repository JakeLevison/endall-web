"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const words = ["CRM", "Sequences", "Workflows", "Tasks", "Reports"];

export default function HeroHeadline() {
  const measureRef = useRef<HTMLSpanElement>(null);
  const [stepPx, setStepPx] = useState(0);

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

  // Build pixel-accurate keyframes from the measured step height.
  // 5 words + 1 duplicate for seamless loop = 6 positions.
  const totalH = stepPx * 6;
  const keyframes = stepPx > 0 ? `
    @keyframes cycle-words-px {
      0%, 14%    { transform: translateY(0); }
      18%, 30%   { transform: translateY(-${stepPx}px); }
      34%, 48%   { transform: translateY(-${stepPx * 2}px); }
      52%, 64%   { transform: translateY(-${stepPx * 3}px); }
      68%, 80%   { transform: translateY(-${stepPx * 4}px); }
      84%, 100%  { transform: translateY(-${stepPx * 5}px); }
    }
  ` : "";

  return (
    <section
      style={{
        paddingTop: "140px",
        paddingBottom: "60px",
        textAlign: "center",
        paddingLeft: "16px",
        paddingRight: "16px",
      }}
    >
      {/* Tagline */}
      <p
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "3px",
          color: "var(--text-muted)",
          marginBottom: "20px",
        }}
      >
        The AI Operating System for Your Business
      </p>

      {/* Hidden measurement element — same font/size as headline, measures "Sequences" (has descender) */}
      <span
        ref={measureRef}
        aria-hidden="true"
        style={{
          position: "absolute",
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

      <h1
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
        <span>One platform for</span>
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
                animation: "cycle-words-px 12.5s cubic-bezier(0.16, 1, 0.3, 1) infinite",
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
                    color: "#ffffff",
                  }}
                >
                  {word}
                </span>
              ))}
            </span>
          </span>
        )}
      </h1>

      <p
        style={{
          fontFamily: "var(--font-sans), sans-serif",
          fontSize: "clamp(15px, 3vw, 18px)",
          color: "var(--text-tertiary)",
          maxWidth: "560px",
          margin: "24px auto 0",
          lineHeight: 1.6,
        }}
      >
        CRM, email sequences, workflow automation, task management, and AI agents.
      </p>

      <div style={{ marginTop: "40px" }}>
        <Link
          href="/dashboard"
          style={{
            display: "inline-block",
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            color: "#000000",
            backgroundColor: "#ffffff",
            padding: "12px 24px",
            borderRadius: "6px",
            textDecoration: "none",
            transition: "background-color 200ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e5e5e5")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
          onFocus={(e) => (e.currentTarget.style.backgroundColor = "#e5e5e5")}
          onBlur={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
        >
          Open App
        </Link>
      </div>

      {keyframes && <style dangerouslySetInnerHTML={{ __html: keyframes }} />}
    </section>
  );
}
