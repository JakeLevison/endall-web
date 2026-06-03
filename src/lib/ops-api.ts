"use client";

import useSWR from "swr";
import { useTenant } from "@/lib/tenant-hook";

// ── Config ──────────────────────────────────────────────────────────

const API_BASE =
  process.env.NEXT_PUBLIC_OPS_API_URL ||
  "https://ask-endall-bridge-production.up.railway.app";

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

// ── API functions (server utilities: explicit tenant_id) ───────────

export function getAgentLogs(
  tenantId: string,
  agentId?: string,
  limit = 20,
): Promise<AgentLog[]> {
  const params: Record<string, string> = {
    tenant_id: tenantId,
    limit: String(limit),
  };
  if (agentId) params.agent_id = agentId;
  return fetchApi<AgentLog[]>("/api/agent-logs", params);
}

export function getAgentPerformance(
  tenantId: string,
  agentId: string,
  period = "today",
): Promise<AgentPerformance> {
  return fetchApi<AgentPerformance>("/api/agent-performance", {
    agent_id: agentId,
    tenant_id: tenantId,
    period,
  });
}

export function getAgentStatus(
  tenantId: string,
  agentId: string,
): Promise<AgentStatusResponse> {
  return fetchApi<AgentStatusResponse>("/api/agent-status", {
    agent_id: agentId,
    tenant_id: tenantId,
  });
}

export function getCommandCenterStats(
  tenantId: string,
): Promise<CommandCenterStats> {
  return fetchApi<CommandCenterStats>("/command-center/stats", {
    tenant_id: tenantId,
  });
}

// ── Aggregate fetchers (for SWR) ───────────────────────────────────

async function fetchAllPerformance(
  tenantId: string,
): Promise<Record<string, AgentPerformance | null>> {
  const results = await Promise.all(
    AGENTS.map((a) => getAgentPerformance(tenantId, a.id).catch(() => null)),
  );
  return Object.fromEntries(AGENTS.map((a, i) => [a.id, results[i]]));
}

async function fetchAllStatuses(
  tenantId: string,
): Promise<Record<string, AgentStatusResponse | null>> {
  const results = await Promise.all(
    AGENTS.map((a) => getAgentStatus(tenantId, a.id).catch(() => null)),
  );
  return Object.fromEntries(AGENTS.map((a, i) => [a.id, results[i]]));
}

// ── Hooks (client: call useTenant internally) ──────────────────────

export function useAllLogs(limit = 50) {
  const { tenant_id: tenantId } = useTenant();
  return useSWR(
    tenantId ? ["ops:all-logs", tenantId, limit] : null,
    () => getAgentLogs(tenantId as string, undefined, limit),
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
    () => fetchAllPerformance(tenantId as string),
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
    () => fetchAllStatuses(tenantId as string),
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
    () => getCommandCenterStats(tenantId as string),
    {
      refreshInterval: REFRESH_MS,
      fallbackData: null,
    },
  );
}
