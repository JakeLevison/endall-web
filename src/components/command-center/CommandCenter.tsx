"use client";

import { useAllLogs, useAllPerformance, useAllStatuses } from "@/lib/ops-api";
import SystemTotals from "./SystemTotals";
import AgentCardsGrid from "./AgentCardsGrid";
import PerformanceRings from "./PerformanceRings";
import LeadDistribution from "./LeadDistribution";
import WarmLeadsTable from "./WarmLeadsTable";
import SystemTerminal from "./SystemTerminal";

// ── Skeleton ────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: 80,
            background: "var(--overlay-weak)",
            borderRadius: 10,
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────

export default function CommandCenter() {
  const { data: logs = [], isLoading: logsLoading, error: logsError } = useAllLogs();
  const { data: performance = {}, isLoading: perfLoading } = useAllPerformance();
  const { data: statuses = {}, isLoading: statusLoading } = useAllStatuses();

  const isLoading = logsLoading || perfLoading || statusLoading;

  if (isLoading) return <Skeleton />;

  if (logsError) {
    return (
      <div
        style={{
          background: "var(--overlay-weak)",
          border: "1px solid var(--overlay-soft)",
          borderRadius: 10,
          padding: "24px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
          Unable to reach ops team — retrying...
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Section 1: System Totals */}
      <SystemTotals logs={logs} performance={performance} />

      {/* Section 2: Agent Cards */}
      <AgentCardsGrid
        logs={logs}
        performance={performance}
        statuses={statuses}
      />

      {/* Section 3: Performance Rings */}
      <PerformanceRings performance={performance} />

      {/* Section 4: Warm Lead Distribution */}
      <LeadDistribution logs={logs} />

      {/* Section 5: Warm Leads Table */}
      <WarmLeadsTable logs={logs} />

      {/* Section 7: Admin Terminal (hidden by default) */}
      <SystemTerminal logs={logs} isAdmin />
    </div>
  );
}
