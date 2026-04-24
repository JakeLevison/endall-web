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

type DispatchJob = {
  id: string;
  caller_name: string | null;
  caller_phone: string | null;
  job_type: string | null;
  preferred_date: string | null;
  address: string | null;
  status: JobStatus;
  notes: string | null;
};

type DispatchResponse = {
  jobs: DispatchJob[];
  grouped_by_date: Record<string, string[]>;
};

const REFRESH_MS = 30_000;

async function fetcher(url: string): Promise<DispatchResponse> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`dispatch ${res.status}`);
  return res.json();
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

export default function DispatchPage() {
  const { data, mutate } = useSWR<DispatchResponse>(
    "/api/jobs/upcoming?days=14",
    fetcher,
    { refreshInterval: REFRESH_MS, fallbackData: { jobs: [], grouped_by_date: {} } }
  );

  const [jobs, setJobs] = useState<DispatchJob[]>([]);
  const [invoiceJob, setInvoiceJob] = useState<InvoiceJobSummary | null>(null);

  useEffect(() => {
    posthog.capture("invoice_review_page_viewed");
  }, []);

  useEffect(() => {
    if (data?.jobs) setJobs(data.jobs);
  }, [data]);

  const today = useMemo(() => jobs.filter((j) => isToday(j.preferred_date)), [jobs]);
  const week = useMemo(
    () => jobs.filter((j) => isThisWeek(j.preferred_date)),
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
    return (
      <li
        key={job.id}
        className="flex items-center gap-3 py-2.5 border-b last:border-0"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="text-[11px] text-[var(--text-muted)] w-16 shrink-0">
          <Clock className="inline size-3 mr-1" />
          {formatTime(job.preferred_date)}
        </span>
        <span className="text-[13px] text-[var(--text-primary)] font-medium w-32 truncate">
          {job.caller_name || "Unknown caller"}
        </span>
        <span className="text-[12px] text-[var(--text-tertiary)] flex-1 min-w-0 truncate">
          {job.job_type || "Unspecified job"}
          {job.address ? (
            <span className="ml-2 text-[var(--text-muted)]">
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
            aria-label={`Generate invoice for ${job.caller_name || job.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setInvoiceJob({
                job_id: job.id,
                caller_name: job.caller_name,
                job_type: job.job_type,
                preferred_date: job.preferred_date,
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
