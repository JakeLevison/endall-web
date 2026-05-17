"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

type EstimateRow = {
  id: string;
  estimate_number: string | null;
  customer_name: string | null;
  project_description: string | null;
  grand_total: number | null;
  status: string;
  created_at: string;
};

function formatUSD(n: number | null): string {
  if (n == null) return "–";
  const isWhole = Number.isInteger(n);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

const statusColor = (status: string) => {
  switch (status) {
    case "approved":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "sent":
    case "ready_for_review":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "draft":
      return "bg-zinc-500/10 text-[var(--text-tertiary)] border-zinc-500/20";
    case "rejected":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    case "expired":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    default:
      return "bg-zinc-500/10 text-[var(--text-tertiary)] border-zinc-500/20";
  }
};

const statusLabel = (status: string) => status.replace(/_/g, " ");

export default function RecentEstimates() {
  const [rows, setRows] = useState<EstimateRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchEstimates() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("estimates")
          .select(
            "id, estimate_number, customer_name, project_description, grand_total, status, created_at",
          )
          .order("created_at", { ascending: false })
          .limit(5);
        if (cancelled) return;
        setRows((data ?? []) as EstimateRow[]);
      } catch {
        // Estimates unavailable. Render the empty state, never a broken card.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchEstimates();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--overlay-weak)] p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[13px] font-medium text-[var(--text-primary)]">
          Recent Estimates
        </h2>
        <Link
          href="/estimates"
          className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          View all
        </Link>
      </div>

      {loading ? (
        <p className="text-[13px] text-[var(--text-muted)]">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-[13px] text-[var(--text-muted)]">
          No estimates yet. Inbound calls populate this automatically.
        </p>
      ) : (
        <div className="space-y-0.5">
          {rows.map((e) => (
            <Link
              key={e.id}
              href={`/estimates/${e.id}`}
              className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-md hover:bg-[var(--overlay-soft)] transition-colors"
            >
              <div className="size-8 rounded-md bg-[var(--overlay-soft)] flex items-center justify-center shrink-0">
                <FileText className="size-3.5 text-[var(--text-muted)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-[var(--text-primary)] truncate">
                  {e.customer_name?.trim() ? e.customer_name : "Unnamed customer"}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-[var(--text-muted)] truncate">
                    {e.project_description?.trim()
                      ? e.project_description
                      : e.estimate_number || "Estimate"}
                  </span>
                  <span className="text-[11px] text-[var(--text-faint)]">·</span>
                  <span className="text-[11px] text-[var(--text-faint)] shrink-0">
                    {formatDate(e.created_at)}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[13px] text-[var(--text-secondary)] font-medium tabular-nums">
                  {formatUSD(e.grand_total)}
                </p>
                <Badge
                  variant="outline"
                  className={`mt-0.5 text-[11px] font-normal capitalize ${statusColor(e.status)}`}
                >
                  {statusLabel(e.status)}
                </Badge>
              </div>
              <ChevronRight className="size-3 text-[var(--text-faint)] shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
