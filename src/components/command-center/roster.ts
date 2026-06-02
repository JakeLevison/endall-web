// Command Center agent roster — the single source of truth for which
// agents render in the grid, how they're labeled for the customer, and
// which data tier backs each card.
//
// Tiers (from the audit of what the bridge actually emits):
//   health    — live status + perf + logs (Front Desk, SDR, Enrichment,
//               Outreach). Status-driven AgentCard.
//   metrics   — output metrics only, NO live health signal (Estimator).
//               Rendered honestly as "metrics only".
//   freshness — no status, but timestamped output rows (Competitive Intel,
//               Market Intel). Rendered as "last synced + count".
//
// Dispatch and Invoice are intentionally absent — they are not agents.

export type AgentTier = "health" | "metrics" | "freshness";

export interface AgentDescriptor {
  /** Canonical id (health agents) or slug (metrics/freshness). Also the
   *  ICON_MAP key and the agent-card-<id> testid. */
  id: string;
  /** Customer-facing label. Note research->Enrichment, email->Outreach. */
  label: string;
  tier: AgentTier;
  /** Agent identity color (icon), distinct from status color. */
  color: string;
}

export const COMMAND_CENTER_AGENTS: AgentDescriptor[] = [
  { id: "front_desk", label: "Front Desk", tier: "health", color: "#f97316" },
  { id: "sdr", label: "SDR", tier: "health", color: "#3b82f6" },
  { id: "research", label: "Enrichment", tier: "health", color: "#22c55e" },
  { id: "email", label: "Outreach", tier: "health", color: "#a855f7" },
  { id: "estimator", label: "Estimator", tier: "metrics", color: "#14b8a6" },
  {
    id: "competitive_intel",
    label: "Competitive Intel",
    tier: "freshness",
    color: "#ec4899",
  },
  {
    id: "market_intel",
    label: "Market Intel",
    tier: "freshness",
    color: "#06b6d4",
  },
];

export interface MetricBox {
  label: string;
  value: string;
}

/** Backs a metrics-only card (e.g. Estimator). */
export interface MetricCardData {
  kpis: MetricBox[];
}

/** Backs a freshness card (e.g. Competitive/Market Intel). */
export interface FreshnessCardData {
  /** ISO timestamp of the most recent output row, or null if none. */
  lastUpdated: string | null;
  count: number;
  /** e.g. "competitors tracked", "market rows". */
  countLabel: string;
}
