"use client";

import {
  Phone,
  Users,
  Search,
  Mail,
} from "lucide-react";
import type {
  AgentLog,
  AgentPerformance,
  AgentStatusResponse,
} from "@/lib/ops-api";
import { AGENTS, normalizeAgentId } from "@/lib/ops-api";
import type { ElementType } from "react";

// ── Agent icon map ──────────────────────────────────────────────────

const ICON_MAP: Record<string, ElementType> = {
  front_desk: Phone,
  sdr: Users,
  research: Search,
  email: Mail,
};

// ── Status derivation ───────────────────────────────────────────────

// All hex (no CSS vars) so callers can append an alpha suffix — e.g.
// `${color}15` — for badge/stripe backgrounds without producing invalid
// CSS like "var(--text-muted)15".
const STATUS_COLORS = {
  ACTIVE: "#22c55e", // green — healthy, recent activity
  PROCESSING: "#eab308", // yellow — healthy, work in flight
  STALE: "#f59e0b", // amber — healthy but nothing recent
  ERROR: "#ef4444", // red — bridge reported a non-healthy state
  IDLE: "#6b7280", // gray — healthy, never any activity
  OFFLINE: "#6b7280", // gray — no health signal at all
} as const;

export type AgentStatusLabel = keyof typeof STATUS_COLORS;

// Activity within this window counts as ACTIVE; older counts as STALE.
const ACTIVE_WINDOW_MS = 24 * 60 * 60 * 1000;

// Bridge status strings we treat as healthy. Anything else that is present
// is surfaced as ERROR rather than silently shown green.
const HEALTHY_STATES = new Set([
  "healthy",
  "ok",
  "active",
  "idle",
  "ready",
  "running",
]);

export function deriveStatus(
  status: AgentStatusResponse | null,
  logs: AgentLog[],
  now: number = Date.now(),
): { label: AgentStatusLabel; color: string } {
  // No health response at all — we cannot confirm the agent is up. Never
  // claim healthy on missing data.
  if (!status) return { label: "OFFLINE", color: STATUS_COLORS.OFFLINE };

  // The bridge reported a non-healthy state — surface it, don't mask it.
  const raw = (status.status ?? "").trim().toLowerCase();
  if (raw && !HEALTHY_STATES.has(raw))
    return { label: "ERROR", color: STATUS_COLORS.ERROR };

  // Healthy from here on.
  if (status.pending_messages > 0)
    return { label: "PROCESSING", color: STATUS_COLORS.PROCESSING };

  if (logs.length > 0) {
    const latest = logs.reduce((max, l) => {
      const t = new Date(l.created_at).getTime();
      return Number.isFinite(t) && t > max ? t : max;
    }, 0);
    const fresh = latest > 0 && now - latest <= ACTIVE_WINDOW_MS;
    return fresh
      ? { label: "ACTIVE", color: STATUS_COLORS.ACTIVE }
      : { label: "STALE", color: STATUS_COLORS.STALE };
  }

  return { label: "IDLE", color: STATUS_COLORS.IDLE };
}

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

// ── Outcome-language action description ─────────────────────────────

function describeAction(log: AgentLog): string {
  const parts: string[] = [];
  if (log.company_name) parts.push(log.company_name);
  if (log.result) {
    const r = log.result.toLowerCase();
    if (r === "qualified") parts.push("qualified for proposal");
    else if (r === "warm") parts.push("warm prospect, interested");
    else if (r === "hot") parts.push("hot lead, ready to close");
    else if (r === "callback") parts.push("callback scheduled");
    else if (r === "sent") parts.push("sent");
    else if (r === "enriched") parts.push("profile enriched");
    else if (r === "researched") parts.push("research complete");
    else parts.push(r.replace(/_/g, " "));
  } else if (log.action) {
    parts.push(log.action.replace(/_/g, " "));
  }
  return parts.join(" — ") || "action logged";
}

// ── Agent Card ──────────────────────────────────────────────────────

interface AgentCardProps {
  agentId: string;
  name: string;
  color: string;
  perf: AgentPerformance | null;
  status: AgentStatusResponse | null;
  logs: AgentLog[];
}

function AgentCard({ agentId, name, color, perf, status, logs }: AgentCardProps) {
  // Derive the icon from the card's own agent, not the log's raw id —
  // logs carry dash-form ids (fr-001) that aren't in ICON_MAP.
  const Icon = ICON_MAP[agentId] ?? Phone;
  const derived = deriveStatus(status, logs);

  const leads = (perf?.qualified_count ?? 0) + (perf?.warm_count ?? 0);
  const pipeline = perf?.closed_count ?? 0;
  const actions = perf?.total_actions ?? 0;

  return (
    <div
      data-testid={`agent-card-${agentId}`}
      style={{
        background: "var(--overlay-weak)",
        border: `1px solid ${color}22`,
        borderRadius: 12,
        padding: 0,
        overflow: "hidden",
        transition: "box-shadow 0.2s, transform 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 4px 20px ${color}15`;
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Top accent stripe — status color so health is glanceable across
          the grid; agent identity stays in the icon color + name. */}
      <div style={{ height: 3, background: derived.color }} />

      {/* Header */}
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
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
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
            color: derived.color,
            background: `${derived.color}15`,
            padding: "3px 8px",
            borderRadius: 6,
          }}
        >
          {derived.label}
        </span>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 0,
          padding: "14px 16px",
        }}
      >
        {[
          { label: "Leads", value: leads },
          { label: "Closed", value: pipeline },
          { label: "Actions", value: actions },
        ].map((s) => (
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

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: "var(--overlay-soft)",
          margin: "0 16px",
        }}
      />

      {/* Activity log */}
      <div
        style={{
          padding: "12px 16px 14px",
          maxHeight: 160,
          overflowY: "auto",
        }}
      >
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
    </div>
  );
}

// ── Grid ────────────────────────────────────────────────────────────

interface Props {
  logs: AgentLog[];
  performance: Record<string, AgentPerformance | null>;
  statuses: Record<string, AgentStatusResponse | null>;
}

export default function AgentCardsGrid({
  logs,
  performance,
  statuses,
}: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 12,
      }}
    >
      {AGENTS.map((agent) => {
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
            name={agent.name}
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
