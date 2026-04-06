"use client";

import { useEffect, useState } from "react";
import type { AgentPerformance } from "@/lib/ops-api";

// ── Ring component ──────────────────────────────────────────────────

function Ring({
  value,
  label,
  color,
  format,
}: {
  value: number;
  label: string;
  color: string;
  format?: (n: number) => string;
}) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(value), 100);
    return () => clearTimeout(t);
  }, [value]);

  const size = 120;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated / 100) * circumference;

  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size} style={{ display: "block", margin: "0 auto" }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--overlay-soft)"
          strokeWidth={stroke}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
          }}
        />
        {/* Center text */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontSize: 22,
            fontWeight: 600,
            fill: "var(--text-primary)",
          }}
        >
          {format ? format(animated) : `${Math.round(animated)}%`}
        </text>
      </svg>
      <p
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          marginTop: 10,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontWeight: 500,
        }}
      >
        {label}
      </p>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────

interface Props {
  performance: Record<string, AgentPerformance | null>;
}

export default function PerformanceRings({ performance }: Props) {
  const allPerf = Object.values(performance).filter(Boolean) as AgentPerformance[];

  // Pipeline Health: warm+closed / total
  const totalActions = allPerf.reduce((s, p) => s + p.total_actions, 0);
  const warmAndClosed = allPerf.reduce(
    (s, p) => s + p.warm_count + p.closed_count,
    0,
  );
  const pipelineHealth = totalActions > 0 ? (warmAndClosed / totalActions) * 100 : 0;

  // Avg conversion rate
  const avgConversion =
    allPerf.length > 0
      ? allPerf.reduce((s, p) => s + p.conversion_rate, 0) / allPerf.length
      : 0;

  // Email engagement (use email agent conversion as proxy)
  const emailPerf = performance["email"];
  const emailEngagement = emailPerf?.conversion_rate ?? 0;

  return (
    <div
      style={{
        background: "var(--overlay-weak)",
        border: "1px solid var(--overlay-soft)",
        borderRadius: 12,
        padding: "28px 24px",
      }}
    >
      <h3
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: 24,
        }}
      >
        Performance
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 24,
        }}
      >
        <Ring
          value={pipelineHealth}
          label="Pipeline Health"
          color="#22c55e"
        />
        <Ring
          value={avgConversion * 100}
          label="Conversion Rate"
          color="#8b5cf6"
        />
        <Ring
          value={emailEngagement * 100}
          label="Email Engagement"
          color="#06b6d4"
        />
      </div>
    </div>
  );
}
