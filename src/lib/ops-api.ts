"use client";

import useSWR from "swr";

// ── Config ──────────────────────────────────────────────────────────

const API_BASE =
  process.env.NEXT_PUBLIC_OPS_API_URL ||
  "https://ask-endall-bridge-production.up.railway.app";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "default";

const REFRESH_MS = 30_000; // 30-second polling

// ── Agent definitions ───────────────────────────────────────────────

export const AGENTS = [
  { id: "front_desk", name: "Front Desk", color: "#f97316" },
  { id: "sdr", name: "SDR", color: "#3b82f6" },
  { id: "research", name: "Research", color: "#22c55e" },
  { id: "email", name: "Email", color: "#a855f7" },
] as const;

export type AgentId = (typeof AGENTS)[number]["id"];

// ── Types ───────────────────────────────────────────────────────────

export interface AgentLog {
  agent_id: string;
  action: string;
  company_name: string;
  result: string;
  status: string;
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

// ── Fetcher ─────────────────────────────────────────────────────────

async function fetchApi<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  const url = new URL(path, API_BASE);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Ops API ${res.status}`);
  return res.json();
}

// ── API functions ───────────────────────────────────────────────────

export function getAgentLogs(
  agentId?: string,
  limit = 20,
): Promise<AgentLog[]> {
  const params: Record<string, string> = {
    tenant_id: TENANT_ID,
    limit: String(limit),
  };
  if (agentId) params.agent_id = agentId;
  return fetchApi<AgentLog[]>("/api/agent-logs", params);
}

export function getAgentPerformance(
  agentId: string,
  period = "today",
): Promise<AgentPerformance> {
  return fetchApi<AgentPerformance>("/api/agent-performance", {
    agent_id: agentId,
    tenant_id: TENANT_ID,
    period,
  });
}

export function getAgentStatus(
  agentId: string,
): Promise<AgentStatusResponse> {
  return fetchApi<AgentStatusResponse>("/api/agent-status", {
    agent_id: agentId,
    tenant_id: TENANT_ID,
  });
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

// ── Hooks ───────────────────────────────────────────────────────────

export function useAllLogs(limit = 50) {
  return useSWR("ops:all-logs", () => getAgentLogs(undefined, limit), {
    refreshInterval: REFRESH_MS,
    fallbackData: [],
  });
}

export function useAllPerformance() {
  return useSWR("ops:all-performance", fetchAllPerformance, {
    refreshInterval: REFRESH_MS,
    fallbackData: Object.fromEntries(AGENTS.map((a) => [a.id, null])),
  });
}

export function useAllStatuses() {
  return useSWR("ops:all-statuses", fetchAllStatuses, {
    refreshInterval: REFRESH_MS,
    fallbackData: Object.fromEntries(AGENTS.map((a) => [a.id, null])),
  });
}
