"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  RefreshCw,
  Send,
  Building2,
  Star,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Globe,
  DollarSign,
  Briefcase,
  ExternalLink,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { posthog } from "@/lib/posthog";

// ── types ────────────────────────────────────────────────────────────

type ReviewThemes = {
  positive?: string[];
  negative?: string[];
};

type CompetitorData = {
  company_name?: string;
  metro?: string;
  trade?: string;
  website?: string;
  services?: string[];
  strengths?: string[];
  weaknesses?: string[];
  recent_wins?: string[];
  seo_signals?: string;
  last_updated?: string;
  review_count?: number | null;
  review_trend?: string;
  threat_level?: string;
  google_rating?: number;
  review_rating?: number;
  review_themes?: ReviewThemes;
  certifications?: string[];
  hiring_signals?: string;
  press_mentions?: string[];
  market_position?: string;
  pricing_signals?: string[];
  website_quality?: string;
  years_in_business?: string | number;
  google_review_count?: number | null;
  specialization_gaps?: string[];
};

type SoftwarePlatform = {
  name: string;
  notes?: string;
  funding_or_ma?: string[];
  pricing_changes?: string[];
  recent_launches?: string[];
  sentiment_shift?: string;
};

type SoftwareLandscape = {
  summary?: string;
  platforms?: SoftwarePlatform[];
  last_updated?: string;
};

type MarketMovements = {
  summary?: string;
  new_entrants?: string[];
  press_mentions?: string[];
  mergers_and_acquisitions?: string[];
  last_updated?: string;
};

type IntelRow = {
  id: string;
  competitor_name: string;
  data: CompetitorData | SoftwareLandscape | MarketMovements;
  researched_at?: string;
};

type IntelResponse = {
  competitors: IntelRow[];
  total: number;
};

// ── helpers ──────────────────────────────────────────────────────────

const fetcher = async (url: string): Promise<IntelResponse> => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const err = new Error(`fetch failed: ${res.status}`);
    throw err;
  }
  return res.json();
};

function threatColor(level: string | undefined): string {
  switch ((level || "").toLowerCase()) {
    case "high":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    case "medium":
    case "moderate":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "low":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    default:
      return "bg-zinc-500/10 text-[var(--text-tertiary)] border-zinc-500/20";
  }
}

function sentimentIcon(shift: string | undefined) {
  switch ((shift || "").toLowerCase()) {
    case "rising":
    case "improving":
      return <TrendingUp className="size-3 text-emerald-400" />;
    case "declining":
    case "falling":
      return <TrendingDown className="size-3 text-red-400" />;
    default:
      return <Minus className="size-3 text-[var(--text-muted)]" />;
  }
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

function isSoftwareRow(row: IntelRow): row is IntelRow & { data: SoftwareLandscape } {
  return row.competitor_name === "SOFTWARE_LANDSCAPE";
}

function isMovementsRow(row: IntelRow): row is IntelRow & { data: MarketMovements } {
  return row.competitor_name === "MARKET_MOVEMENTS";
}

// ── subcomponents ────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[13px] font-medium text-[var(--text-primary)] mb-4">
      {children}
    </h2>
  );
}

function ChipList({ items, tone = "neutral" }: { items: string[]; tone?: "neutral" | "positive" | "negative" }) {
  if (!items.length) return null;
  const cls =
    tone === "positive"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : tone === "negative"
        ? "bg-red-500/10 text-red-400 border-red-500/20"
        : "bg-[var(--overlay-soft)] text-[var(--text-tertiary)] border-[var(--border)]";
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <span
          key={`${item}-${i}`}
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${cls}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function CompetitorCard({ row }: { row: IntelRow & { data: CompetitorData } }) {
  const d = row.data;
  const name = d.company_name || row.competitor_name;
  const rating = d.google_rating ?? d.review_rating;
  const reviewCount = d.google_review_count ?? d.review_count;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--overlay-weak)] p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[14px] font-medium text-[var(--text-primary)] truncate">
              {name}
            </h3>
            {d.threat_level && (
              <Badge
                variant="outline"
                className={`text-[11px] font-normal ${threatColor(d.threat_level)}`}
              >
                {d.threat_level} threat
              </Badge>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
            {d.metro && <span>{d.metro}</span>}
            {d.metro && d.trade && <span className="text-[var(--text-faint)]">·</span>}
            {d.trade && <span>{d.trade}</span>}
            {d.years_in_business && (
              <>
                <span className="text-[var(--text-faint)]">·</span>
                <span>{d.years_in_business} yrs</span>
              </>
            )}
          </div>
        </div>
        {d.website && (
          <a
            href={d.website.startsWith("http") ? d.website : `https://${d.website}`}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] flex items-center gap-1 shrink-0"
          >
            <Globe className="size-3" />
            site
            <ExternalLink className="size-2.5" />
          </a>
        )}
      </div>

      {/* Reviews / rating */}
      {(rating || reviewCount) && (
        <div className="flex items-center gap-3 text-[12px]">
          {rating !== undefined && rating !== null && (
            <div className="flex items-center gap-1 text-[var(--text-secondary)]">
              <Star className="size-3 text-amber-400" />
              <span className="font-medium">{rating}</span>
            </div>
          )}
          {reviewCount !== undefined && reviewCount !== null && (
            <span className="text-[var(--text-muted)]">
              {reviewCount.toLocaleString()} reviews
            </span>
          )}
          {d.review_trend && (
            <span className="text-[var(--text-muted)] capitalize">
              · trend {d.review_trend}
            </span>
          )}
        </div>
      )}

      {/* Services */}
      {d.services && d.services.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
            Services
          </p>
          <ChipList items={d.services} />
        </div>
      )}

      {/* Review themes */}
      {d.review_themes && (d.review_themes.positive?.length || d.review_themes.negative?.length) && (
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            Review themes
          </p>
          {d.review_themes.positive && d.review_themes.positive.length > 0 && (
            <ChipList items={d.review_themes.positive} tone="positive" />
          )}
          {d.review_themes.negative && d.review_themes.negative.length > 0 && (
            <ChipList items={d.review_themes.negative} tone="negative" />
          )}
        </div>
      )}

      {/* Pricing */}
      {d.pricing_signals && d.pricing_signals.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5 flex items-center gap-1">
            <DollarSign className="size-3" />
            Pricing intel
          </p>
          <ul className="space-y-1">
            {d.pricing_signals.map((p, i) => (
              <li key={i} className="text-[12px] text-[var(--text-tertiary)]">
                · {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Hiring */}
      {d.hiring_signals && (
        <div>
          <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5 flex items-center gap-1">
            <Users className="size-3" />
            Hiring
          </p>
          <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
            {d.hiring_signals}
          </p>
        </div>
      )}

      {/* SEO */}
      {d.seo_signals && (
        <div>
          <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
            SEO presence
          </p>
          <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
            {d.seo_signals}
          </p>
        </div>
      )}

      {/* Strengths / Weaknesses */}
      {((d.strengths && d.strengths.length > 0) || (d.weaknesses && d.weaknesses.length > 0)) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--border)]">
          {d.strengths && d.strengths.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
                Strengths
              </p>
              <ul className="space-y-1">
                {d.strengths.map((s, i) => (
                  <li key={i} className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
                    · {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {d.weaknesses && d.weaknesses.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
                Weaknesses
              </p>
              <ul className="space-y-1">
                {d.weaknesses.map((w, i) => (
                  <li key={i} className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
                    · {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Specialization gaps */}
      {d.specialization_gaps && d.specialization_gaps.length > 0 && (
        <div className="pt-2 border-t border-[var(--border)]">
          <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5 flex items-center gap-1">
            <Sparkles className="size-3" />
            Opening for us
          </p>
          <ul className="space-y-1">
            {d.specialization_gaps.map((g, i) => (
              <li key={i} className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                · {g}
              </li>
            ))}
          </ul>
        </div>
      )}

      {d.last_updated && (
        <p className="text-[11px] text-[var(--text-faint)] pt-2">
          Updated {formatRelative(d.last_updated)}
        </p>
      )}
    </div>
  );
}

function SoftwareSection({ row }: { row: IntelRow & { data: SoftwareLandscape } }) {
  const d = row.data;
  if (!d.platforms?.length && !d.summary) return null;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--overlay-weak)] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader>Platform landscape</SectionHeader>
        {d.last_updated && (
          <span className="text-[11px] text-[var(--text-faint)]">
            Updated {formatRelative(d.last_updated)}
          </span>
        )}
      </div>
      {d.summary && (
        <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
          {d.summary}
        </p>
      )}
      {d.platforms && d.platforms.length > 0 && (
        <div className="space-y-3">
          {d.platforms.map((p) => (
            <div
              key={p.name}
              className="rounded-md border border-[var(--border)] bg-[var(--bg)] p-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-[13px] font-medium text-[var(--text-primary)]">
                  {p.name}
                </h4>
                {p.sentiment_shift && (
                  <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] capitalize">
                    {sentimentIcon(p.sentiment_shift)}
                    {p.sentiment_shift}
                  </div>
                )}
              </div>
              {p.notes && (
                <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
                  {p.notes}
                </p>
              )}
              {p.pricing_changes && p.pricing_changes.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1">
                    Pricing
                  </p>
                  <ul className="space-y-0.5">
                    {p.pricing_changes.map((c, i) => (
                      <li key={i} className="text-[12px] text-[var(--text-tertiary)]">
                        · {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {p.recent_launches && p.recent_launches.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1">
                    Recent launches
                  </p>
                  <ul className="space-y-0.5">
                    {p.recent_launches.map((c, i) => (
                      <li key={i} className="text-[12px] text-[var(--text-tertiary)]">
                        · {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {p.funding_or_ma && p.funding_or_ma.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1">
                    Funding / M&amp;A
                  </p>
                  <ul className="space-y-0.5">
                    {p.funding_or_ma.map((c, i) => (
                      <li key={i} className="text-[12px] text-[var(--text-tertiary)]">
                        · {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MovementsSection({ row }: { row: IntelRow & { data: MarketMovements } }) {
  const d = row.data;
  const empty =
    !d.summary &&
    !d.new_entrants?.length &&
    !d.press_mentions?.length &&
    !d.mergers_and_acquisitions?.length;
  if (empty) return null;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--overlay-weak)] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <SectionHeader>Market movements</SectionHeader>
        {d.last_updated && (
          <span className="text-[11px] text-[var(--text-faint)]">
            Updated {formatRelative(d.last_updated)}
          </span>
        )}
      </div>
      {d.summary && (
        <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
          {d.summary}
        </p>
      )}
      {d.mergers_and_acquisitions && d.mergers_and_acquisitions.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5 flex items-center gap-1">
            <Briefcase className="size-3" />
            Mergers &amp; acquisitions
          </p>
          <ul className="space-y-1">
            {d.mergers_and_acquisitions.map((m, i) => (
              <li key={i} className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
                · {m}
              </li>
            ))}
          </ul>
        </div>
      )}
      {d.new_entrants && d.new_entrants.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
            New entrants
          </p>
          <ul className="space-y-1">
            {d.new_entrants.map((m, i) => (
              <li key={i} className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
                · {m}
              </li>
            ))}
          </ul>
        </div>
      )}
      {d.press_mentions && d.press_mentions.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
            Press mentions
          </p>
          <ul className="space-y-1">
            {d.press_mentions.map((m, i) => (
              <li key={i} className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
                · {m}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── page ─────────────────────────────────────────────────────────────

export default function CompetitiveIntelPage() {
  const { data, error, isLoading, mutate } = useSWR<IntelResponse>(
    "/api/intelligence/competitive-intel",
    fetcher,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const onRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    posthog.capture("competitive_intel_refresh_clicked");
    try {
      const res = await fetch("/api/intelligence/competitive-intel/refresh", {
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
    posthog.capture("competitive_intel_brief_clicked");
    try {
      const res = await fetch("/api/intelligence/competitive-brief/send", {
        method: "POST",
      });
      if (res.ok) {
        const body = await res.json().catch(() => ({}));
        const recipient = body?.recipient
          ? ` to ${body.recipient}`
          : "";
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

  const rows = data?.competitors ?? [];
  const competitors = rows.filter(
    (r) => !isSoftwareRow(r) && !isMovementsRow(r),
  ) as (IntelRow & { data: CompetitorData })[];
  const software = rows.find(isSoftwareRow);
  const movements = rows.find(isMovementsRow);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>
            Competitive intel
          </h1>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
            Rivals, field service platforms, and market shifts in your metro.
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

      {isLoading && (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-lg bg-[var(--overlay-soft)] animate-pulse"
            />
          ))}
        </div>
      )}

      {error && !isLoading && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="size-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] text-[var(--text-primary)]">
              Could not load competitive intel.
            </p>
            <p className="text-[12px] text-[var(--text-muted)] mt-1">
              Try the refresh button, or check back in a moment.
            </p>
          </div>
        </div>
      )}

      {!isLoading && !error && rows.length === 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--overlay-weak)] p-8 text-center">
          <Building2 className="size-6 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-[13px] text-[var(--text-primary)] mb-1">
            No competitive intel yet.
          </p>
          <p className="text-[12px] text-[var(--text-muted)]">
            Click &quot;Refresh intel&quot; to kick off the first run.
          </p>
        </div>
      )}

      {competitors.length > 0 && (
        <div>
          <SectionHeader>Competitors ({competitors.length})</SectionHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {competitors.map((c) => (
              <CompetitorCard key={c.id} row={c} />
            ))}
          </div>
        </div>
      )}

      {software && <SoftwareSection row={software} />}
      {movements && <MovementsSection row={movements} />}

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
