"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Calendar, Clock, MapPin, FileSpreadsheet } from "lucide-react";
import { posthog } from "@/lib/posthog";
import {
  JobStatusControl,
  type JobStatus,
} from "@/components/invoice-review/JobStatusControl";
import {
  InvoiceModal,
  type InvoiceJobSummary,
} from "@/components/invoice-review/InvoiceModal";

// Wire-shape from GET /api/jobs/unified (bridge merges voice_jobs + jobs).
// See PR #84: dedup is on (tenant_id, normalized_phone, scheduled_date::date)
// and is handled bridge-side, so the frontend renders rows verbatim.
type UnifiedJobSource = "jobs" | "voice_jobs";

type UnifiedJob = {
  id: string;
  source: UnifiedJobSource;
  source_id: string;
  title: string | null;
  status: string | null;
  scheduled_at: string | null;
  address: string | null;
  customer_id: string | null;
  tenant_id: string;
  created_at: string | null;
};

type DispatchJob = {
  id: string;
  source: UnifiedJobSource;
  title: string | null;
  scheduled_at: string | null;
  address: string | null;
  status: JobStatus;
  customer_id: string | null;
};

const REFRESH_MS = 30_000;

const KNOWN_STATUSES: ReadonlySet<JobStatus> = new Set([
  "pending",
  "confirmed",
  "completed",
  "cancelled",
]);

function normalizeStatus(raw: string | null): JobStatus {
  if (raw && KNOWN_STATUSES.has(raw as JobStatus)) return raw as JobStatus;
  return "pending";
}

function toDispatchJob(row: UnifiedJob): DispatchJob {
  return {
    id: row.id,
    source: row.source,
    title: row.title,
    scheduled_at: row.scheduled_at,
    address: row.address,
    status: normalizeStatus(row.status),
    customer_id: row.customer_id,
  };
}

async function fetcher(url: string): Promise<UnifiedJob[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`jobs unified ${res.status}`);
  const body = await res.json();
  // Defensive: accept either a bare array or a { jobs: [...] } envelope so a
  // future bridge envelope change does not silently blank the UI.
  if (Array.isArray(body)) return body as UnifiedJob[];
  if (body && Array.isArray(body.jobs)) return body.jobs as UnifiedJob[];
  return [];
}

function isToday(iso: string | null): boolean {
  if (!iso) return false;
  const today = new Date();
  const key = today.toISOString().slice(0, 10);
  return iso.slice(0, 10) === key;
}

function isThisWeek(iso: string | null): boolean {
  if (!iso) return false;
  const now = new Date();
  const target = new Date(iso);
  const diffDays = Math.floor(
    (target.getTime() - now.setHours(0, 0, 0, 0)) / 86_400_000
  );
  return diffDays > 0 && diffDays <= 7;
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function SourceBadge({ source }: { source: UnifiedJobSource }) {
  const label = source === "voice_jobs" ? "Voice" : "Jobs";
  const colors =
    source === "voice_jobs"
      ? {
          bg: "rgba(168,85,247,0.12)",
          text: "#a855f7",
          border: "rgba(168,85,247,0.3)",
        }
      : {
          bg: "rgba(59,130,246,0.12)",
          text: "#3b82f6",
          border: "rgba(59,130,246,0.3)",
        };
  return (
    <span
      className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium"
      style={{
        background: colors.bg,
        color: colors.text,
        borderColor: colors.border,
      }}
      data-testid={`source-badge-${source}`}
    >
      {label}
    </span>
  );
}

export default function DispatchPage() {
  const { data, mutate } = useSWR<UnifiedJob[]>(
    "/api/jobs/unified",
    fetcher,
    { refreshInterval: REFRESH_MS, fallbackData: [] }
  );

  const [jobs, setJobs] = useState<DispatchJob[]>([]);
  const [invoiceJob, setInvoiceJob] = useState<InvoiceJobSummary | null>(null);

  useEffect(() => {
    posthog.capture("invoice_review_page_viewed");
  }, []);

  useEffect(() => {
    if (data) setJobs(data.map(toDispatchJob));
  }, [data]);

  const today = useMemo(() => jobs.filter((j) => isToday(j.scheduled_at)), [jobs]);
  const week = useMemo(
    () => jobs.filter((j) => isThisWeek(j.scheduled_at)),
    [jobs]
  );

  function updateLocalStatus(jobId: string, next: JobStatus) {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: next } : j))
    );
    // Revalidate SWR after a short delay so the list reflects server state.
    setTimeout(() => mutate(), 250);
  }

  function renderRow(job: DispatchJob) {
    const completed = job.status === "completed";
    const titleText = job.title || "Unspecified job";
    return (
      <li
        key={job.id}
        className="flex items-center gap-3 py-2.5 border-b last:border-0"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="text-[11px] text-[var(--text-muted)] w-16 shrink-0">
          <Clock className="inline size-3 mr-1" />
          {formatTime(job.scheduled_at)}
        </span>
        <SourceBadge source={job.source} />
        <span className="text-[13px] text-[var(--text-primary)] font-medium flex-1 min-w-0 truncate">
          {titleText}
          {job.address ? (
            <span className="ml-2 text-[var(--text-muted)] font-normal">
              <MapPin className="inline size-3 mx-0.5" />
              {job.address}
            </span>
          ) : null}
        </span>
        <JobStatusControl
          jobId={job.id}
          status={job.status}
          onStatusChange={(next) => updateLocalStatus(job.id, next)}
        />
        {completed ? (
          <button
            type="button"
            aria-label={`Generate invoice for ${job.title || job.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setInvoiceJob({
                job_id: job.id,
                caller_name: job.title,
                job_type: null,
                preferred_date: job.scheduled_at,
              });
            }}
            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px]"
            style={{
              borderColor: "var(--border)",
              background: "var(--overlay-soft)",
              color: "var(--text-primary)",
            }}
          >
            <FileSpreadsheet className="size-3" />
            Generate invoice
          </button>
        ) : null}
      </li>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1
          className="text-[15px] font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          Dispatch
        </h1>
        <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
          Every job Front Desk has booked, in one place. Update status here
          and the rest of the system follows.
        </p>
      </div>

      <section
        className="rounded-lg border p-4"
        style={{ borderColor: "var(--border)", background: "var(--overlay-weak)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="size-4" />
          <h2 className="text-[13px] font-medium text-[var(--text-primary)]">
            Today
          </h2>
        </div>
        {today.length === 0 ? (
          <p className="text-[13px] text-[var(--text-muted)]">
            Nothing scheduled for today.
          </p>
        ) : (
          <ul>{today.map(renderRow)}</ul>
        )}
      </section>

      <section
        className="rounded-lg border p-4"
        style={{ borderColor: "var(--border)", background: "var(--overlay-weak)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="size-4" />
          <h2 className="text-[13px] font-medium text-[var(--text-primary)]">
            This week
          </h2>
        </div>
        {week.length === 0 ? (
          <p className="text-[13px] text-[var(--text-muted)]">
            No jobs scheduled. When Front Desk books a job, it lands here.
          </p>
        ) : (
          <ul>{week.map(renderRow)}</ul>
        )}
      </section>

      {invoiceJob ? (
        <InvoiceModal
          job={invoiceJob}
          open={true}
          onClose={() => setInvoiceJob(null)}
        />
      ) : null}
    </div>
  );
}
