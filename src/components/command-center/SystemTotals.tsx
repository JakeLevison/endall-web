"use client";

import type { AgentLog, AgentPerformance } from "@/lib/ops-api";

// ── Sparkline (tiny SVG) ────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) {
    return (
      <svg width={64} height={24} style={{ opacity: 0.3 }}>
        <line
          x1={0} y1={12} x2={64} y2={12}
          stroke={color} strokeWidth={1.5} strokeDasharray="4 3"
        />
      </svg>
    );
  }
  const max = Math.max(...data, 1);
  const step = 64 / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${22 - (v / max) * 18}`)
    .join(" ");
  return (
    <svg width={64} height={24}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Main ────────────────────────────────────────────────────────────

interface Props {
  logs: AgentLog[];
  performance: Record<string, AgentPerformance | null>;
}

export default function SystemTotals({ logs, performance }: Props) {
  const perf = (id: string) => performance[id];

  const callsQualified = perf("front_desk")?.qualified_count ?? 0;
  const proposalsSent =
    (perf("research")?.total_actions ?? 0) +
    (perf("email")?.total_actions ?? 0);
  const leadsResearched = perf("research")?.total_actions ?? 0;
  const emailsSent = perf("email")?.total_actions ?? 0;

  // Pipeline value: sum estimated_value from warm/hot leads in output_data
  const pipelineValue = logs.reduce((sum, l) => {
    if (l.result === "warm" || l.result === "hot") {
      const val =
        (l.output_data as Record<string, unknown>)?.estimated_value;
      if (typeof val === "number") return sum + val;
    }
    return sum;
  }, 0);

  const metrics = [
    {
      label: "Calls Qualified",
      value: callsQualified,
      format: (n: number) => n.toLocaleString(),
      color: "#f97316",
      sparkData: [] as number[],
    },
    {
      label: "Proposals Sent",
      value: proposalsSent,
      format: (n: number) => n.toLocaleString(),
      color: "#a855f7",
      sparkData: [] as number[],
    },
    {
      label: "Leads Researched",
      value: leadsResearched,
      format: (n: number) => n.toLocaleString(),
      color: "#22c55e",
      sparkData: [] as number[],
    },
    {
      label: "Emails Sent",
      value: emailsSent,
      format: (n: number) => n.toLocaleString(),
      color: "#3b82f6",
      sparkData: [] as number[],
    },
    {
      label: "Pipeline Value",
      value: pipelineValue,
      format: (n: number) =>
        n >= 1_000_000
          ? "$" + (n / 1_000_000).toFixed(1) + "M"
          : n >= 1_000
            ? "$" + (n / 1_000).toFixed(0) + "k"
            : "$" + n.toLocaleString(),
      color: "#eab308",
      sparkData: [] as number[],
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 12,
      }}
    >
      {metrics.map((m) => (
        <div
          key={m.label}
          style={{
            background: "var(--overlay-weak)",
            border: "1px solid var(--overlay-soft)",
            borderRadius: 10,
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              {m.label}
            </span>
            <Sparkline data={m.sparkData} color={m.color} />
          </div>
          <span
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            {m.format(m.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
