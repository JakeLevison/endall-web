"use client";

import type { AgentLog } from "@/lib/ops-api";

// Target corridors first, then any extras
const PRIORITY_STATES = [
  "Virginia",
  "Texas",
  "Indiana",
  "Wisconsin",
  "Ohio",
  "Arizona",
];

const BAR_COLORS = [
  "#f97316", // orange
  "#ef4444", // red
  "#eab308", // yellow
  "#22c55e", // green
  "#3b82f6", // blue
  "#a855f7", // purple
  "#06b6d4", // cyan
  "#ec4899", // pink
];

interface Props {
  logs: AgentLog[];
}

export default function LeadDistribution({ logs }: Props) {
  // Aggregate warm/hot leads by state from output_data
  const stateCounts: Record<string, number> = {};
  for (const log of logs) {
    if (log.result === "warm" || log.result === "hot") {
      const state =
        (log.output_data as Record<string, unknown>)?.state as string;
      if (state) {
        stateCounts[state] = (stateCounts[state] || 0) + 1;
      }
    }
  }

  // Sort: priority states first (in order), then others by count
  const entries = Object.entries(stateCounts);
  const sorted = [
    ...PRIORITY_STATES.filter((s) => stateCounts[s]).map((s) => [s, stateCounts[s]] as [string, number]),
    ...entries
      .filter(([s]) => !PRIORITY_STATES.includes(s))
      .sort((a, b) => b[1] - a[1]),
  ];

  const max = Math.max(...sorted.map(([, c]) => c), 1);

  return (
    <div
      style={{
        background: "var(--overlay-weak)",
        border: "1px solid var(--overlay-soft)",
        borderRadius: 12,
        padding: "20px 24px",
      }}
    >
      <h3
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: 20,
        }}
      >
        Warm Leads by State
      </h3>

      {sorted.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Pipeline distribution will appear as leads come in.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sorted.map(([state, count], i) => (
            <div
              key={state}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  width: 80,
                  flexShrink: 0,
                }}
              >
                {state}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 20,
                  background: "var(--overlay-soft)",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${(count / max) * 100}%`,
                    height: "100%",
                    background: BAR_COLORS[i % BAR_COLORS.length],
                    borderRadius: 4,
                    transition: "width 0.5s ease",
                    minWidth: 4,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  width: 32,
                  textAlign: "right",
                  flexShrink: 0,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
