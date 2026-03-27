"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function FinalCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} style={{ padding: "120px 16px", background: "radial-gradient(ellipse 600px 300px at 50% 50%, rgba(255,255,255,0.03), transparent)" }}>
      <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
        {/* Main line */}
        <h2
          style={{
            fontFamily: "var(--font-serif, 'EB Garamond', serif)",
            fontSize: 48,
            color: "#fff",
            fontWeight: 400,
            lineHeight: 1.15,
            marginBottom: 12,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0ms",
          }}
        >
          Stop duct-taping tools together.
        </h2>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "var(--font-sans, 'DM Sans', sans-serif)",
            fontSize: 18,
            color: "#888",
            marginBottom: 32,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) 200ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 200ms",
          }}
        >
          One platform. Three minutes to operational.
        </p>

        {/* CTA Button */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) 400ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 400ms",
          }}
        >
          <Link
            href="/dashboard"
            className="cta-pulse"
            style={{
              display: "inline-block",
              background: "#fff",
              color: "#000",
              padding: "14px 32px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
              fontFamily: "var(--font-sans, 'DM Sans', sans-serif)",
            }}
          >
            Open App
          </Link>
        </div>
      </div>

      <style jsx>{`
        .cta-pulse {
          animation: cta-pulse-anim 3s ease-in-out infinite;
          transition: transform 0.2s ease, background-color 0.2s ease;
        }
        .cta-pulse:hover {
          animation-play-state: paused;
          transform: scale(1.05);
          background-color: #e5e5e5;
        }
        .cta-pulse:focus-visible {
          animation-play-state: paused;
          transform: scale(1.05);
          outline: 2px solid rgba(255, 255, 255, 0.5);
          outline-offset: 2px;
        }
        @keyframes cta-pulse-anim {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); box-shadow: 0 0 20px rgba(255,255,255,0.1); }
        }
      `}</style>
    </section>
  );
}
