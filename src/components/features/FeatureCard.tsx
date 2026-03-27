"use client";

import React from "react";
import ShimmerBorder from "@/components/shared/ShimmerBorder";

interface FeatureCardProps {
  label: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function FeatureCard({ label, title, description, children }: FeatureCardProps) {
  return (
    <ShimmerBorder>
      <div
        className="feature-card"
        style={{
          background: "#111",
          border: "1px solid #1a1a1a",
          borderRadius: 12,
          padding: 24,
          transition: "border-color 0.3s ease, transform 0.3s ease",
          cursor: "default",
        }}
      >
        {/* Mock UI */}
        <div style={{ marginBottom: 16 }}>{children}</div>

        {/* Label */}
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#666",
            marginBottom: 6,
          }}
        >
          {label}
        </div>

        {/* Title */}
        <h3
          style={{
            fontFamily: "var(--font-eb-garamond, 'EB Garamond', serif)",
            fontSize: 24,
            color: "#fff",
            marginBottom: 6,
            fontWeight: 400,
          }}
        >
          {title}
        </h3>

        {/* Description */}
        <p
          style={{
            fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
            fontSize: 14,
            color: "#888",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {description}
        </p>

        <style jsx>{`
          .feature-card:hover {
            border-color: #333 !important;
            transform: translateY(-2px);
          }
        `}</style>
      </div>
    </ShimmerBorder>
  );
}
