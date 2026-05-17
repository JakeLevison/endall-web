"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import type { Deal, Activity } from "@/lib/types";
import UpcomingEvents from "@/components/calendar/UpcomingEvents";
import WelcomeWizard from "@/components/onboarding/WelcomeWizard";
import TodaysPriorities from "@/components/dashboard/TodaysPriorities";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import RecentEstimates from "@/components/dashboard/RecentEstimates";
import CommandCenter from "@/components/command-center/CommandCenter";
import { posthog } from "@/lib/posthog";

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
      return "bg-zinc-500/10 text-[var(--text-tertiary)] border-zinc-500/20";
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

function daysInStage(createdAt: string, updatedAt?: string): number {
  const ref = updatedAt || createdAt;
  return Math.max(0, Math.floor((Date.now() - new Date(ref).getTime()) / 86_400_000));
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

type StageDeal = {
  id: string;
  name: string;
  company: string;
  contactName: string;
  contactId: string | null;
  amount: number;
  daysInStage: number;
};

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
  contactId: string | null;
  dealId: string | null;
  createdAt: string;
};

type RecentCompanyCard = {
  id: string;
  name: string;
  lastActivity: string;
  dealCount: number;
};

type RecentContactCard = {
  id: string;
  name: string;
  company: string;
  lastTouch: string;
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
  const [stageDealsMap, setStageDealsMap] = useState<Record<string, StageDeal[]>>({});
  const [upcomingDeals, setUpcomingDeals] = useState<UpcomingDeal[]>([]);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [recentCompanies, setRecentCompanies] = useState<RecentCompanyCard[]>([]);
  const [recentContacts, setRecentContacts] = useState<RecentContactCard[]>([]);

  useEffect(() => {
    const supabase = createClient();

    async function fetchDashboard() {
      try {
        const [
          contactsRes,
          dealsRes,
          activitiesRes,
          recentCompaniesRes,
          recentContactsRes,
        ] = await Promise.all([
          supabase.from("contacts").select("id", { count: "exact", head: true }),
          supabase.from("deals").select("*, companies(name), contacts(id, first_name, last_name)"),
          supabase
            .from("activities")
            .select("*, contacts(first_name, last_name)")
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("companies")
            .select("id, name, updated_at")
            .order("updated_at", { ascending: false })
            .limit(6),
          supabase
            .from("contacts")
            .select("id, first_name, last_name, updated_at, companies(name)")
            .order("updated_at", { ascending: false })
            .limit(6),
        ]);

        // Total contacts
        setTotalContacts(contactsRes.count ?? 0);

        // Process deals
        const deals: (Deal & { contacts?: { id: string; first_name: string; last_name: string } | null })[] = dealsRes.data ?? [];
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

        // Stage counts + deals per stage
        const counts: Record<string, number> = {};
        const dealsPerStage: Record<string, StageDeal[]> = {};
        for (const s of stages) {
          counts[s] = 0;
          dealsPerStage[s] = [];
        }
        for (const d of deals) {
          if (counts[d.stage] !== undefined) {
            counts[d.stage]++;
            dealsPerStage[d.stage].push({
              id: d.id,
              name: d.name || "",
              company: d.companies?.name || "",
              contactName: d.contacts
                ? `${d.contacts.first_name} ${d.contacts.last_name}`.trim()
                : "",
              contactId: d.contacts?.id || null,
              amount: d.amount || 0,
              daysInStage: daysInStage(d.created_at, d.updated_at),
            });
          }
        }
        setStageCounts(
          stages.map((s) => ({ stage: s, count: counts[s] })).filter((s) => s.count > 0)
        );
        setStageDealsMap(dealsPerStage);

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
            contactId: a.contact_id,
            dealId: a.deal_id,
            createdAt: a.created_at,
          })
        );
        setActivities(acts);

        // Recent companies — get deal counts
        const companyData = recentCompaniesRes.data ?? [];
        if (companyData.length > 0) {
          const companyIds = companyData.map((c: { id: string }) => c.id);
          const { data: companyDeals } = await supabase
            .from("deals")
            .select("company_id")
            .in("company_id", companyIds);

          const dealCounts: Record<string, number> = {};
          for (const d of companyDeals || []) {
            dealCounts[d.company_id] = (dealCounts[d.company_id] || 0) + 1;
          }

          setRecentCompanies(
            companyData.map((c: { id: string; name: string; updated_at: string }) => ({
              id: c.id,
              name: c.name || "",
              lastActivity: c.updated_at ? relativeTime(c.updated_at) : "",
              dealCount: dealCounts[c.id] || 0,
            }))
          );
        }

        // Recent contacts
        setRecentContacts(
          (recentContactsRes.data ?? []).map(
            (c: Record<string, unknown>) => {
              const co = c.companies as unknown as { name: string } | null;
              return {
                id: c.id as string,
                name: `${c.first_name} ${c.last_name}`.trim(),
                company: co?.name || "",
                lastTouch: c.updated_at ? relativeTime(c.updated_at as string) : "",
              };
            }
          )
        );
      } catch {
        // Supabase unavailable — everything stays at default zeros/empty
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
    posthog.capture("command_center_viewed");
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-[13px] text-[var(--text-muted)]">Loading...</p>
      </div>
    );
  }

  const maxStageCount = Math.max(...stageCounts.map((s) => s.count), 1);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1
          style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}
        >
          Dashboard
        </h1>
        <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] rounded" style={{ color: "var(--text-faint)", background: "var(--overlay-weak)", border: "1px solid var(--overlay-medium)" }}>
          <span className="text-xs">&#8984;</span>K search
        </kbd>
      </div>

      {/* Onboarding wizard — shows until dismissed */}
      <WelcomeWizard
        completedSteps={[]}
        onDismiss={() => {
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
            href: "/contacts",
          },
          {
            icon: HandCoins,
            label: "Open Deals",
            value: openDeals.toLocaleString(),
            href: "/deals",
          },
          {
            icon: DollarSign,
            label: "Pipeline Value",
            value: formatPipelineValue(pipelineValue),
            href: "/deals",
          },
          {
            icon: Trophy,
            label: "Won This Month",
            value: wonThisMonth.toLocaleString(),
            href: "/deals",
          },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-lg border border-[var(--border)] bg-[var(--overlay-weak)] p-4 hover:bg-[var(--overlay-soft)] transition-colors"
          >
            <div className="flex items-center gap-2 mb-3">
              <stat.icon className="size-3.5 text-[var(--text-muted)]" />
              <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wide">
                {stat.label}
              </span>
            </div>
            <p className="text-[24px] font-medium text-[var(--text-primary)] leading-none">
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      {/* Recent Estimates (post-call "where do I see this" moment) */}
      <RecentEstimates />

      {/* ── Two-column body ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Recent Activity — linked to entities */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--overlay-weak)] p-4">
          <h2 className="text-[13px] font-medium text-[var(--text-primary)] mb-4">
            Recent Activity
          </h2>
          {activities.length === 0 ? (
            <p className="text-[13px] text-[var(--text-muted)]">No recent activity.</p>
          ) : (
            <div className="space-y-1">
              {activities.map((a) => {
                // Determine link target: calls→contact, emails→deal or contact, else→contact
                let href: string | null = null;
                if (a.type === "call" && a.contactId) href = `/contacts/${a.contactId}`;
                else if (a.type === "email" && a.dealId) href = `/deals/${a.dealId}`;
                else if (a.type === "email" && a.contactId) href = `/contacts/${a.contactId}`;
                else if (a.contactId) href = `/contacts/${a.contactId}`;
                else if (a.dealId) href = `/deals/${a.dealId}`;

                const inner = (
                  <>
                    <div className="mt-0.5 shrink-0 size-6 rounded-md bg-[var(--overlay-soft)] flex items-center justify-center text-[var(--text-muted)]">
                      {activityIcon(a.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-[var(--text-secondary)] truncate">
                        {a.subject}
                      </p>
                      {a.contactName && (
                        <p className="text-[11px] text-[var(--text-muted)]">{a.contactName}</p>
                      )}
                    </div>
                    <span className="text-[11px] text-[var(--text-faint)] shrink-0 mt-0.5">
                      {relativeTime(a.createdAt)}
                    </span>
                  </>
                );

                return href ? (
                  <Link
                    key={a.id}
                    href={href}
                    className="flex items-start gap-3 py-2 border-b border-[var(--border)] last:border-0 hover:bg-[var(--overlay-soft)] rounded-md px-1 -mx-1 transition-colors"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div
                    key={a.id}
                    className="flex items-start gap-3 py-2 border-b border-[var(--border)] last:border-0"
                  >
                    {inner}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Deals by Stage — clickable drill-down */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--overlay-weak)] p-4">
          <h2 className="text-[13px] font-medium text-[var(--text-primary)] mb-4">
            Pipeline
          </h2>
          {stageCounts.length === 0 ? (
            <p className="text-[13px] text-[var(--text-muted)]">No deals yet.</p>
          ) : (
            <div className="space-y-1">
              {stageCounts.map((s) => {
                const isExpanded = expandedStage === s.stage;
                const dealsInStage = stageDealsMap[s.stage] || [];
                return (
                  <div key={s.stage}>
                    <button
                      onClick={() => setExpandedStage(isExpanded ? null : s.stage)}
                      className="w-full text-left hover:bg-[var(--overlay-soft)] rounded-md px-2 py-2 -mx-2 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          {isExpanded ? (
                            <ChevronDown className="size-3 text-[var(--text-muted)]" />
                          ) : (
                            <ChevronRight className="size-3 text-[var(--text-muted)]" />
                          )}
                          <span className="text-[13px] text-[var(--text-tertiary)]">{s.stage}</span>
                        </div>
                        <span className="text-[13px] text-[var(--text-muted)]">{s.count}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[var(--overlay-soft)] ml-4.5">
                        <div
                          className={`h-1.5 rounded-full ${stageBarColor[s.stage] ?? "bg-zinc-500"}`}
                          style={{
                            width: `${(s.count / maxStageCount) * 100}%`,
                          }}
                        />
                      </div>
                    </button>

                    {/* Expanded deal rows */}
                    {isExpanded && dealsInStage.length > 0 && (
                      <div className="ml-4 mt-1 mb-2 border-l-2 border-[var(--overlay-soft)] pl-3 space-y-0.5">
                        {dealsInStage.map((deal) => (
                          <Link
                            key={deal.id}
                            href={`/deals/${deal.id}`}
                            className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-[var(--overlay-soft)] transition-colors group"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] text-[var(--text-primary)] truncate group-hover:text-[var(--text-primary)]">
                                {deal.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {deal.company && (
                                  <span className="text-[11px] text-[var(--text-muted)] truncate">{deal.company}</span>
                                )}
                                {deal.contactName && (
                                  <>
                                    <span className="text-[11px] text-[var(--text-faint)]">·</span>
                                    <span className="text-[11px] text-[var(--text-muted)] truncate">{deal.contactName}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[13px] text-[var(--text-secondary)] font-medium">
                                {formatAmount(deal.amount)}
                              </p>
                              <p className="text-[11px] text-[var(--text-faint)]">
                                {deal.daysInStage}d in stage
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                    {isExpanded && dealsInStage.length === 0 && (
                      <p className="ml-4 pl-3 text-[11px] text-[var(--text-faint)] py-1">No deals</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Companies & Contacts ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Recent Companies */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--overlay-weak)] p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-medium text-[var(--text-primary)]">Recent Companies</h2>
            <Link href="/companies" className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
              View all
            </Link>
          </div>
          {recentCompanies.length === 0 ? (
            <p className="text-[13px] text-[var(--text-muted)]">No companies yet.</p>
          ) : (
            <div className="space-y-0.5">
              {recentCompanies.map((c) => (
                <Link
                  key={c.id}
                  href={`/companies/${c.id}`}
                  className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-md hover:bg-[var(--overlay-soft)] transition-colors"
                >
                  <div className="size-8 rounded-md bg-[var(--overlay-soft)] flex items-center justify-center shrink-0">
                    <Building2 className="size-3.5 text-[var(--text-muted)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-[var(--text-primary)] truncate">{c.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-[var(--text-muted)]">{c.dealCount} deal{c.dealCount !== 1 ? "s" : ""}</span>
                      <span className="text-[11px] text-[var(--text-faint)]">·</span>
                      <span className="text-[11px] text-[var(--text-faint)]">{c.lastActivity}</span>
                    </div>
                  </div>
                  <ChevronRight className="size-3 text-[var(--text-faint)] shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Contacts */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--overlay-weak)] p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-medium text-[var(--text-primary)]">Recent Contacts</h2>
            <Link href="/contacts" className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
              View all
            </Link>
          </div>
          {recentContacts.length === 0 ? (
            <p className="text-[13px] text-[var(--text-muted)]">No contacts yet.</p>
          ) : (
            <div className="space-y-0.5">
              {recentContacts.map((c) => (
                <Link
                  key={c.id}
                  href={`/contacts/${c.id}`}
                  className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-md hover:bg-[var(--overlay-soft)] transition-colors"
                >
                  <div className="size-8 rounded-md bg-[var(--overlay-soft)] flex items-center justify-center shrink-0">
                    <Users className="size-3.5 text-[var(--text-muted)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-[var(--text-primary)] truncate">{c.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {c.company && <span className="text-[11px] text-[var(--text-muted)]">{c.company}</span>}
                      {c.company && <span className="text-[11px] text-[var(--text-faint)]">·</span>}
                      <span className="text-[11px] text-[var(--text-faint)]">{c.lastTouch}</span>
                    </div>
                  </div>
                  <ChevronRight className="size-3 text-[var(--text-faint)] shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Upcoming Close Dates ──────────────────────────────────── */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--overlay-weak)] p-4">
        <h2 className="text-[13px] font-medium text-[var(--text-primary)] mb-4">
          Upcoming Close Dates
        </h2>
        {upcomingDeals.length === 0 ? (
          <p className="text-[13px] text-[var(--text-muted)]">
            No deals closing in the next 30 days.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)] pb-2 pr-4">
                    Deal
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)] pb-2 pr-4 hidden sm:table-cell">
                    Company
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)] pb-2 pr-4">
                    Amount
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)] pb-2 pr-4 hidden md:table-cell">
                    Close Date
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)] pb-2">
                    Stage
                  </th>
                </tr>
              </thead>
              <tbody>
                {upcomingDeals.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--overlay-soft)] cursor-pointer transition-colors"
                    onClick={() => window.location.href = `/deals/${d.id}`}
                  >
                    <td className="py-2.5 pr-4 text-[13px] text-[var(--text-primary)] font-medium">
                      <Link href={`/deals/${d.id}`} className="hover:underline">{d.name}</Link>
                    </td>
                    <td className="py-2.5 pr-4 text-[13px] text-[var(--text-tertiary)] hidden sm:table-cell">
                      {d.company}
                    </td>
                    <td className="py-2.5 pr-4 text-[13px] text-[var(--text-secondary)]">
                      {formatAmount(d.amount)}
                    </td>
                    <td className="py-2.5 pr-4 text-[13px] text-[var(--text-muted)] hidden md:table-cell">
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
