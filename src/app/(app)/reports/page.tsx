"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import type { Deal as DBDeal, Activity as DBActivity, Contact as DBContact } from "@/lib/types";

/* ── Types ─────────────────────────────────────────────── */

type PipelineMetrics = {
  totalValue: number;
  wonCount: number;
  wonValue: number;
  lostCount: number;
  lostValue: number;
  winRate: number;
};

type StageCount = {
  stage: string;
  count: number;
  value: number;
};

type ActivityCounts = {
  email: number;
  call: number;
  meeting: number;
  note: number;
};

type LifecycleCount = {
  stage: string;
  count: number;
};

type RecentDeal = {
  id: string;
  name: string;
  company: string;
  amount: number;
  stage: string;
  closeDate: string;
};

/* ── Stage colors (matching deals page) ──────────────── */

const stageBarColor: Record<string, string> = {
  "Qualified": "bg-zinc-500",
  "Meeting Scheduled": "bg-blue-500",
  "Proposal Sent": "bg-purple-500",
  "Negotiation": "bg-amber-500",
  "Closed Won": "bg-emerald-500",
  "Closed Lost": "bg-red-500",
};

const stageBadgeColor = (stage: string) => {
  switch (stage) {
    case "Closed Won": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "Closed Lost": return "bg-red-500/10 text-red-400 border-red-500/20";
    case "Negotiation": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "Proposal Sent": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "Meeting Scheduled": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  }
};

/* ── Funnel colors (zinc → emerald graduation) ───────── */

const funnelColors: Record<string, string> = {
  subscriber: "bg-zinc-600",
  lead: "bg-zinc-500",
  mql: "bg-teal-700",
  sql: "bg-teal-600",
  opportunity: "bg-emerald-600",
  customer: "bg-emerald-500",
};

const funnelLabels: Record<string, string> = {
  subscriber: "Subscriber",
  lead: "Lead",
  mql: "MQL",
  sql: "SQL",
  opportunity: "Opportunity",
  customer: "Customer",
};

const lifecycleOrder = ["subscriber", "lead", "mql", "sql", "opportunity", "customer"];

function formatAmount(amount: number): string {
  return "$" + amount.toLocaleString("en-US");
}

/* ── Component ───────────────────────────────────────── */

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<PipelineMetrics>({
    totalValue: 0, wonCount: 0, wonValue: 0, lostCount: 0, lostValue: 0, winRate: 0,
  });
  const [stageCounts, setStageCounts] = useState<StageCount[]>([]);
  const [activityCounts, setActivityCounts] = useState<ActivityCounts>({
    email: 0, call: 0, meeting: 0, note: 0,
  });
  const [lifecycleCounts, setLifecycleCounts] = useState<LifecycleCount[]>([]);
  const [recentDeals, setRecentDeals] = useState<RecentDeal[]>([]);

  useEffect(() => {
    const supabase = createClient();

    async function fetchAll() {
      try {
        // Fetch deals
        const { data: dealsData } = await supabase
          .from("deals")
          .select("*, companies(name)");

        const deals = (dealsData as DBDeal[] | null) || [];

        // Pipeline metrics
        const openDeals = deals.filter(
          (d) => d.stage !== "Closed Won" && d.stage !== "Closed Lost"
        );
        const wonDeals = deals.filter((d) => d.stage === "Closed Won");
        const lostDeals = deals.filter((d) => d.stage === "Closed Lost");
        const totalValue = openDeals.reduce((s, d) => s + (d.amount || 0), 0);
        const wonValue = wonDeals.reduce((s, d) => s + (d.amount || 0), 0);
        const lostValue = lostDeals.reduce((s, d) => s + (d.amount || 0), 0);
        const decided = wonDeals.length + lostDeals.length;
        const winRate = decided > 0 ? (wonDeals.length / decided) * 100 : 0;

        setMetrics({
          totalValue,
          wonCount: wonDeals.length,
          wonValue,
          lostCount: lostDeals.length,
          lostValue,
          winRate,
        });

        // Stage counts
        const stageMap = new Map<string, { count: number; value: number }>();
        for (const d of deals) {
          const s = d.stage || "Qualified";
          const existing = stageMap.get(s) || { count: 0, value: 0 };
          stageMap.set(s, { count: existing.count + 1, value: existing.value + (d.amount || 0) });
        }
        const stageOrder = [
          "Qualified", "Meeting Scheduled", "Proposal Sent",
          "Negotiation", "Closed Won", "Closed Lost",
        ];
        const sc: StageCount[] = stageOrder
          .filter((s) => stageMap.has(s))
          .map((s) => ({ stage: s, ...stageMap.get(s)! }));
        setStageCounts(sc);

        // Recent closed deals
        const closedDeals = deals
          .filter((d) => d.stage === "Closed Won" || d.stage === "Closed Lost")
          .sort((a, b) => (b.close_date || "").localeCompare(a.close_date || ""))
          .slice(0, 5);
        setRecentDeals(
          closedDeals.map((d) => ({
            id: d.id,
            name: d.name || "",
            company: d.companies?.name || "",
            amount: d.amount || 0,
            stage: d.stage || "",
            closeDate: d.close_date ? d.close_date.split("T")[0] : "",
          }))
        );

        // Fetch activities
        const { data: activitiesData } = await supabase
          .from("activities")
          .select("type");

        const activities = (activitiesData as Pick<DBActivity, "type">[] | null) || [];
        const ac: ActivityCounts = { email: 0, call: 0, meeting: 0, note: 0 };
        for (const a of activities) {
          const t = a.type?.toLowerCase() as keyof ActivityCounts;
          if (t in ac) ac[t]++;
        }
        setActivityCounts(ac);

        // Fetch contacts for lifecycle funnel
        const { data: contactsData } = await supabase
          .from("contacts")
          .select("lifecycle_stage");

        const contacts = (contactsData as Pick<DBContact, "lifecycle_stage">[] | null) || [];
        const lcMap = new Map<string, number>();
        for (const stage of lifecycleOrder) lcMap.set(stage, 0);
        for (const c of contacts) {
          const stage = (c.lifecycle_stage || "lead").toLowerCase();
          lcMap.set(stage, (lcMap.get(stage) || 0) + 1);
        }
        setLifecycleCounts(
          lifecycleOrder.map((s) => ({ stage: s, count: lcMap.get(s) || 0 }))
        );
      } catch {
        // Supabase failed — leave everything at zero defaults
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-[13px] text-zinc-500">Loading...</p>
      </div>
    );
  }

  const maxStageCount = Math.max(...stageCounts.map((s) => s.count), 1);
  const maxLifecycleCount = Math.max(...lifecycleCounts.map((l) => l.count), 1);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[15px] font-medium text-white">Reports</h1>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-white/[0.03] border border-white/[0.04] h-8 mb-6">
          <TabsTrigger
            value="overview"
            className="text-[13px] text-zinc-500 data-[state=active]:text-white data-[state=active]:bg-white/[0.06] h-6 px-3"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="pipeline"
            className="text-[13px] text-zinc-500 data-[state=active]:text-white data-[state=active]:bg-white/[0.06] h-6 px-3"
          >
            Pipeline
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="text-[13px] text-zinc-500 data-[state=active]:text-white data-[state=active]:bg-white/[0.06] h-6 px-3"
          >
            Activity
          </TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ──────────────────────────────── */}
        <TabsContent value="overview" className="space-y-6">
          {/* Pipeline Overview — 4 metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              label="Total Pipeline"
              value={formatAmount(metrics.totalValue)}
              sub="Open deals value"
            />
            <MetricCard
              label="Deals Won"
              value={String(metrics.wonCount)}
              sub={formatAmount(metrics.wonValue) + " total"}
              accent="text-emerald-400"
            />
            <MetricCard
              label="Deals Lost"
              value={String(metrics.lostCount)}
              sub={formatAmount(metrics.lostValue) + " total"}
              accent="text-red-400"
            />
            <MetricCard
              label="Win Rate"
              value={metrics.winRate.toFixed(1) + "%"}
              sub={`${metrics.wonCount + metrics.lostCount} decided`}
              accent="text-amber-400"
            />
          </div>

          {/* Pipeline by Stage — horizontal bar chart */}
          <div className="border border-white/[0.04] bg-white/[0.01] rounded-lg p-4">
            <h2 className="text-[11px] uppercase tracking-wide text-zinc-600 mb-4">Pipeline by Stage</h2>
            <div className="space-y-3">
              {stageCounts.map((s) => {
                const pct = Math.max((s.count / maxStageCount) * 100, 4);
                return (
                  <div key={s.stage} className="flex items-center gap-3">
                    <span className="text-[12px] text-zinc-400 w-[140px] shrink-0 truncate">
                      {s.stage}
                    </span>
                    <div className="flex-1 h-6 bg-white/[0.02] rounded overflow-hidden">
                      <div
                        className={`h-full rounded ${stageBarColor[s.stage] || "bg-zinc-500"} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[12px] text-zinc-500 w-[100px] text-right shrink-0">
                      {s.count} &middot; {formatAmount(s.value)}
                    </span>
                  </div>
                );
              })}
              {stageCounts.length === 0 && (
                <p className="text-[13px] text-zinc-600 text-center py-4">No deal data</p>
              )}
            </div>
          </div>

          {/* Recent Deals Closed */}
          <div className="border border-white/[0.04] bg-white/[0.01] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.04]">
              <h2 className="text-[11px] uppercase tracking-wide text-zinc-600">Recent Deals Closed</h2>
            </div>
            {recentDeals.length === 0 ? (
              <p className="text-[13px] text-zinc-600 text-center py-8">No closed deals yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.04] hover:bg-transparent">
                    <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600">Deal</TableHead>
                    <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600 hidden sm:table-cell">Company</TableHead>
                    <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600">Amount</TableHead>
                    <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600">Stage</TableHead>
                    <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600 hidden md:table-cell">Close Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentDeals.map((deal) => (
                    <TableRow key={deal.id} className="border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <TableCell className="text-[13px] text-white font-medium py-2.5">{deal.name}</TableCell>
                      <TableCell className="text-[13px] text-zinc-400 py-2.5 hidden sm:table-cell">{deal.company}</TableCell>
                      <TableCell className="text-[13px] text-zinc-300 py-2.5">{formatAmount(deal.amount)}</TableCell>
                      <TableCell className="py-2.5">
                        <Badge variant="outline" className={`text-[11px] font-normal ${stageBadgeColor(deal.stage)}`}>
                          {deal.stage}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[13px] text-zinc-500 py-2.5 hidden md:table-cell">{deal.closeDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* ── Pipeline Tab ──────────────────────────────── */}
        <TabsContent value="pipeline" className="space-y-6">
          {/* Pipeline metrics row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              label="Total Pipeline"
              value={formatAmount(metrics.totalValue)}
              sub="Open deals value"
            />
            <MetricCard
              label="Deals Won"
              value={String(metrics.wonCount)}
              sub={formatAmount(metrics.wonValue) + " total"}
              accent="text-emerald-400"
            />
            <MetricCard
              label="Deals Lost"
              value={String(metrics.lostCount)}
              sub={formatAmount(metrics.lostValue) + " total"}
              accent="text-red-400"
            />
            <MetricCard
              label="Win Rate"
              value={metrics.winRate.toFixed(1) + "%"}
              sub={`${metrics.wonCount + metrics.lostCount} decided`}
              accent="text-amber-400"
            />
          </div>

          {/* Full bar chart */}
          <div className="border border-white/[0.04] bg-white/[0.01] rounded-lg p-4">
            <h2 className="text-[11px] uppercase tracking-wide text-zinc-600 mb-4">Deals by Stage</h2>
            <div className="space-y-3">
              {stageCounts.map((s) => {
                const pct = Math.max((s.count / maxStageCount) * 100, 4);
                return (
                  <div key={s.stage} className="flex items-center gap-3">
                    <span className="text-[12px] text-zinc-400 w-[140px] shrink-0 truncate">
                      {s.stage}
                    </span>
                    <div className="flex-1 h-7 bg-white/[0.02] rounded overflow-hidden">
                      <div
                        className={`h-full rounded ${stageBarColor[s.stage] || "bg-zinc-500"} transition-all flex items-center pl-2`}
                        style={{ width: `${pct}%` }}
                      >
                        {pct > 15 && (
                          <span className="text-[11px] text-white/80 font-medium">{s.count}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[12px] text-zinc-500 w-[100px] text-right shrink-0">
                      {formatAmount(s.value)}
                    </span>
                  </div>
                );
              })}
              {stageCounts.length === 0 && (
                <p className="text-[13px] text-zinc-600 text-center py-4">No deal data</p>
              )}
            </div>
          </div>

          {/* Contact Lifecycle Funnel */}
          <div className="border border-white/[0.04] bg-white/[0.01] rounded-lg p-4">
            <h2 className="text-[11px] uppercase tracking-wide text-zinc-600 mb-4">Contact Lifecycle Funnel</h2>
            <div className="space-y-2">
              {lifecycleCounts.map((lc, i) => {
                // Funnel: widths shrink from 100% down, proportional to count
                const pct = maxLifecycleCount > 0
                  ? Math.max((lc.count / maxLifecycleCount) * 100, 6)
                  : 6;
                return (
                  <div key={lc.stage} className="flex items-center gap-3">
                    <span className="text-[12px] text-zinc-400 w-[100px] shrink-0 truncate">
                      {funnelLabels[lc.stage] || lc.stage}
                    </span>
                    <div className="flex-1 flex justify-center">
                      <div
                        className={`h-8 rounded ${funnelColors[lc.stage] || "bg-zinc-500"} flex items-center justify-center transition-all`}
                        style={{ width: `${pct}%` }}
                      >
                        <span className="text-[11px] text-white font-medium">{lc.count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* ── Activity Tab ──────────────────────────────── */}
        <TabsContent value="activity" className="space-y-6">
          {/* Activity Summary — 4 cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard label="Emails Sent" value={String(activityCounts.email)} sub="Total email activities" />
            <MetricCard label="Calls Logged" value={String(activityCounts.call)} sub="Total call activities" />
            <MetricCard label="Meetings Held" value={String(activityCounts.meeting)} sub="Total meeting activities" />
            <MetricCard label="Notes Added" value={String(activityCounts.note)} sub="Total note activities" />
          </div>

          {/* Activity breakdown bar */}
          <div className="border border-white/[0.04] bg-white/[0.01] rounded-lg p-4">
            <h2 className="text-[11px] uppercase tracking-wide text-zinc-600 mb-4">Activity Breakdown</h2>
            {(() => {
              const total = activityCounts.email + activityCounts.call + activityCounts.meeting + activityCounts.note;
              if (total === 0) return <p className="text-[13px] text-zinc-600 text-center py-4">No activity data</p>;
              const items = [
                { label: "Emails", count: activityCounts.email, color: "bg-blue-500" },
                { label: "Calls", count: activityCounts.call, color: "bg-amber-500" },
                { label: "Meetings", count: activityCounts.meeting, color: "bg-purple-500" },
                { label: "Notes", count: activityCounts.note, color: "bg-emerald-500" },
              ];
              return (
                <div className="space-y-3">
                  {/* Stacked bar */}
                  <div className="flex h-8 rounded overflow-hidden gap-0.5">
                    {items.filter(i => i.count > 0).map((item) => (
                      <div
                        key={item.label}
                        className={`${item.color} flex items-center justify-center transition-all`}
                        style={{ width: `${(item.count / total) * 100}%` }}
                      >
                        {(item.count / total) > 0.1 && (
                          <span className="text-[11px] text-white font-medium">{item.count}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Legend */}
                  <div className="flex flex-wrap gap-4 mt-2">
                    {items.map((item) => (
                      <div key={item.label} className="flex items-center gap-1.5">
                        <div className={`size-2 rounded-full ${item.color}`} />
                        <span className="text-[11px] text-zinc-500">{item.label}: {item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Metric Card ─────────────────────────────────────── */

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: string;
}) {
  return (
    <div className="border border-white/[0.04] bg-white/[0.01] rounded-lg p-4">
      <p className="text-[11px] text-zinc-600 mb-1">{label}</p>
      <p className={`text-[24px] font-medium leading-tight ${accent || "text-white"}`}>{value}</p>
      <p className="text-[11px] text-zinc-600 mt-1">{sub}</p>
    </div>
  );
}
