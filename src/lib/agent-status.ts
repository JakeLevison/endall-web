import type { AgentLog, AgentStatusResponse } from "@/lib/ops-api";

// Agent health status derivation — pure, shared by the agent grid, the
// system-health strip, and the needs-attention queue.

// All hex (no CSS vars) so callers can append an alpha suffix — e.g.
// `${color}15` — for badge/stripe backgrounds without producing invalid
// CSS like "var(--text-muted)15".
export const STATUS_COLORS = {
  ACTIVE: "#22c55e", // green — healthy, recent activity
  PROCESSING: "#eab308", // yellow — healthy, work in flight
  STALE: "#f59e0b", // amber — healthy but nothing recent
  ERROR: "#ef4444", // red — bridge reported a non-healthy state
  IDLE: "#6b7280", // gray — healthy, never any activity
  OFFLINE: "#6b7280", // gray — no health signal at all
} as const;

export type AgentStatusLabel = keyof typeof STATUS_COLORS;

// Statuses that mean the agent needs a human to look — surfaced in the
// needs-attention queue and the health strip.
export const ATTENTION_STATUSES: ReadonlySet<AgentStatusLabel> = new Set([
  "PROCESSING",
  "STALE",
  "ERROR",
  "OFFLINE",
]);

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
