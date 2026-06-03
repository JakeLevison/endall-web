"use client";

import useSWR from "swr";
import { useMemo } from "react";
import type { AgentLog, AgentStatusResponse } from "@/lib/ops-api";
import { normalizeAgentId } from "@/lib/ops-api";
import {
  deriveStatus,
  ATTENTION_STATUSES,
  type AgentStatusLabel,
} from "@/lib/agent-status";
import {
  COMMAND_CENTER_AGENTS,
  type MetricBox,
  type MetricCardData,
  type FreshnessCardData,
} from "@/components/command-center/roster";

// ── Formatters ──────────────────────────────────────────────────────

const DASH = "—";

export function pct(x: number | null | undefined): string {
  if (x == null || !Number.isFinite(x)) return DASH;
  return `${Math.round(x * 100)}%`;
}

export function compactCurrency(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return DASH;
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}

export function compactNumber(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return DASH;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

// Bridge envelopes are sometimes a bare number, sometimes an object like
// { total_hours } / { total_cost } / { total } / { value }.
function pickNumber(
  v: unknown,
  keys: string[],
): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (v && typeof v === "object") {
    for (const k of keys) {
      const candidate = (v as Record<string, unknown>)[k];
      if (typeof candidate === "number" && Number.isFinite(candidate))
        return candidate;
    }
  }
  return null;
}

// ── Estimator metrics (/api/metrics/summary → estimates envelope) ────

interface SummaryEstimates {
  total_estimates?: number | null;
  approval_rate?: number | null;
  pending_value?: number | null;
}
interface SummaryResponse {
  estimates?: SummaryEstimates | null;
}

export function mapEstimatorMetrics(
  summary: SummaryResponse | null | undefined,
): MetricCardData | null {
  const e = summary?.estimates;
  if (!e) return null;
  return {
    kpis: [
      {
        label: "Estimates",
        value: e.total_estimates != null ? String(e.total_estimates) : DASH,
      },
      { label: "Approval", value: pct(e.approval_rate) },
      { label: "Pipeline", value: compactCurrency(e.pending_value) },
    ],
  };
}

// ── ROI strip (/api/metrics/roi) ────────────────────────────────────

interface RoiResponse {
  labor_hours_saved?: unknown;
  fte_cost_saved?: unknown;
  revenue_influenced?: number | null;
  pipeline_pending?: number | null;
}

export function mapRoiStrip(
  roi: RoiResponse | null | undefined,
): MetricBox[] | null {
  if (!roi) return null;
  const hours = pickNumber(roi.labor_hours_saved, [
    "total_hours",
    "total",
    "value",
  ]);
  const cost = pickNumber(roi.fte_cost_saved, ["total_cost", "total", "value"]);
  const revenue =
    typeof roi.revenue_influenced === "number" ? roi.revenue_influenced : null;
  const pipeline =
    typeof roi.pipeline_pending === "number" ? roi.pipeline_pending : null;
  return [
    { label: "Hours saved", value: compactNumber(hours) },
    { label: "Cost saved", value: compactCurrency(cost) },
    { label: "Revenue influenced", value: compactCurrency(revenue) },
    { label: "Pipeline pending", value: compactCurrency(pipeline) },
  ];
}

// ── Intel freshness (competitive / market) ──────────────────────────

interface IntelRow {
  researched_at?: string | null;
  data?: { last_updated?: string | null } | null;
}

function rowTime(r: IntelRow): number {
  const iso = r.researched_at ?? r.data?.last_updated ?? null;
  const t = iso ? new Date(iso).getTime() : NaN;
  return Number.isFinite(t) ? t : NaN;
}

function freshnessFrom(
  rows: IntelRow[] | undefined,
  countLabel: string,
): FreshnessCardData {
  if (!rows || rows.length === 0)
    return { lastUpdated: null, count: 0, countLabel };
  const times = rows.map(rowTime).filter((t) => Number.isFinite(t));
  const latest = times.length
    ? new Date(Math.max(...times)).toISOString()
    : null;
  return { lastUpdated: latest, count: rows.length, countLabel };
}

export function mapIntelFreshness(
  competitive: { competitors?: IntelRow[] } | null | undefined,
  market: { rows?: IntelRow[] } | null | undefined,
): Record<string, FreshnessCardData> {
  return {
    competitive_intel: freshnessFrom(
      competitive?.competitors,
      "competitors tracked",
    ),
    market_intel: freshnessFrom(market?.rows, "market rows"),
  };
}

// ── Needs-attention queue ───────────────────────────────────────────

export interface AttentionItem {
  agentId: string;
  label: string; // customer-facing agent name
  detail: string;
  status: AgentStatusLabel;
  color: string;
}

function detailFor(
  status: AgentStatusLabel,
  s: AgentStatusResponse | null,
): string {
  switch (status) {
    case "PROCESSING": {
      const n = s?.pending_messages ?? 0;
      return `${n} message${n === 1 ? "" : "s"} pending`;
    }
    case "STALE":
      return "No recent activity";
    case "ERROR":
      return "Reported an error";
    case "OFFLINE":
      return "No live health signal";
    default:
      return "";
  }
}

export function deriveNeedsAttention(
  statuses: Record<string, AgentStatusResponse | null>,
  logs: AgentLog[],
  now: number = Date.now(),
): AttentionItem[] {
  const items: AttentionItem[] = [];
  for (const agent of COMMAND_CENTER_AGENTS) {
    if (agent.tier !== "health") continue;
    const agentLogs = logs.filter(
      (l) => normalizeAgentId(l.agent_id) === agent.id,
    );
    const status = statuses[agent.id] ?? null;
    const { label, color } = deriveStatus(status, agentLogs, now);
    if (!ATTENTION_STATUSES.has(label)) continue;
    items.push({
      agentId: agent.id,
      label: agent.label,
      detail: detailFor(label, status),
      status: label,
      color,
    });
  }
  return items;
}

// ── Hooks (same-origin proxies; tenant resolved server-side) ────────

const REFRESH_MS = 30_000;

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`);
  return res.json();
}

export function useEstimatorMetrics(): MetricCardData | null {
  const { data } = useSWR<SummaryResponse>("/api/metrics/summary", fetcher, {
    refreshInterval: REFRESH_MS,
  });
  return useMemo(() => mapEstimatorMetrics(data), [data]);
}

export function useRoiStrip(): MetricBox[] | null {
  const { data } = useSWR<RoiResponse>("/api/metrics/roi", fetcher, {
    refreshInterval: REFRESH_MS,
  });
  return useMemo(() => mapRoiStrip(data), [data]);
}

export function useIntelFreshness(): Record<string, FreshnessCardData> {
  const { data: comp } = useSWR<{ competitors?: IntelRow[] }>(
    "/api/intelligence/competitive-intel",
    fetcher,
    { refreshInterval: REFRESH_MS },
  );
  const { data: mkt } = useSWR<{ rows?: IntelRow[] }>(
    "/api/intelligence/market-intel",
    fetcher,
    { refreshInterval: REFRESH_MS },
  );
  return useMemo(() => mapIntelFreshness(comp, mkt), [comp, mkt]);
}
