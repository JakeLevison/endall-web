"use client";

import { useEffect, useRef, useState } from "react";

import { posthog } from "@/lib/posthog";

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
    <section id="final-cta" ref={sectionRef} style={{ padding: "120px 16px", background: "radial-gradient(ellipse 600px 300px at 50% 50%, var(--overlay-weak), transparent)" }}>
      <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
        {/* Main line — staggered clip reveal per line */}
        <h2
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: "clamp(32px, 6vw, 48px)",
            color: "var(--text-primary)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            marginBottom: 12,
          }}
        >
          {["Your AI ops team.", "Ready when you are."].map((line, i) => (
            <span
              key={line}
              style={{
                display: "block",
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  display: "block",
                  transform: visible ? "translateY(0)" : "translateY(100%)",
                  transition: `transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${i * 200}ms`,
                }}
              >
                {line}
              </span>
            </span>
          ))}
        </h2>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: 18,
            color: "var(--text-tertiary)",
            marginBottom: 32,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) 500ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 500ms",
          }}
        >
          See how Endall works for your shop.
        </p>

        {/* CTAs */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) 700ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 700ms",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <a
            href="/demo"
            onClick={() =>
              posthog.capture("cta_clicked", {
                source: "final_cta",
                cta: "Try the interactive demo",
                href: "/demo",
              })
            }
            style={{
              display: "inline-block",
              background: "var(--brand-accent-light)",
              color: "#1a1a1a",
              padding: "14px 32px",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              textDecoration: "none",
              fontFamily: "var(--font-sans), sans-serif",
              transition: "background-color 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--brand-accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--brand-accent-light)";
            }}
          >
            Try the interactive demo
          </a>
          <a
            href="/contact"
            onClick={() =>
              posthog.capture("cta_clicked", {
                source: "final_cta",
                cta: "Talk to us",
                href: "/contact",
              })
            }
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 14,
              color: "var(--text-tertiary)",
              textDecoration: "none",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
          >
            Talk to us →
          </a>
        </div>
      </div>
    </section>
  );
}
