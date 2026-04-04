"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface FeatureCardProps {
  label: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function FeatureCard({ label, title, description, children }: FeatureCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={prefersReducedMotion ? {} : { y: -4 }}
      transition={{ duration: 0.2 }}
      style={{ height: "100%" }}
    >
      <div
        className="feature-card"
        style={{
          background: "#111",
          border: "1px solid #1a1a1a",
          borderRadius: 12,
          padding: 24,
          transition: "border-color 0.3s ease",
          cursor: "default",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Mock UI */}
        <div style={{ marginBottom: 16 }}>{children}</div>

        {/* Label */}
        <div
          style={{
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
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
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: 24,
            color: "#fff",
            marginBottom: 6,
            fontWeight: 600,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h3>

        {/* Description */}
        <p
          style={{
            fontFamily: "var(--font-sans), sans-serif",
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
          }
        `}</style>
      </div>
    </motion.div>
  );
}
