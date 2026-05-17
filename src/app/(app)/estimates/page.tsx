"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";

type EstimateRow = {
  id: string;
  customer_name: string | null;
  grand_total: number | null;
  status: string;
  created_at: string;
};

type FetchState =
  | { kind: "loading" }
  | { kind: "ready"; rows: EstimateRow[] }
  | { kind: "error"; message: string };

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
      year: "numeric",
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

function TableSkeleton() {
  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      <div className="flex flex-col">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-12 border-b border-[var(--border)] last:border-b-0 bg-[var(--overlay-weak)]"
            style={{
              animation: "estimate-pulse 1.5s ease-in-out infinite",
              animationDelay: `${i * 80}ms`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes estimate-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>
    </div>
  );
}

const STATUS_FILTERS = ["all", "draft", "sent", "approved"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export default function EstimatesPage() {
  const router = useRouter();
  const [state, setState] = useState<FetchState>({ kind: "loading" });
  const [filter, setFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    (async () => {
      const { data, error } = await supabase
        .from("estimates")
        .select("id, customer_name, grand_total, status, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (cancelled) return;

      if (error) {
        setState({
          kind: "error",
          message: "Could not load estimates. Try refreshing the page.",
        });
        return;
      }

      setState({ kind: "ready", rows: (data ?? []) as EstimateRow[] });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-[15px] font-medium text-[var(--text-primary)]">
          Estimates
        </h1>
        {state.kind === "ready" && state.rows.length > 0 && (
          <div className="flex items-center gap-1" role="group" aria-label="Filter by status">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={`text-[12px] capitalize rounded-md px-2.5 py-1 transition-colors ${
                  filter === f
                    ? "bg-[var(--overlay-medium)] text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--overlay-weak)]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {state.kind === "loading" ? (
        <TableSkeleton />
      ) : state.kind === "error" ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-6">
          <p
            role="alert"
            data-testid="estimates-error"
            className="text-[13px] text-red-400"
          >
            {state.message}
          </p>
        </div>
      ) : state.rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-[13px] text-[var(--text-tertiary)] mb-1">
            No estimates yet.
          </p>
          <p className="text-[12px] text-[var(--text-muted)] max-w-md">
            Inbound calls and outreach replies will populate this list
            automatically.
          </p>
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[var(--border)] hover:bg-transparent">
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                  Customer
                </TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)] text-right">
                  Amount
                </TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                  Status
                </TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)] hidden md:table-cell">
                  Created
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.rows.filter(
                (r) => filter === "all" || r.status === filter,
              ).length === 0 ? (
                <TableRow className="border-[var(--border)] hover:bg-transparent">
                  <TableCell
                    colSpan={4}
                    className="text-[13px] text-[var(--text-muted)] py-6 text-center"
                  >
                    No {filter} estimates.
                  </TableCell>
                </TableRow>
              ) : (
                state.rows
                  .filter((r) => filter === "all" || r.status === filter)
                  .map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => router.push(`/estimates/${row.id}`)}
                  className="cursor-pointer border-[var(--border)] hover:bg-[var(--overlay-weak)] transition-colors"
                >
                  <TableCell className="text-[13px] text-[var(--text-primary)] font-medium py-2.5">
                    {row.customer_name?.trim() ? row.customer_name : "–"}
                  </TableCell>
                  <TableCell className="text-[13px] text-[var(--text-primary)] py-2.5 text-right tabular-nums">
                    {formatUSD(row.grand_total)}
                  </TableCell>
                  <TableCell className="py-2.5">
                    <Badge
                      variant="outline"
                      className={`text-[11px] font-normal capitalize ${statusColor(row.status)}`}
                    >
                      {statusLabel(row.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[13px] text-[var(--text-muted)] py-2.5 hidden md:table-cell">
                    {formatDate(row.created_at)}
                  </TableCell>
                </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
