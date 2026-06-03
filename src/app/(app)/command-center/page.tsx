"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Users,
  Sparkles,
  Mail,
  Phone,
  FileSpreadsheet,
  Download,
  RefreshCw,
  BarChart3,
  Wallet,
  FileText,
  TrendingUp,
  Wrench,
  FileEdit,
  Search,
  LayoutGrid,
} from "lucide-react";
import {
  useAllLogs,
  useAllStatuses,
  useAllPerformance,
  useCommandCenterStats,
  normalizeAgentId,
  type AgentLog,
} from "@/lib/ops-api";
import AgentCardsGrid from "@/components/command-center/AgentCardsGrid";
import { COMMAND_CENTER_AGENTS } from "@/components/command-center/roster";
import { deriveStatus } from "@/lib/agent-status";
import {
  useEstimatorMetrics,
  useRoiStrip,
  useIntelFreshness,
  deriveNeedsAttention,
  type AttentionItem,
} from "@/lib/command-center-data";
import { QUICK_ACTIONS, type SavedFile } from "@/hooks/useChat";
import { posthog } from "@/lib/posthog";
import { agentDisplayName, isSuccessStatus } from "@/lib/command-center";

// TODO: wire real auth -- auth wiring is out of scope through P15b.
// For now, proxy allows unauthenticated access. When auth lands,
// re-enable the redirect in src/proxy.ts and gate this route there.
function usePlaceholderAuth() {
  const router = useRouter();
  useEffect(() => {
    if (typeof window === "undefined") return;
    const flag = window.localStorage.getItem("endall-force-unauth");
    if (flag === "1") router.replace("/");
  }, [router]);
}

const QUICK_ACTION_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  BarChart3,
  Wallet,
  FileText,
  TrendingUp,
  Wrench,
  FileEdit,
  Search,
  CheckCircle: CheckCircle2,
};

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Inbound calls the bridge couldn't attribute store company_name "Unknown"
// but carry the caller in input_data.contact. Fall back to caller name/phone
// so the feed never shows a bare "— Unknown".
const PLACEHOLDER_COMPANIES = new Set(["", "unknown", "n/a", "none", "null"]);

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const ten =
    digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (ten.length === 10)
    return `+1 ${ten.slice(0, 3)}-${ten.slice(3, 6)}-${ten.slice(6)}`;
  return raw.trim();
}

function feedTarget(log: AgentLog): string | null {
  const company = (log.company_name ?? "").trim();
  if (company && !PLACEHOLDER_COMPANIES.has(company.toLowerCase()))
    return company;
  const contact =
    (
      log as {
        input_data?: {
          contact?: { name?: string | null; phone?: string | null } | null;
        } | null;
      }
    ).input_data?.contact ?? null;
  const name = (contact?.name ?? "").trim();
  if (name) return name;
  const phone = (contact?.phone ?? "").trim();
  if (phone) return formatPhone(phone);
  return null;
}

function StatusBadge({ status }: { status: string }) {
  const ok = isSuccessStatus(status);
  const label = status || "unknown";
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-normal border"
      style={{
        background: ok ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
        color: ok ? "#10b981" : "#ef4444",
        borderColor: ok ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
      }}
    >
      {ok ? (
        <CheckCircle2 className="size-3" />
      ) : (
        <AlertTriangle className="size-3" />
      )}
      {label}
    </span>
  );
}

function Section({
  id,
  title,
  icon: Icon,
  children,
  action,
  onVisible,
}: {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  action?: React.ReactNode;
  onVisible: (section: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !seen.current) {
            seen.current = true;
            onVisible(id);
            obs.disconnect();
          }
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [id, onVisible]);

  return (
    <section
      ref={ref}
      data-section={id}
      className="rounded-lg border p-4"
      style={{
        borderColor: "var(--border)",
        background: "var(--overlay-weak)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="size-4" />
          <h2 className="text-[13px] font-medium text-[var(--text-primary)]">
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

// ── System Health strip ───────────────────────────────────────────────

function StatusDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block shrink-0"
      style={{ width: 8, height: 8, borderRadius: 999, background: color }}
    />
  );
}

function SystemHealthStrip({
  statuses,
  logs,
  onVisible,
}: {
  statuses: Record<string, import("@/lib/ops-api").AgentStatusResponse | null>;
  logs: AgentLog[];
  onVisible: (s: string) => void;
}) {
  const healthAgents = COMMAND_CENTER_AGENTS.filter((a) => a.tier === "health");
  const derived = healthAgents.map((a) => {
    const agentLogs = logs.filter((l) => normalizeAgentId(l.agent_id) === a.id);
    return { agent: a, ...deriveStatus(statuses[a.id] ?? null, agentLogs) };
  });
  const healthy = derived.filter(
    (d) => d.label === "ACTIVE" || d.label === "IDLE"
  ).length;
  const pending = healthAgents.reduce(
    (sum, a) => sum + (statuses[a.id]?.pending_messages ?? 0),
    0
  );

  return (
    <Section
      id="system_health"
      title="System Health"
      icon={Activity}
      onVisible={onVisible}
      action={
        <span className="text-[11px] text-[var(--text-muted)]">
          {healthy} of {healthAgents.length} healthy
          {pending > 0 ? ` · ${pending} pending` : ""}
        </span>
      }
    >
      <div className="flex flex-wrap gap-2">
        {derived.map(({ agent, label, color }) => (
          <div
            key={agent.id}
            className="flex items-center gap-2 rounded-md border px-3 py-2"
            style={{
              borderColor: "var(--border)",
              background: "var(--overlay-soft)",
            }}
          >
            <StatusDot color={color} />
            <span className="text-[12px] font-medium text-[var(--text-primary)]">
              {agent.label}
            </span>
            <span
              className="text-[10px] uppercase tracking-wide"
              style={{ color }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── Activity Feed (collapsed to 5) ────────────────────────────────────

function ActivityFeedSection({
  logs,
  isLoading,
  isValidating,
  mutate,
  onVisible,
}: {
  logs: AgentLog[];
  isLoading: boolean;
  isValidating: boolean;
  mutate: () => void;
  onVisible: (s: string) => void;
}) {
  const COLLAPSED_COUNT = 5;
  const [expanded, setExpanded] = useState(false);
  const items = expanded ? logs : logs.slice(0, COLLAPSED_COUNT);
  const hiddenCount = logs.length - COLLAPSED_COUNT;
  return (
    <Section
      id="activity_feed"
      title="Activity Feed"
      icon={Activity}
      onVisible={onVisible}
      action={
        <button
          onClick={mutate}
          className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] inline-flex items-center gap-1"
          aria-label="Refresh activity feed"
        >
          <RefreshCw
            className={`size-3 ${isValidating ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      }
    >
      {isLoading && items.length === 0 ? (
        <ul className="space-y-1" aria-busy="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <li
              key={i}
              className="flex items-center gap-3 py-2 border-b last:border-0"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="h-3 w-14 rounded bg-[var(--overlay-soft)] animate-pulse shrink-0" />
              <span className="h-3 w-24 rounded bg-[var(--overlay-soft)] animate-pulse shrink-0" />
              <span className="h-3 flex-1 rounded bg-[var(--overlay-soft)] animate-pulse" />
              <span className="h-4 w-16 rounded-full bg-[var(--overlay-soft)] animate-pulse shrink-0" />
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className="text-[13px] text-[var(--text-muted)]">
          No recent agent activity. The feed will populate as agents process calls, emails, and estimates.
        </p>
      ) : (
        <>
          <ul className="space-y-1">
            {items.map((log, idx) => {
              const target = feedTarget(log);
              return (
                <li
                  key={`${log.agent_id}-${log.created_at}-${idx}`}
                  className="flex items-center gap-3 py-2 border-b last:border-0"
                  style={{ borderColor: "var(--border)" }}
                >
                  <span className="text-[11px] text-[var(--text-muted)] shrink-0 w-14">
                    {relTime(log.created_at)}
                  </span>
                  <span className="text-[13px] text-[var(--text-primary)] font-medium shrink-0 w-24 truncate">
                    {agentDisplayName(log.agent_id)}
                  </span>
                  <span className="text-[13px] text-[var(--text-tertiary)] flex-1 min-w-0 truncate">
                    {log.action}
                    {target ? ` — ${target}` : ""}
                  </span>
                  <StatusBadge status={log.status} />
                </li>
              );
            })}
          </ul>
          {hiddenCount > 0 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              aria-expanded={expanded}
            >
              {expanded ? "Show less" : `View all ${logs.length}`}
            </button>
          )}
        </>
      )}
    </Section>
  );
}

// ── Pipeline Summary ──────────────────────────────────────────────────

type PipelineStats = {
  totalContacts: number | null;
  leadsThisWeek: number | null;
  emailsSent: number | null;
  callsHandled: number | null;
};

function PipelineSummarySection({
  stats,
  onVisible,
}: {
  stats: PipelineStats;
  onVisible: (s: string) => void;
}) {
  const cards = [
    {
      label: "Total Contacts",
      value: stats.totalContacts,
      icon: Users,
      href: "/contacts",
    },
    {
      label: "Leads This Week",
      value: stats.leadsThisWeek,
      icon: Sparkles,
      href: "/contacts",
    },
    {
      label: "Emails Sent",
      value: stats.emailsSent,
      icon: Mail,
      href: "/outreach",
    },
    {
      label: "Calls Handled",
      value: stats.callsHandled,
      icon: Phone,
      href: "/outreach",
    },
  ];

  return (
    <Section
      id="pipeline_summary"
      title="Pipeline Summary"
      icon={BarChart3}
      onVisible={onVisible}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => {
          const display =
            c.value === null || c.value === undefined
              ? "––"
              : c.value.toLocaleString();
          return (
            <Link
              key={c.label}
              href={c.href}
              className="rounded-lg border p-4 transition-colors"
              style={{
                borderColor: "var(--border)",
                background: "var(--overlay-soft)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <c.icon className="size-3.5 text-[var(--text-muted)]" />
                <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wide">
                  {c.label}
                </span>
              </div>
              <p
                className="text-[22px] font-medium leading-none"
                style={{ color: "var(--text-primary)" }}
              >
                {display}
              </p>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}

// ── Value Delivered (ROI strip) ───────────────────────────────────────

const ROI_LABELS = [
  "Hours saved",
  "Cost saved",
  "Revenue influenced",
  "Pipeline pending",
];

function RoiStripSection({
  items,
  onVisible,
}: {
  items: { label: string; value: string }[] | null;
  onVisible: (s: string) => void;
}) {
  const boxes =
    items ?? ROI_LABELS.map((label) => ({ label, value: "––" }));
  return (
    <Section
      id="roi_strip"
      title="Value Delivered"
      icon={TrendingUp}
      onVisible={onVisible}
      action={
        <Link
          href="/dashboard/roi"
          className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        >
          Full ROI
        </Link>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {boxes.map((b) => (
          <div
            key={b.label}
            className="rounded-lg border p-4"
            style={{
              borderColor: "var(--border)",
              background: "var(--overlay-soft)",
            }}
          >
            <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wide">
              {b.label}
            </span>
            <p
              className="text-[22px] font-medium leading-none mt-2"
              style={{ color: "var(--text-primary)" }}
            >
              {b.value}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── Needs Attention ───────────────────────────────────────────────────

function NeedsAttentionSection({
  items,
  onVisible,
}: {
  items: AttentionItem[];
  onVisible: (s: string) => void;
}) {
  return (
    <Section
      id="needs_attention"
      title="Needs Attention"
      icon={AlertTriangle}
      onVisible={onVisible}
      action={
        items.length > 0 ? (
          <span className="text-[11px] text-[var(--text-muted)]">
            {items.length} item{items.length === 1 ? "" : "s"}
          </span>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <p className="text-[13px] text-[var(--text-muted)]">
          Nothing needs attention. Every monitored agent is healthy.
        </p>
      ) : (
        <ul className="space-y-1">
          {items.map((it) => (
            <li
              key={it.agentId}
              className="flex items-center gap-3 py-2 border-b last:border-0"
              style={{ borderColor: "var(--border)" }}
            >
              <StatusDot color={it.color} />
              <span className="text-[13px] text-[var(--text-primary)] font-medium shrink-0 w-28 truncate">
                {it.label}
              </span>
              <span className="text-[13px] text-[var(--text-tertiary)] flex-1 min-w-0 truncate">
                {it.detail}
              </span>
              <span
                className="text-[10px] uppercase tracking-wide shrink-0"
                style={{ color: it.color }}
              >
                {it.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

// ── Workflow History ──────────────────────────────────────────────────

function WorkflowHistorySection({
  files,
  isLoading,
  onVisible,
}: {
  files: SavedFile[];
  isLoading: boolean;
  onVisible: (s: string) => void;
}) {
  return (
    <Section
      id="workflow_history"
      title="Workflow History"
      icon={FileSpreadsheet}
      onVisible={onVisible}
    >
      {isLoading && files.length === 0 ? (
        <div className="space-y-2" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-9 rounded bg-[var(--overlay-soft)] animate-pulse"
            />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div
          className="rounded-md border border-dashed p-6 text-center"
          style={{ borderColor: "var(--border)" }}
        >
          <p className="text-[13px] text-[var(--text-muted)]">
            No workflow files yet. Run a quick action below to generate one.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                className="border-b"
                style={{ borderColor: "var(--border)" }}
              >
                <th className="text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)] pb-2 pr-4">
                  Date
                </th>
                <th className="text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)] pb-2 pr-4">
                  Workflow
                </th>
                <th className="text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)] pb-2 pr-4">
                  Status
                </th>
                <th className="text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)] pb-2">
                  Download
                </th>
              </tr>
            </thead>
            <tbody>
              {files.slice(0, 15).map((f) => (
                <tr
                  key={f.id}
                  className="border-b last:border-0"
                  style={{ borderColor: "var(--border)" }}
                >
                  <td className="py-2.5 pr-4 text-[13px] text-[var(--text-muted)]">
                    {f.created_at
                      ? new Date(f.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : ""}
                  </td>
                  <td className="py-2.5 pr-4 text-[13px] text-[var(--text-primary)] font-medium">
                    {f.workflow || f.file_type || "Workflow"}
                  </td>
                  <td className="py-2.5 pr-4">
                    <StatusBadge status="success" />
                  </td>
                  <td className="py-2.5">
                    <a
                      href={f.file_path}
                      download={f.file_name}
                      className="inline-flex items-center gap-1 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      <Download className="size-3.5" />
                      {f.file_name}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

// ── Quick Actions ─────────────────────────────────────────────────────

function QuickActionsSection({
  onVisible,
}: {
  onVisible: (s: string) => void;
}) {
  return (
    <Section
      id="quick_actions"
      title="Quick Actions"
      icon={Sparkles}
      onVisible={onVisible}
      action={
        <Link
          href="/dashboard/ask-endall"
          className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        >
          Open Ask Endall
        </Link>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {QUICK_ACTIONS.map((action) => {
          const Icon = QUICK_ACTION_ICONS[action.icon] || Sparkles;
          return (
            <Link
              key={action.id}
              href={`/dashboard/ask-endall?action=${action.id}`}
              onClick={() =>
                posthog.capture("command_center_quick_action_clicked", {
                  action_id: action.id,
                })
              }
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors"
              style={{
                borderColor: "var(--border)",
                background: "var(--overlay-soft)",
              }}
            >
              <Icon className="size-4 shrink-0 text-[var(--text-muted)]" />
              <span className="text-[12px] text-[var(--text-primary)] truncate">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────

export default function CommandCenterPage() {
  usePlaceholderAuth();

  const {
    data: logs = [],
    isLoading: logsLoading,
    isValidating,
    mutate,
  } = useAllLogs(50);
  const { data: statuses = {} } = useAllStatuses();
  const { data: performance = {} } = useAllPerformance();
  const { data: rawStats, error: statsError } = useCommandCenterStats();

  const estimatorMetrics = useEstimatorMetrics();
  const roiItems = useRoiStrip();
  const intelFreshness = useIntelFreshness();

  const [files, setFiles] = useState<SavedFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);

  useEffect(() => {
    posthog.capture("command_center_viewed");
  }, []);

  // The bridge endpoint is the only source of truth. When the fetch
  // fails or the tenant is unresolved we keep every card at null so the
  // UI renders muted dashes (never "0", which would silently hide the
  // outage from the contractor).
  const stats: PipelineStats = useMemo(() => {
    if (statsError || !rawStats) {
      return {
        totalContacts: null,
        leadsThisWeek: null,
        emailsSent: null,
        callsHandled: null,
      };
    }
    return {
      totalContacts: rawStats.total_contacts ?? null,
      leadsThisWeek: rawStats.leads_this_week ?? null,
      emailsSent: rawStats.emails_sent_this_week ?? null,
      callsHandled: rawStats.calls_handled_this_week ?? null,
    };
  }, [rawStats, statsError]);

  const needsAttention = useMemo(
    () => deriveNeedsAttention(statuses, logs),
    [statuses, logs]
  );

  const metrics = useMemo(
    () => ({ estimator: estimatorMetrics }),
    [estimatorMetrics]
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/chat/files")
      .then((r) => (r.ok ? r.json() : { files: [] }))
      .then((d) => {
        if (!cancelled) setFiles(d.files || []);
      })
      .catch(() => {
        if (!cancelled) setFiles([]);
      })
      .finally(() => {
        if (!cancelled) setFilesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onSectionVisible = useMemo(
    () => (section: string) => {
      posthog.capture("command_center_section_viewed", { section });
    },
    []
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1
          className="text-[15px] font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          Command Center
        </h1>
        <span className="text-[11px] text-[var(--text-muted)]">
          Live · refreshes every 30s
        </span>
      </div>

      <SystemHealthStrip
        statuses={statuses}
        logs={logs}
        onVisible={onSectionVisible}
      />

      <Section
        id="agents"
        title="Agents"
        icon={LayoutGrid}
        onVisible={onSectionVisible}
      >
        <AgentCardsGrid
          logs={logs}
          performance={performance}
          statuses={statuses}
          metrics={metrics}
          freshness={intelFreshness}
        />
      </Section>

      <PipelineSummarySection stats={stats} onVisible={onSectionVisible} />

      <RoiStripSection items={roiItems} onVisible={onSectionVisible} />

      <ActivityFeedSection
        logs={logs}
        isLoading={logsLoading}
        isValidating={isValidating}
        mutate={() => mutate()}
        onVisible={onSectionVisible}
      />

      <NeedsAttentionSection
        items={needsAttention}
        onVisible={onSectionVisible}
      />

      <WorkflowHistorySection
        files={files}
        isLoading={filesLoading}
        onVisible={onSectionVisible}
      />

      <QuickActionsSection onVisible={onSectionVisible} />
    </div>
  );
}
