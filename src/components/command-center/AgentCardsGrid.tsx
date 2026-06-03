"use client";

import {
  Phone,
  Users,
  Search,
  Mail,
  FileText,
  Swords,
  Globe,
} from "lucide-react";
import type {
  AgentLog,
  AgentPerformance,
  AgentStatusResponse,
} from "@/lib/ops-api";
import { normalizeAgentId } from "@/lib/ops-api";
import { deriveStatus } from "@/lib/agent-status";
import type { ElementType, ReactNode } from "react";
import {
  COMMAND_CENTER_AGENTS,
  type AgentDescriptor,
  type MetricCardData,
  type FreshnessCardData,
} from "./roster";

// ── Agent icon map (keyed by descriptor id) ─────────────────────────

const ICON_MAP: Record<string, ElementType> = {
  front_desk: Phone,
  sdr: Users,
  research: Search,
  email: Mail,
  estimator: FileText,
  competitive_intel: Swords,
  market_intel: Globe,
};

// ── Format time ─────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

function relTime(iso: string, now: number = Date.now()): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const mins = Math.floor((now - t) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ── Outcome-language action description ─────────────────────────────

function describeResult(result: string): string {
  const r = result.toLowerCase();
  if (r === "qualified") return "qualified for proposal";
  if (r === "warm") return "warm prospect, interested";
  if (r === "hot") return "hot lead, ready to close";
  if (r === "callback") return "callback scheduled";
  if (r === "sent") return "sent";
  if (r === "enriched") return "profile enriched";
  if (r === "researched") return "research complete";
  return r.replace(/_/g, " ");
}

function describeAction(log: AgentLog): string {
  const parts: string[] = [];
  if (log.company_name) parts.push(log.company_name);
  if (log.result) parts.push(describeResult(log.result));
  else if (log.action) parts.push(log.action.replace(/_/g, " "));
  return parts.join(" — ") || "action logged";
}

// ── Shared card primitives ──────────────────────────────────────────

// Non-interactive for now — the per-agent detail route is still a stub, so
// cards do not link (no pointer cursor / hover-lift). Re-add a link wrapper
// when the detail view is real.
function CardShell({
  testId,
  stripeColor,
  children,
}: {
  testId: string;
  stripeColor: string;
  children: ReactNode;
}) {
  return (
    <div
      data-testid={testId}
      style={{
        background: "var(--overlay-weak)",
        border: "1px solid var(--overlay-soft)",
        borderRadius: 12,
        padding: 0,
        overflow: "hidden",
      }}
    >
      {/* Top stripe — status color (health cards) or agent identity color
          (metrics/freshness cards), so the grid is glanceable. */}
      <div style={{ height: 3, background: stripeColor }} />
      {children}
    </div>
  );
}

function CardHeader({
  Icon,
  color,
  name,
  badgeLabel,
  badgeColor,
}: {
  Icon: ElementType;
  color: string;
  name: string;
  badgeLabel: string;
  badgeColor: string;
}) {
  return (
    <div
      style={{
        padding: "14px 16px 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `${color}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={16} style={{ color }} />
        </div>
        <span
          style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}
        >
          {name}
        </span>
      </div>
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: badgeColor,
          background: `${badgeColor}15`,
          padding: "3px 8px",
          borderRadius: 6,
        }}
      >
        {badgeLabel}
      </span>
    </div>
  );
}

function StatGrid({
  stats,
}: {
  stats: { label: string; value: string | number }[];
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
        gap: 0,
        padding: "14px 16px",
      }}
    >
      {stats.map((s) => (
        <div key={s.label} style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "var(--text-primary)",
              lineHeight: 1,
            }}
          >
            {s.value}
          </div>
          <div
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--text-muted)",
              marginTop: 4,
            }}
          >
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function Divider() {
  return (
    <div
      style={{ height: 1, background: "var(--overlay-soft)", margin: "0 16px" }}
    />
  );
}

// ── Health card (live status-driven) ────────────────────────────────

interface AgentCardProps {
  agentId: string;
  name: string;
  color: string;
  perf: AgentPerformance | null;
  status: AgentStatusResponse | null;
  logs: AgentLog[];
}

function AgentCard({
  agentId,
  name,
  color,
  perf,
  status,
  logs,
}: AgentCardProps) {
  // Derive the icon from the card's own agent, not the log's raw id —
  // logs carry dash-form ids (fr-001) that aren't in ICON_MAP.
  const Icon = ICON_MAP[agentId] ?? Phone;
  const derived = deriveStatus(status, logs);

  const leads = (perf?.qualified_count ?? 0) + (perf?.warm_count ?? 0);
  const pipeline = perf?.closed_count ?? 0;
  const actions = perf?.total_actions ?? 0;

  // Logs arrive newest-first (sorted in the grid), so logs[0] is the most
  // recent activity.
  const latest = logs[0];

  return (
    <CardShell testId={`agent-card-${agentId}`} stripeColor={derived.color}>
      <CardHeader
        Icon={Icon}
        color={color}
        name={name}
        badgeLabel={derived.label}
        badgeColor={derived.color}
      />

      <StatGrid
        stats={[
          { label: "Leads", value: leads },
          { label: "Closed", value: pipeline },
          { label: "Actions", value: actions },
        ]}
      />

      {latest && (
        <div
          style={{
            padding: "0 16px 10px",
            fontSize: 11,
            color: "var(--text-muted)",
          }}
        >
          Last activity · {relTime(latest.created_at)}
          {latest.result ? ` · ${describeResult(latest.result)}` : ""}
        </div>
      )}

      <Divider />

      <div style={{ padding: "12px 16px 14px", maxHeight: 160, overflowY: "auto" }}>
        {logs.length === 0 ? (
          <p
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              fontStyle: "italic",
            }}
          >
            Standing by. Activity will appear here.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {logs.slice(0, 4).map((log, i) => (
              <div
                key={`${log.created_at}-${i}`}
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "baseline",
                  fontSize: 12,
                }}
              >
                <span
                  style={{
                    color: "var(--text-muted)",
                    flexShrink: 0,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {fmtTime(log.created_at)}
                </span>
                <span style={{ color: "var(--text-secondary)" }}>
                  {describeAction(log)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </CardShell>
  );
}

// ── Metrics-only card (output metrics, NO live health signal) ────────

function MetricsCard({
  descriptor,
  data,
}: {
  descriptor: AgentDescriptor;
  data: MetricCardData | null;
}) {
  const Icon = ICON_MAP[descriptor.id] ?? FileText;
  const hasData = !!data && data.kpis.length > 0;
  return (
    <CardShell
      testId={`agent-card-${descriptor.id}`}
      stripeColor={descriptor.color}
    >
      {/* Neutral "METRICS" badge — never a green health badge, because this
          agent exposes no live status signal. */}
      <CardHeader
        Icon={Icon}
        color={descriptor.color}
        name={descriptor.label}
        badgeLabel="METRICS"
        badgeColor="#6b7280"
      />
      {hasData ? (
        <StatGrid stats={data!.kpis} />
      ) : (
        <div style={{ padding: "14px 16px" }}>
          <p
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              fontStyle: "italic",
            }}
          >
            No data yet.
          </p>
        </div>
      )}
      <Divider />
      <div style={{ padding: "10px 16px 14px" }}>
        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Output metrics only — no live health signal.
        </p>
      </div>
    </CardShell>
  );
}

// ── Freshness card (no status; timestamped output rows) ──────────────

function FreshnessCard({
  descriptor,
  data,
}: {
  descriptor: AgentDescriptor;
  data: FreshnessCardData | null;
}) {
  const Icon = ICON_MAP[descriptor.id] ?? Globe;
  const synced = !!data && !!data.lastUpdated;
  return (
    <CardShell
      testId={`agent-card-${descriptor.id}`}
      stripeColor={descriptor.color}
    >
      <CardHeader
        Icon={Icon}
        color={descriptor.color}
        name={descriptor.label}
        badgeLabel={synced ? "SYNCED" : "NO DATA"}
        badgeColor={synced ? "#22c55e" : "#6b7280"}
      />
      <div style={{ padding: "14px 16px 16px" }}>
        {synced ? (
          <>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Last synced {relTime(data!.lastUpdated!)}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginTop: 6,
              }}
            >
              {data!.count} {data!.countLabel}
            </div>
          </>
        ) : (
          <p
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              fontStyle: "italic",
            }}
          >
            No synced rows yet.
          </p>
        )}
      </div>
    </CardShell>
  );
}

// ── Grid ────────────────────────────────────────────────────────────

interface Props {
  logs: AgentLog[];
  performance: Record<string, AgentPerformance | null>;
  statuses: Record<string, AgentStatusResponse | null>;
  metrics?: Record<string, MetricCardData | null>;
  freshness?: Record<string, FreshnessCardData | null>;
}

export default function AgentCardsGrid({
  logs,
  performance,
  statuses,
  metrics = {},
  freshness = {},
}: Props) {
  return (
    // Responsive columns capped at 4 so the 7 cards spread 4-3 on wide
    // screens instead of auto-fitting to a lonely 3-3-1.
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {COMMAND_CENTER_AGENTS.map((agent) => {
        if (agent.tier === "metrics") {
          return (
            <MetricsCard
              key={agent.id}
              descriptor={agent}
              data={metrics[agent.id] ?? null}
            />
          );
        }
        if (agent.tier === "freshness") {
          return (
            <FreshnessCard
              key={agent.id}
              descriptor={agent}
              data={freshness[agent.id] ?? null}
            />
          );
        }
        const agentLogs = logs
          .filter((l) => normalizeAgentId(l.agent_id) === agent.id)
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          );
        return (
          <AgentCard
            key={agent.id}
            agentId={agent.id}
            name={agent.label}
            color={agent.color}
            perf={performance[agent.id] ?? null}
            status={statuses[agent.id] ?? null}
            logs={agentLogs}
          />
        );
      })}
    </div>
  );
}
