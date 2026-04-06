"use client";

import { useState, useEffect } from "react";
import {
  Users,
  HandCoins,
  DollarSign,
  Trophy,
  Mail,
  Phone,
  Building2,
  ClipboardList,
  CheckSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import type { Deal, Activity } from "@/lib/types";
import UpcomingEvents from "@/components/calendar/UpcomingEvents";
import WelcomeWizard from "@/components/onboarding/WelcomeWizard";
import TodaysPriorities from "@/components/dashboard/TodaysPriorities";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import CommandCenter from "@/components/command-center/CommandCenter";

// ── helpers ──────────────────────────────────────────────────────────

const stages = [
  "Qualified",
  "Meeting Scheduled",
  "Proposal Sent",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
];

const stageBarColor: Record<string, string> = {
  Qualified: "bg-zinc-500",
  "Meeting Scheduled": "bg-blue-500",
  "Proposal Sent": "bg-purple-500",
  Negotiation: "bg-amber-500",
  "Closed Won": "bg-emerald-500",
  "Closed Lost": "bg-red-500",
};

const stageBadgeColor = (stage: string) => {
  switch (stage) {
    case "Closed Won":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "Closed Lost":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    case "Negotiation":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "Proposal Sent":
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "Meeting Scheduled":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    default:
      return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  }
};

function formatPipelineValue(cents: number): string {
  if (cents >= 1_000_000) return "$" + (cents / 1_000_000).toFixed(1) + "M";
  if (cents >= 1_000) return "$" + (cents / 1_000).toFixed(0) + "k";
  return "$" + cents.toLocaleString("en-US");
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatAmount(amount: number): string {
  return "$" + amount.toLocaleString("en-US");
}

function activityIcon(type: string) {
  switch (type?.toLowerCase()) {
    case "email":
      return <Mail className="size-3.5" />;
    case "call":
      return <Phone className="size-3.5" />;
    case "meeting":
      return <Building2 className="size-3.5" />;
    case "note":
      return <ClipboardList className="size-3.5" />;
    case "task":
      return <CheckSquare className="size-3.5" />;
    default:
      return <ClipboardList className="size-3.5" />;
  }
}

// ── types ────────────────────────────────────────────────────────────

type StageCount = { stage: string; count: number };

type UpcomingDeal = {
  id: string;
  name: string;
  company: string;
  amount: number;
  closeDate: string;
  stage: string;
};

type RecentActivity = {
  id: string;
  type: string;
  subject: string;
  contactName: string;
  createdAt: string;
};

// ── component ────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [totalContacts, setTotalContacts] = useState(0);
  const [openDeals, setOpenDeals] = useState(0);
  const [pipelineValue, setPipelineValue] = useState(0);
  const [wonThisMonth, setWonThisMonth] = useState(0);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [stageCounts, setStageCounts] = useState<StageCount[]>([]);
  const [upcomingDeals, setUpcomingDeals] = useState<UpcomingDeal[]>([]);

  useEffect(() => {
    const supabase = createClient();

    async function fetchDashboard() {
      try {
        // Fetch all data in parallel
        const [
          contactsRes,
          dealsRes,
          activitiesRes,
        ] = await Promise.all([
          supabase.from("contacts").select("id", { count: "exact", head: true }),
          supabase.from("deals").select("*, companies(name)"),
          supabase
            .from("activities")
            .select("*, contacts(first_name, last_name)")
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

        // Total contacts
        setTotalContacts(contactsRes.count ?? 0);

        // Process deals
        const deals: Deal[] = dealsRes.data ?? [];
        const open = deals.filter(
          (d) => d.stage !== "Closed Won" && d.stage !== "Closed Lost"
        );
        setOpenDeals(open.length);
        setPipelineValue(open.reduce((sum, d) => sum + (d.amount || 0), 0));

        // Won this month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const wonDeals = deals.filter(
          (d) =>
            d.stage === "Closed Won" &&
            new Date(d.updated_at ?? d.created_at) >= monthStart
        );
        setWonThisMonth(wonDeals.length);

        // Stage counts (only non-zero stages)
        const counts: Record<string, number> = {};
        for (const s of stages) counts[s] = 0;
        for (const d of deals) {
          if (counts[d.stage] !== undefined) counts[d.stage]++;
        }
        setStageCounts(
          stages.map((s) => ({ stage: s, count: counts[s] })).filter((s) => s.count > 0)
        );

        // Upcoming close dates (next 30 days)
        const in30 = new Date();
        in30.setDate(in30.getDate() + 30);
        const upcoming = open
          .filter((d) => {
            if (!d.close_date) return false;
            const cd = new Date(d.close_date);
            return cd >= now && cd <= in30;
          })
          .sort(
            (a, b) =>
              new Date(a.close_date).getTime() - new Date(b.close_date).getTime()
          )
          .map((d) => ({
            id: d.id,
            name: d.name || "",
            company: d.companies?.name || "",
            amount: d.amount || 0,
            closeDate: d.close_date?.split("T")[0] || "",
            stage: d.stage || "Qualified",
          }));
        setUpcomingDeals(upcoming);

        // Activities
        const acts: RecentActivity[] = (activitiesRes.data ?? []).map(
          (a: Activity & { contacts?: { first_name: string; last_name: string } | null }) => ({
            id: a.id,
            type: a.type,
            subject: a.subject || "Untitled",
            contactName: a.contacts
              ? `${a.contacts.first_name} ${a.contacts.last_name}`.trim()
              : "",
            createdAt: a.created_at,
          })
        );
        setActivities(acts);
      } catch {
        // Supabase unavailable — everything stays at default zeros/empty
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-[13px] text-zinc-500">Loading...</p>
      </div>
    );
  }

  const maxStageCount = Math.max(...stageCounts.map((s) => s.count), 1);

  return (
    <div className="p-6 space-y-6">
      <h1
        style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}
      >
        Dashboard
      </h1>

      {/* Onboarding wizard — shows until dismissed */}
      <WelcomeWizard
        completedSteps={[]}
        onDismiss={() => {
          // Could save dismiss state to localStorage or Supabase
          localStorage.setItem("endall-onboarding-dismissed", "1");
        }}
      />

      {/* ── Agent Command Center ─────────────────────────────────── */}
      <CommandCenter />

      {/* ── CRM: Stats Row ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            icon: Users,
            label: "Total Contacts",
            value: totalContacts.toLocaleString(),
          },
          {
            icon: HandCoins,
            label: "Open Deals",
            value: openDeals.toLocaleString(),
          },
          {
            icon: DollarSign,
            label: "Pipeline Value",
            value: formatPipelineValue(pipelineValue),
          },
          {
            icon: Trophy,
            label: "Won This Month",
            value: wonThisMonth.toLocaleString(),
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <stat.icon className="size-3.5 text-zinc-600" />
              <span className="text-[11px] text-zinc-600 uppercase tracking-wide">
                {stat.label}
              </span>
            </div>
            <p className="text-[24px] font-medium text-white leading-none">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Two-column body ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Recent Activity */}
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-4">
          <h2 className="text-[13px] font-medium text-white mb-4">
            Recent Activity
          </h2>
          {activities.length === 0 ? (
            <p className="text-[13px] text-zinc-600">No recent activity.</p>
          ) : (
            <div className="space-y-1">
              {activities.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 py-2 border-b border-white/[0.04] last:border-0"
                >
                  <div className="mt-0.5 shrink-0 size-6 rounded-md bg-white/[0.04] flex items-center justify-center text-zinc-500">
                    {activityIcon(a.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-zinc-300 truncate">
                      {a.subject}
                    </p>
                    {a.contactName && (
                      <p className="text-[11px] text-zinc-600">{a.contactName}</p>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-700 shrink-0 mt-0.5">
                    {relativeTime(a.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deals by Stage */}
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-4">
          <h2 className="text-[13px] font-medium text-white mb-4">
            Deals by Stage
          </h2>
          {stageCounts.length === 0 ? (
            <p className="text-[13px] text-zinc-600">No deals yet.</p>
          ) : (
            <div className="space-y-3">
              {stageCounts.map((s) => (
                <div key={s.stage}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] text-zinc-400">{s.stage}</span>
                    <span className="text-[13px] text-zinc-500">{s.count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/[0.04]">
                    <div
                      className={`h-2 rounded-full ${stageBarColor[s.stage] ?? "bg-zinc-500"}`}
                      style={{
                        width: `${(s.count / maxStageCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Upcoming Close Dates ──────────────────────────────────── */}
      <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-4">
        <h2 className="text-[13px] font-medium text-white mb-4">
          Upcoming Close Dates
        </h2>
        {upcomingDeals.length === 0 ? (
          <p className="text-[13px] text-zinc-600">
            No deals closing in the next 30 days.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="text-left text-[11px] uppercase tracking-wide text-zinc-600 pb-2 pr-4">
                    Deal
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wide text-zinc-600 pb-2 pr-4 hidden sm:table-cell">
                    Company
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wide text-zinc-600 pb-2 pr-4">
                    Amount
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wide text-zinc-600 pb-2 pr-4 hidden md:table-cell">
                    Close Date
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wide text-zinc-600 pb-2">
                    Stage
                  </th>
                </tr>
              </thead>
              <tbody>
                {upcomingDeals.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-white/[0.04] last:border-0"
                  >
                    <td className="py-2.5 pr-4 text-[13px] text-white font-medium">
                      {d.name}
                    </td>
                    <td className="py-2.5 pr-4 text-[13px] text-zinc-400 hidden sm:table-cell">
                      {d.company}
                    </td>
                    <td className="py-2.5 pr-4 text-[13px] text-zinc-300">
                      {formatAmount(d.amount)}
                    </td>
                    <td className="py-2.5 pr-4 text-[13px] text-zinc-500 hidden md:table-cell">
                      {d.closeDate}
                    </td>
                    <td className="py-2.5">
                      <Badge
                        variant="outline"
                        className={`text-[11px] font-normal ${stageBadgeColor(d.stage)}`}
                      >
                        {d.stage}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Today's priorities (Salesloft Rhythm equivalent) */}
      <TodaysPriorities />

      {/* Activity feed + Calendar events side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <ActivityFeed />
        <UpcomingEvents />
      </div>
    </div>
  );
}
