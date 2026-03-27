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
        {/* Main line — staggered clip reveal per line */}
        <h2
          style={{
            fontFamily: "var(--font-serif, 'EB Garamond', serif)",
            fontSize: "clamp(32px, 6vw, 48px)",
            color: "#fff",
            fontWeight: 400,
            lineHeight: 1.15,
            marginBottom: 12,
          }}
        >
          {["Stop duct-taping", "tools together."].map((line, i) => (
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
            fontFamily: "var(--font-sans, 'DM Sans', sans-serif)",
            fontSize: 18,
            color: "#888",
            marginBottom: 32,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) 500ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 500ms",
          }}
        >
          One platform. Three minutes to operational.
        </p>

        {/* CTA Button */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) 700ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 700ms",
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
              fontFamily: "var(--font-sans, 'DM Sans', sans-serif)",
              transition: "background-color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e5e5e5")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
          >
            Open App
          </Link>
        </div>
      </div>
    </section>
  );
}
