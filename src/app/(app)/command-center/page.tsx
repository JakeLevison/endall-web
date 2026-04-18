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
} from "lucide-react";
import { useAllLogs, type AgentLog } from "@/lib/ops-api";
import { QUICK_ACTIONS, type SavedFile } from "@/hooks/useChat";
import { createClient } from "@/lib/supabase/client";
import { posthog } from "@/lib/posthog";
import { agentDisplayName, isSuccessStatus } from "@/lib/command-center";

// TODO: wire real auth -- auth wiring is out of scope through P15b.
// For now, middleware allows unauthenticated access. When auth lands,
// re-enable the redirect in src/middleware.ts and gate this route there.
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

// ── Activity Feed ─────────────────────────────────────────────────────

function ActivityFeedSection({
  logs,
  isValidating,
  mutate,
  onVisible,
}: {
  logs: AgentLog[];
  isValidating: boolean;
  mutate: () => void;
  onVisible: (s: string) => void;
}) {
  const items = logs.slice(0, 20);
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
      {items.length === 0 ? (
        <p className="text-[13px] text-[var(--text-muted)]">
          No recent agent activity.
        </p>
      ) : (
        <ul className="space-y-1">
          {items.map((log, idx) => (
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
                {log.company_name ? ` — ${log.company_name}` : ""}
              </span>
              <StatusBadge status={log.status} />
            </li>
          ))}
        </ul>
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
              ? "\u2013\u2013"
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

// ── Workflow History ──────────────────────────────────────────────────

function WorkflowHistorySection({
  files,
  onVisible,
}: {
  files: SavedFile[];
  onVisible: (s: string) => void;
}) {
  return (
    <Section
      id="workflow_history"
      title="Workflow History"
      icon={FileSpreadsheet}
      onVisible={onVisible}
    >
      {files.length === 0 ? (
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
    isValidating,
    mutate,
  } = useAllLogs(50);

  const [stats, setStats] = useState<PipelineStats>({
    totalContacts: null,
    leadsThisWeek: null,
    emailsSent: null,
    callsHandled: null,
  });
  const [files, setFiles] = useState<SavedFile[]>([]);

  useEffect(() => {
    posthog.capture("command_center_viewed");
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      try {
        const contactsRes = await supabase
          .from("contacts")
          .select("id", { count: "exact", head: true });
        if (!cancelled) {
          setStats((prev) => ({
            ...prev,
            totalContacts: contactsRes.count ?? 0,
          }));
        }
      } catch {
        // supabase unavailable -- leave as null to show stub
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // TODO: wire bridge endpoint for leads_this_week / emails_sent /
  // calls_handled. The ops-api bridge currently exposes /api/agent-logs,
  // /api/agent-performance, /api/agent-status. Until a dedicated
  // pipeline-summary endpoint exists, derive what we can from logs.
  useEffect(() => {
    if (!logs.length) return;
    const weekAgo = Date.now() - 7 * 86_400_000;
    const recent = logs.filter(
      (l) => new Date(l.created_at).getTime() >= weekAgo
    );
    const emails = recent.filter(
      (l) => l.agent_id === "email" || l.agent_id === "email-001"
    ).length;
    const calls = recent.filter(
      (l) => l.agent_id === "front_desk" || l.agent_id === "fr-001"
    ).length;
    const leads = recent.filter((l) =>
      (l.action || "").toLowerCase().includes("qualif")
    ).length;
    setStats((prev) => ({
      ...prev,
      leadsThisWeek: leads,
      emailsSent: emails,
      callsHandled: calls,
    }));
  }, [logs]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/chat/files")
      .then((r) => (r.ok ? r.json() : { files: [] }))
      .then((d) => {
        if (!cancelled) setFiles(d.files || []);
      })
      .catch(() => {
        if (!cancelled) setFiles([]);
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

      <ActivityFeedSection
        logs={logs}
        isValidating={isValidating}
        mutate={() => mutate()}
        onVisible={onSectionVisible}
      />

      <PipelineSummarySection stats={stats} onVisible={onSectionVisible} />

      <WorkflowHistorySection files={files} onVisible={onSectionVisible} />

      <QuickActionsSection onVisible={onSectionVisible} />
    </div>
  );
}
