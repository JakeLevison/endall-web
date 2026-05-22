"use client";

import { useState, useRef } from "react";
import useSWR from "swr";
import {
  RefreshCw,
  Send,
  ExternalLink,
  AlertTriangle,
  Globe,
  Scale,
  TrendingUp,
  Lightbulb,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { posthog } from "@/lib/posthog";

// ── types ────────────────────────────────────────────────────────────

type Urgency = "action" | "awareness" | "opportunity";

type IntelItem = {
  title: string;
  source?: string;
  summary: string;
  urgency?: string;
  date_found?: string;
  relevance_to_contractor?: string;
};

type CategoryData = {
  summary?: string;
  last_updated?: string;
  [key: string]: string | IntelItem[] | undefined;
};

type CategoryRow = {
  id: string;
  category: "regulations" | "economy" | "opportunities" | string;
  data: CategoryData;
  last_updated?: string;
};

type MarketResponse = {
  rows: CategoryRow[];
  total: number;
  researched_at?: string;
};

// ── helpers ──────────────────────────────────────────────────────────

const fetcher = async (url: string): Promise<MarketResponse> => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  return res.json();
};

function urgencyKey(u: string | undefined): Urgency | "other" {
  const k = (u || "").toLowerCase();
  if (k === "action" || k === "awareness" || k === "opportunity") return k;
  return "other";
}

function urgencyBadge(u: string | undefined) {
  const k = urgencyKey(u);
  const cls: Record<typeof k, string> = {
    action: "bg-red-500/10 text-red-400 border-red-500/20",
    awareness: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    opportunity: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    other: "bg-zinc-500/10 text-[var(--text-tertiary)] border-zinc-500/20",
  };
  const label =
    k === "other" ? u || "info" : k.charAt(0).toUpperCase() + k.slice(1);
  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-normal uppercase tracking-wide ${cls[k]}`}
    >
      {label}
    </Badge>
  );
}

function formatRelative(iso: string | undefined): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function isIntelItemArray(v: unknown): v is IntelItem[] {
  if (!Array.isArray(v)) return false;
  if (v.length === 0) return true;
  const first = v[0];
  return (
    typeof first === "object" &&
    first !== null &&
    typeof (first as IntelItem).title === "string" &&
    typeof (first as IntelItem).summary === "string"
  );
}

function humanizeSubcategory(key: string): string {
  return key
    .split("_")
    .map((w, i) =>
      i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w,
    )
    .join(" ");
}

function categoryMeta(category: string): {
  label: string;
  icon: React.ElementType;
  description: string;
} {
  switch (category) {
    case "regulations":
      return {
        label: "Regulations & incentives",
        icon: Scale,
        description: "Code updates, licensing, mandates, rebates.",
      };
    case "economy":
      return {
        label: "Economy & supply chain",
        icon: TrendingUp,
        description: "Labor, materials, major projects, construction starts.",
      };
    case "opportunities":
      return {
        label: "Opportunity signals",
        icon: Lightbulb,
        description: "Bid opportunities, tech trends, utility rates.",
      };
    default:
      return {
        label: humanizeSubcategory(category),
        icon: Globe,
        description: "",
      };
  }
}

// urgency sort order: action first, then opportunity, then awareness
function urgencyWeight(u: string | undefined): number {
  switch (urgencyKey(u)) {
    case "action":
      return 0;
    case "opportunity":
      return 1;
    case "awareness":
      return 2;
    default:
      return 3;
  }
}

// ── subcomponents ────────────────────────────────────────────────────

function ItemCard({ item }: { item: IntelItem }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--bg)] p-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-[var(--text-primary)] leading-snug">
            {item.title}
          </p>
          {item.date_found && (
            <p className="text-[11px] text-[var(--text-faint)] mt-0.5">
              {item.date_found}
            </p>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {urgencyBadge(item.urgency)}
        </div>
      </div>
      <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
        {item.summary}
      </p>
      {item.relevance_to_contractor && (
        <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed border-l-2 border-[var(--overlay-medium)] pl-2.5">
          {item.relevance_to_contractor}
        </p>
      )}
      {item.source && (
        <div>
          {item.source.startsWith("http") ? (
            <a
              href={item.source}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            >
              Source
              <ExternalLink className="size-2.5" />
            </a>
          ) : (
            <span className="text-[11px] text-[var(--text-faint)]">
              Source: {item.source}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function CategorySection({ row }: { row: CategoryRow }) {
  const meta = categoryMeta(row.category);
  const Icon = meta.icon;
  const lastUpdated = row.data.last_updated || row.last_updated;

  // Collect all subcategory item lists, preserving insertion order.
  const subcategories: { key: string; items: IntelItem[] }[] = [];
  for (const [key, value] of Object.entries(row.data)) {
    if (key === "summary" || key === "last_updated") continue;
    if (isIntelItemArray(value) && value.length > 0) {
      const sorted = [...value].sort(
        (a, b) => urgencyWeight(a.urgency) - urgencyWeight(b.urgency),
      );
      subcategories.push({ key, items: sorted });
    }
  }

  if (!row.data.summary && subcategories.length === 0) return null;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--overlay-weak)] p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5 shrink-0 size-7 rounded-md bg-[var(--overlay-soft)] flex items-center justify-center text-[var(--text-muted)]">
            <Icon className="size-3.5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[13px] font-medium text-[var(--text-primary)]">
              {meta.label}
            </h2>
            {meta.description && (
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                {meta.description}
              </p>
            )}
          </div>
        </div>
        {lastUpdated && (
          <span className="text-[11px] text-[var(--text-faint)] shrink-0">
            Updated {formatRelative(lastUpdated)}
          </span>
        )}
      </div>

      {row.data.summary && (
        <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
          {row.data.summary}
        </p>
      )}

      {subcategories.map(({ key, items }) => (
        <div key={key}>
          <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-2">
            {humanizeSubcategory(key)}{" "}
            <span className="text-[var(--text-faint)] normal-case">
              ({items.length})
            </span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {items.map((item, i) => (
              <ItemCard key={`${key}-${i}`} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── page ─────────────────────────────────────────────────────────────

export default function MarketIntelPage() {
  const { data, error, isLoading, mutate } = useSWR<MarketResponse>(
    "/api/intelligence/market-intel",
    fetcher,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  const onRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    posthog.capture("market_intel_refresh_clicked");
    try {
      const res = await fetch("/api/intelligence/market-intel/refresh", {
        method: "POST",
      });
      if (res.ok || res.status === 202) {
        showToast("Refresh queued. New intel will appear shortly.");
        setTimeout(() => mutate(), 8000);
      } else {
        showToast("Refresh failed. Try again.");
      }
    } catch {
      showToast("Refresh failed. Try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const onSendBrief = async () => {
    if (sending) return;
    setSending(true);
    posthog.capture("market_intel_brief_clicked");
    try {
      const res = await fetch("/api/intelligence/market-brief/send", {
        method: "POST",
      });
      if (res.ok) {
        const body = await res.json().catch(() => ({}));
        const recipient = body?.recipient ? ` to ${body.recipient}` : "";
        showToast(`Brief sent${recipient}.`);
      } else {
        showToast("Send failed. Try again.");
      }
    } catch {
      showToast("Send failed. Try again.");
    } finally {
      setSending(false);
    }
  };

  const rows = data?.rows ?? [];
  // Order: regulations, economy, opportunities; unknowns at the end.
  const orderIndex = (c: string) =>
    c === "regulations" ? 0 : c === "economy" ? 1 : c === "opportunities" ? 2 : 99;
  const orderedRows = [...rows].sort(
    (a, b) => orderIndex(a.category) - orderIndex(b.category),
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>
            Market intel
          </h1>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
            Regulations, supply chain, and opportunity signals in your metro.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh intel"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onSendBrief}
            disabled={sending || !rows.length}
          >
            <Send />
            {sending ? "Sending..." : "Send brief"}
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-muted)]">
        <span>Urgency:</span>
        {urgencyBadge("action")}
        <span className="text-[var(--text-faint)]">time-sensitive</span>
        <span className="text-[var(--text-faint)]">·</span>
        {urgencyBadge("awareness")}
        <span className="text-[var(--text-faint)]">good to know</span>
        <span className="text-[var(--text-faint)]">·</span>
        {urgencyBadge("opportunity")}
        <span className="text-[var(--text-faint)]">upside</span>
      </div>

      {isLoading && (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-lg bg-[var(--overlay-soft)] animate-pulse"
            />
          ))}
        </div>
      )}

      {error && !isLoading && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="size-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] text-[var(--text-primary)]">
              Could not load market intel.
            </p>
            <p className="text-[12px] text-[var(--text-muted)] mt-1">
              Try the refresh button, or check back in a moment.
            </p>
          </div>
        </div>
      )}

      {!isLoading && !error && rows.length === 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--overlay-weak)] p-8 text-center">
          <Globe className="size-6 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-[13px] text-[var(--text-primary)] mb-1">
            No market intel yet.
          </p>
          <p className="text-[12px] text-[var(--text-muted)]">
            Click Refresh intel to kick off the first run.
          </p>
        </div>
      )}

      {orderedRows.map((row) => (
        <CategorySection key={row.id} row={row} />
      ))}

      {toast && (
        <div
          role="status"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1000,
            background: "var(--surface-hover)",
            border: "1px solid var(--overlay-medium)",
            borderRadius: 12,
            padding: "12px 18px",
            color: "var(--text-primary)",
            fontSize: 13,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            maxWidth: 360,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
