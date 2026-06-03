"use client";

import useSWR from "swr";
import { useTenant } from "@/lib/tenant-hook";

// ── Config ──────────────────────────────────────────────────────────

const REFRESH_MS = 30_000; // 30-second polling

// ── Agent definitions ───────────────────────────────────────────────

export const AGENTS = [
  { id: "front_desk", name: "Front Desk", color: "#f97316" },
  { id: "sdr", name: "SDR", color: "#3b82f6" },
  { id: "research", name: "Research", color: "#22c55e" },
  { id: "email", name: "Email", color: "#a855f7" },
] as const;

export type AgentId = (typeof AGENTS)[number]["id"];

// The bridge's /api/agent-logs returns agent_id in dash form (fr-001),
// but AGENTS / agent-status / agent-performance use the underscore
// canonical id (front_desk). Map dash → canonical so per-agent log
// filtering matches. Identity for ids already in canonical form.
const AGENT_ID_ALIASES: Record<string, AgentId> = {
  "fr-001": "front_desk",
  "sdr-001": "sdr",
  "research-001": "research",
  "email-001": "email",
};

export function normalizeAgentId(agentId: string | null | undefined): string {
  if (!agentId) return "";
  const id = agentId.trim();
  return AGENT_ID_ALIASES[id] ?? AGENT_ID_ALIASES[id.toLowerCase()] ?? id;
}

// ── Types ───────────────────────────────────────────────────────────

export interface AgentLog {
  agent_id: string;
  action: string;
  company_name: string;
  result: string;
  status: string;
  input_data: Record<string, unknown> | null;
  output_data: Record<string, unknown> | null;
  created_at: string;
}

export interface AgentPerformance {
  agent_id: string;
  total_actions: number;
  qualified_count: number;
  warm_count: number;
  closed_count: number;
  conversion_rate: number;
}

export interface AgentStatusResponse {
  agent_id: string;
  pending_messages: number;
  total_actions: number;
  conversion_rate: number;
  status: string;
}

export interface CommandCenterStats {
  total_contacts: number;
  leads_this_week: number;
  emails_sent_this_week: number;
  calls_handled_this_week: number;
}

// ── Fetcher ─────────────────────────────────────────────────────────

// Same-origin proxy fetcher. The bridge sends no CORS header, so the
// browser can't call it directly — these hit /api/* proxy routes that
// resolve tenant from the SSR session. The client never sends tenant_id.
async function fetchApi<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(qs ? `${path}?${qs}` : path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Ops API ${res.status}`);
  return res.json();
}

// ── API functions (same-origin proxies; tenant resolved server-side) ─

export function getAgentLogs(
  agentId?: string,
  limit = 20,
): Promise<AgentLog[]> {
  const params: Record<string, string> = { limit: String(limit) };
  if (agentId) params.agent_id = agentId;
  return fetchApi<AgentLog[]>("/api/agent-logs", params);
}

export function getAgentPerformance(
  agentId: string,
  period = "today",
): Promise<AgentPerformance> {
  return fetchApi<AgentPerformance>("/api/agent-performance", {
    agent_id: agentId,
    period,
  });
}

export function getAgentStatus(agentId: string): Promise<AgentStatusResponse> {
  return fetchApi<AgentStatusResponse>("/api/agent-status", {
    agent_id: agentId,
  });
}

export function getCommandCenterStats(): Promise<CommandCenterStats> {
  return fetchApi<CommandCenterStats>("/api/command-center/stats");
}

// ── Aggregate fetchers (for SWR) ───────────────────────────────────

async function fetchAllPerformance(): Promise<
  Record<string, AgentPerformance | null>
> {
  const results = await Promise.all(
    AGENTS.map((a) => getAgentPerformance(a.id).catch(() => null)),
  );
  return Object.fromEntries(AGENTS.map((a, i) => [a.id, results[i]]));
}

async function fetchAllStatuses(): Promise<
  Record<string, AgentStatusResponse | null>
> {
  const results = await Promise.all(
    AGENTS.map((a) => getAgentStatus(a.id).catch(() => null)),
  );
  return Object.fromEntries(AGENTS.map((a, i) => [a.id, results[i]]));
}

// ── Hooks (client: call useTenant internally) ──────────────────────

export function useAllLogs(limit = 50) {
  const { tenant_id: tenantId } = useTenant();
  return useSWR(
    tenantId ? ["ops:all-logs", tenantId, limit] : null,
    () => getAgentLogs(undefined, limit),
    {
      refreshInterval: REFRESH_MS,
      fallbackData: [],
    },
  );
}

export function useAllPerformance() {
  const { tenant_id: tenantId } = useTenant();
  return useSWR(
    tenantId ? ["ops:all-performance", tenantId] : null,
    () => fetchAllPerformance(),
    {
      refreshInterval: REFRESH_MS,
      fallbackData: Object.fromEntries(AGENTS.map((a) => [a.id, null])),
    },
  );
}

export function useAllStatuses() {
  const { tenant_id: tenantId } = useTenant();
  return useSWR(
    tenantId ? ["ops:all-statuses", tenantId] : null,
    () => fetchAllStatuses(),
    {
      refreshInterval: REFRESH_MS,
      fallbackData: Object.fromEntries(AGENTS.map((a) => [a.id, null])),
    },
  );
}

export function useCommandCenterStats() {
  const { tenant_id: tenantId } = useTenant();
  return useSWR<CommandCenterStats | null>(
    tenantId ? ["ops:command-center-stats", tenantId] : null,
    () => getCommandCenterStats(),
    {
      refreshInterval: REFRESH_MS,
      fallbackData: null,
    },
  );
}
