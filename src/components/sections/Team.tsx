"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

export default function Team() {
  const [bioOpen, setBioOpen] = useState(false);
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
    <section
      ref={sectionRef}
      id="team"
      style={{ padding: "80px 16px" }}
    >
      <div
        style={{
          maxWidth: 600,
          margin: "0 auto",
          textAlign: "center",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(30px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "3px",
            color: "var(--text-muted)",
            marginBottom: 32,
          }}
        >
          Team
        </p>

        {/* Headshot */}
        <div
          onClick={() => setBioOpen(!bioOpen)}
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            overflow: "hidden",
            margin: "0 auto 16px",
            cursor: "pointer",
            border: "2px solid rgba(255,255,255,0.1)",
            transition: "border-color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
        >
          <Image
            src="/jake-headshot.png"
            alt="Jake Levison"
            width={120}
            height={120}
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
          />
        </div>

        {/* Name and title */}
        <h3
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: 18,
            fontWeight: 600,
            color: "#fff",
            marginBottom: 4,
          }}
        >
          Jake Levison
        </h3>
        <p
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: 14,
            color: "var(--text-tertiary)",
            marginBottom: 8,
          }}
        >
          Founder
        </p>

        {/* Bio — only visible on click */}
        {bioOpen && (
          <div
            style={{
              marginTop: 16,
              padding: "20px 24px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              textAlign: "left",
              animation: "fade-in 0.3s ease",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 14,
                color: "var(--text-secondary)",
                lineHeight: 1.7,
              }}
            >
              Jake spent 5+ years as Director of Business Development and Investor Relations at PHT Investment Group, a vertically integrated cold storage and agricultural real estate platform. At PHT, he ran capital formation across 2,000+ investors, structured $250M+ in term sheets, and led 150+ institutional pitches with firms including Baupost, BentallGreenOak, EQT Infrastructure, and Blackstone. He saw firsthand how contractor front offices break down at scale -- missed calls, unqualified leads, no financial visibility -- and built Endall to fix it. Prior to PHT, Jake held roles at Morgan Stanley Wealth Management, M&T Bank, and Blockworks. He holds a B.A. in Philosophy, Politics, and Economics from the University of Pennsylvania, where he played Division I varsity baseball.
            </p>
          </div>
        )}

        <style>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </section>
  );
}
