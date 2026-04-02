"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function Pricing() {
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
    <section ref={sectionRef} id="pricing" style={{ padding: "80px 16px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
        <p
          style={{
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "#666",
            marginBottom: 24,
          }}
        >
          Get started
        </p>

        <h2
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: "clamp(28px, 5vw, 40px)",
            color: "#fff",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
            marginBottom: 16,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          See what Endall looks like for your shop
        </h2>

        <p
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: 16,
            color: "#888",
            lineHeight: 1.6,
            marginBottom: 32,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) 200ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 200ms",
          }}
        >
          We'll walk through your inbound volume, your calendar, and your service area.
          If it's a fit, we deploy in 48 hours.
        </p>

        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) 400ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 400ms",
          }}
        >
          <Link
            href="/dashboard"
            style={{
              display: "inline-block",
              background: "#fff",
              color: "#000",
              padding: "14px 32px",
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
            Talk to Our Team
          </Link>
        </div>
      </div>
    </section>
  );
}
