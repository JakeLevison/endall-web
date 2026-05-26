"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  PhoneCall,
  PhoneOutgoing,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { posthog } from "@/lib/posthog";

// ── types ────────────────────────────────────────────────────────────

// The bridge may return numeric metrics as a plain number or as an object
// with a numeric value plus a pre-formatted display string. Be permissive.
type NumericLike =
  | number
  | null
  | undefined
  | {
      value?: number | null;
      hours?: number | null;
      amount?: number | null;
      formatted?: string | null;
    };

type RoiResponse = {
  labor_hours_saved?: NumericLike;
  cost_saved?: NumericLike;
  revenue_influenced?: NumericLike;
  period?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  basis?: string | null;
  hourly_rate?: number | null;
  last_updated?: string | null;
};

type TrendDirection = "up" | "down" | "flat";

type MetricWithTrend = {
  value?: number | null;
  prior?: number | null;
  trend?: TrendDirection;
  change_pct?: number | null;
};

type CampaignStat = {
  id?: string;
  name?: string;
  sent?: number | null;
  replies?: number | null;
  meetings?: number | null;
  reply_rate?: number | null;
};

type SdrSummary = {
  outbound_calls?: number | null;
  prospects_contacted?: number | null;
  qualified?: number | null;
  conversion_rate?: number | null;
  campaigns?: CampaignStat[];
};

type SummaryResponse = {
  period?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  prior_period_label?: string | null;
  calls_answered?: MetricWithTrend;
  answer_rate?: MetricWithTrend;
  bookings?: MetricWithTrend;
  booking_rate?: MetricWithTrend;
  estimates_generated?: MetricWithTrend;
  approval_rate?: MetricWithTrend;
  pipeline_value?: MetricWithTrend;
  sdr?: SdrSummary | null;
  last_weekly_report_sent_at?: string | null;
  last_monthly_report_sent_at?: string | null;
};

type TimeseriesPoint = {
  date: string;
  calls?: number;
  bookings?: number;
  estimates?: number;
  revenue?: number;
  [key: string]: string | number | undefined;
};

type TimeseriesResponse = {
  period?: "daily" | "weekly" | "monthly" | string;
  points?: TimeseriesPoint[];
};

type Period = "daily" | "weekly" | "monthly";
type MetricKey = "calls" | "bookings" | "estimates" | "revenue";

// ── helpers ──────────────────────────────────────────────────────────

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  return res.json();
};

// Coerce bridge-returned values (number, null, or object envelope) to a number.
function toNumber(v: NumericLike): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "object") {
    const candidate = v.value ?? v.hours ?? v.amount;
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }
  }
  return null;
}

function formatNumber(v: NumericLike, fractionDigits = 0): string {
  const n = toNumber(v);
  if (n == null) return "–";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function formatCurrency(v: NumericLike): string {
  const n = toNumber(v);
  if (n == null) return "–";
  if (Math.abs(n) >= 1_000_000) {
    return `$${(n / 1_000_000).toLocaleString("en-US", {
      maximumFractionDigits: 1,
    })}M`;
  }
  if (Math.abs(n) >= 10_000) {
    return `$${(n / 1_000).toLocaleString("en-US", {
      maximumFractionDigits: 0,
    })}K`;
  }
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

// Rates from the bridge are fractions in [0, 1]. Multiply to percent.
function formatPercent(v: NumericLike): string {
  const n = toNumber(v);
  if (n == null) return "–";
  return `${(n * 100).toFixed(0)}%`;
}

function formatRelative(iso: string | null | undefined): string {
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

function periodLabel(roi: RoiResponse | undefined): string {
  if (!roi) return "";
  if (roi.period_start && roi.period_end) {
    const start = new Date(roi.period_start);
    const end = new Date(roi.period_end);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      const opts: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
      };
      return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString(
        "en-US",
        opts,
      )}`;
    }
  }
  return roi.period || "last 30 days";
}

function deriveTrend(m: MetricWithTrend | undefined): {
  direction: TrendDirection;
  pct: number | null;
} {
  if (!m) return { direction: "flat", pct: null };
  if (m.trend && m.change_pct != null) {
    return { direction: m.trend, pct: m.change_pct };
  }
  if (m.value != null && m.prior != null && m.prior !== 0) {
    const pct = ((m.value - m.prior) / Math.abs(m.prior)) * 100;
    const direction: TrendDirection =
      pct > 0.5 ? "up" : pct < -0.5 ? "down" : "flat";
    return { direction, pct };
  }
  return { direction: m?.trend || "flat", pct: m?.change_pct ?? null };
}

const METRIC_COLORS: Record<MetricKey, string> = {
  calls: "#3b82f6",
  bookings: "#10b981",
  estimates: "#a855f7",
  revenue: "#f59e0b",
};

const METRIC_LABELS: Record<MetricKey, string> = {
  calls: "Calls",
  bookings: "Bookings",
  estimates: "Estimates",
  revenue: "Revenue",
};

// ── subcomponents ────────────────────────────────────────────────────

function HeroCard({
  label,
  value,
  subtitle,
  icon: Icon,
  loading,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  loading?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--overlay-weak)] p-5">
      <div className="flex items-center gap-2 text-[var(--text-muted)] mb-3">
        <Icon className="size-3.5" />
        <p className="text-[11px] uppercase tracking-wide">{label}</p>
      </div>
      {loading ? (
        <div className="h-8 w-32 rounded bg-[var(--overlay-soft)] animate-pulse" />
      ) : (
        <p className="text-[28px] font-medium text-[var(--text-primary)] tabular-nums leading-none">
          {value}
        </p>
      )}
      {subtitle && (
        <p className="text-[11px] text-[var(--text-muted)] mt-2 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  metric,
  icon: Icon,
}: {
  label: string;
  value: string;
  metric: MetricWithTrend | undefined;
  icon: React.ElementType;
}) {
  const { direction, pct } = deriveTrend(metric);
  const showTrend = pct != null && Number.isFinite(pct);
  const trendColor =
    direction === "up"
      ? "text-emerald-400"
      : direction === "down"
        ? "text-red-400"
        : "text-[var(--text-muted)]";
  const TrendIcon = direction === "down" ? ArrowDown : ArrowUp;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--overlay-weak)] p-4">
      <div className="flex items-start gap-3">
        <div className="size-7 rounded-md bg-[var(--overlay-soft)] flex items-center justify-center text-[var(--text-muted)] shrink-0">
          <Icon className="size-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            {label}
          </p>
          <p className="mt-1 text-[18px] font-medium text-[var(--text-primary)] tabular-nums">
            {value}
          </p>
          {showTrend ? (
            <div
              className={`mt-1 inline-flex items-center gap-1 text-[11px] ${trendColor}`}
            >
              {direction !== "flat" && <TrendIcon className="size-3" />}
              <span className="tabular-nums">
                {direction === "flat" ? "no change" : `${Math.abs(pct).toFixed(1)}%`}
              </span>
              <span className="text-[var(--text-faint)]">vs prior</span>
            </div>
          ) : (
            <p className="mt-1 text-[11px] text-[var(--text-faint)]">
              No prior data
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TrendChart({
  points,
  metrics,
}: {
  points: TimeseriesPoint[];
  metrics: MetricKey[];
}) {
  const useBar = metrics.length === 1 && metrics[0] === "revenue";
  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: 260 }}>
        <p className="text-[13px] text-[var(--text-muted)]">
          No data for this period yet.
        </p>
      </div>
    );
  }

  const tooltipFormatter = (value: unknown, name: unknown): [string, string] => {
    const key = String(name) as MetricKey;
    const v = typeof value === "number" ? value : Number(value);
    const numeric = Number.isFinite(v) ? v : null;
    const label = METRIC_LABELS[key] ?? String(name);
    if (key === "revenue") return [formatCurrency(numeric), label];
    return [formatNumber(numeric), label];
  };

  if (useBar) {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={points} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--overlay-soft)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            axisLine={{ stroke: "var(--overlay-soft)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            axisLine={false}
            tickLine={false}
            width={60}
            tickFormatter={(v) => formatCurrency(Number(v))}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--overlay-medium)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--text-secondary)",
            }}
            formatter={tooltipFormatter}
            labelStyle={{ color: "var(--text-tertiary)" }}
          />
          <Bar dataKey="revenue" fill={METRIC_COLORS.revenue} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={points} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--overlay-soft)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          axisLine={{ stroke: "var(--overlay-soft)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
          width={50}
          tickFormatter={(v) => formatNumber(Number(v))}
        />
        <Tooltip
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--overlay-medium)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--text-secondary)",
          }}
          formatter={tooltipFormatter}
          labelStyle={{ color: "var(--text-tertiary)" }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }}
          iconType="circle"
        />
        {metrics.map((m) => (
          <Line
            key={m}
            type="monotone"
            dataKey={m}
            stroke={METRIC_COLORS[m]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            name={METRIC_LABELS[m]}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── page ─────────────────────────────────────────────────────────────

export default function RoiPage() {
  const {
    data: summary,
    error: summaryError,
    isLoading: summaryLoading,
  } = useSWR<SummaryResponse>("/api/metrics/summary", fetcher);

  const {
    data: roi,
    error: roiError,
    isLoading: roiLoading,
  } = useSWR<RoiResponse>("/api/metrics/roi", fetcher);

  const [period, setPeriod] = useState<Period>("weekly");
  const [activeMetrics, setActiveMetrics] = useState<MetricKey[]>([
    "calls",
    "bookings",
  ]);
  const [sendingWeekly, setSendingWeekly] = useState(false);
  const [sendingMonthly, setSendingMonthly] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const {
    data: timeseries,
    error: timeseriesError,
    isLoading: timeseriesLoading,
  } = useSWR<TimeseriesResponse>(
    `/api/metrics/timeseries?period=${period}`,
    fetcher,
  );

  const chartPoints = timeseries?.points ?? [];

  const toggleMetric = (m: MetricKey) => {
    setActiveMetrics((prev) => {
      if (prev.includes(m)) {
        if (prev.length === 1) return prev;
        return prev.filter((x) => x !== m);
      }
      return [...prev, m];
    });
  };

  const onSendWeekly = async () => {
    if (sendingWeekly) return;
    setSendingWeekly(true);
    posthog.capture("roi_weekly_report_send_clicked");
    try {
      const res = await fetch("/api/reports/weekly/send", { method: "POST" });
      if (res.ok || res.status === 202) {
        const body = await res.json().catch(() => ({}));
        const recipient = body?.recipient ? ` to ${body.recipient}` : "";
        showToast(`Weekly report sent${recipient}.`);
      } else {
        showToast("Send failed. Try again.");
      }
    } catch {
      showToast("Send failed. Try again.");
    } finally {
      setSendingWeekly(false);
    }
  };

  const onSendMonthly = async () => {
    if (sendingMonthly) return;
    setSendingMonthly(true);
    posthog.capture("roi_monthly_report_send_clicked");
    try {
      const res = await fetch("/api/reports/monthly/send", { method: "POST" });
      if (res.ok || res.status === 202) {
        const body = await res.json().catch(() => ({}));
        const recipient = body?.recipient ? ` to ${body.recipient}` : "";
        showToast(`Monthly report sent${recipient}.`);
      } else {
        showToast("Send failed. Try again.");
      }
    } catch {
      showToast("Send failed. Try again.");
    } finally {
      setSendingMonthly(false);
    }
  };

  const onPreviewClick = (cadence: "weekly" | "monthly") => {
    posthog.capture("roi_report_preview_clicked", { cadence });
  };

  const heroSubtitle = useMemo(() => {
    if (!roi) return undefined;
    const rangeLabel = periodLabel(roi);
    const basis = roi.basis || (roi.hourly_rate
      ? `$${roi.hourly_rate}/hr blended labor rate`
      : "blended labor rate");
    return `${rangeLabel} · ${basis}`;
  }, [roi]);

  const sdr = summary?.sdr;
  const hasSdr = !!sdr && (
    sdr.outbound_calls != null
    || sdr.prospects_contacted != null
    || sdr.qualified != null
    || (sdr.campaigns && sdr.campaigns.length > 0)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>
            ROI & performance
          </h1>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
            Time saved, revenue influenced, and operational metrics across calls,
            bookings, and estimates.
          </p>
        </div>
      </div>

      {/* ROI hero */}
      <section className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <HeroCard
            label="Labor hours saved"
            value={formatNumber(roi?.labor_hours_saved)}
            subtitle={heroSubtitle}
            icon={Clock}
            loading={roiLoading}
          />
          <HeroCard
            label="Equivalent cost saved"
            value={formatCurrency(roi?.cost_saved)}
            subtitle={heroSubtitle}
            icon={DollarSign}
            loading={roiLoading}
          />
          <HeroCard
            label="Revenue influenced"
            value={formatCurrency(roi?.revenue_influenced)}
            subtitle={heroSubtitle}
            icon={TrendingUp}
            loading={roiLoading}
          />
        </div>
        {roiError && !roiLoading && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 flex items-start gap-3">
            <AlertTriangle className="size-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-[12px] text-[var(--text-muted)]">
              Could not load ROI totals. Refresh in a moment.
            </p>
          </div>
        )}
      </section>

      {/* Performance summary */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-[13px] font-medium text-[var(--text-primary)]">
            Performance
          </h2>
          {summary?.prior_period_label && (
            <span className="text-[11px] text-[var(--text-muted)]">
              Compared to {summary.prior_period_label}
            </span>
          )}
        </div>
        {summaryLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3" aria-busy="true">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-lg bg-[var(--overlay-soft)] animate-pulse"
              />
            ))}
          </div>
        ) : summaryError ? (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-3">
            <AlertTriangle className="size-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] text-[var(--text-primary)]">
                Could not load performance summary.
              </p>
              <p className="text-[12px] text-[var(--text-muted)] mt-1">
                Refresh the page, or try again in a moment.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              label="Calls answered"
              value={formatNumber(summary?.calls_answered?.value)}
              metric={summary?.calls_answered}
              icon={PhoneCall}
            />
            <MetricCard
              label="Answer rate"
              value={formatPercent(summary?.answer_rate?.value)}
              metric={summary?.answer_rate}
              icon={CheckCircle2}
            />
            <MetricCard
              label="Bookings"
              value={formatNumber(summary?.bookings?.value)}
              metric={summary?.bookings}
              icon={Calendar}
            />
            <MetricCard
              label="Booking rate"
              value={formatPercent(summary?.booking_rate?.value)}
              metric={summary?.booking_rate}
              icon={Target}
            />
            <MetricCard
              label="Estimates generated"
              value={formatNumber(summary?.estimates_generated?.value)}
              metric={summary?.estimates_generated}
              icon={FileSpreadsheet}
            />
            <MetricCard
              label="Approval rate"
              value={formatPercent(summary?.approval_rate?.value)}
              metric={summary?.approval_rate}
              icon={UserCheck}
            />
            <MetricCard
              label="Pipeline value"
              value={formatCurrency(summary?.pipeline_value?.value)}
              metric={summary?.pipeline_value}
              icon={DollarSign}
            />
          </div>
        )}
      </section>

      {/* Trends */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-[13px] font-medium text-[var(--text-primary)]">
            Trends
          </h2>
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className="flex items-center gap-1"
              role="group"
              aria-label="Period"
            >
              <span className="text-[11px] text-[var(--text-muted)] mr-1">
                Period:
              </span>
              {(["daily", "weekly", "monthly"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={period === p}
                  onClick={() => setPeriod(p)}
                  className={`text-[12px] capitalize rounded-md px-2.5 py-1 transition-colors ${
                    period === p
                      ? "bg-[var(--overlay-medium)] text-[var(--text-primary)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--overlay-weak)]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--overlay-weak)] p-4 space-y-3">
          <div
            className="flex items-center gap-2 flex-wrap"
            role="group"
            aria-label="Metric toggle"
          >
            <span className="text-[11px] text-[var(--text-muted)]">
              Metrics:
            </span>
            {(["calls", "bookings", "estimates", "revenue"] as const).map((m) => {
              const active = activeMetrics.includes(m);
              return (
                <button
                  key={m}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleMetric(m)}
                  className={`inline-flex items-center gap-1.5 text-[11px] capitalize rounded-full px-2.5 py-1 transition-colors border ${
                    active
                      ? "border-transparent text-[var(--text-primary)]"
                      : "border-[var(--overlay-medium)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  }`}
                  style={
                    active
                      ? {
                          background: `${METRIC_COLORS[m]}20`,
                          borderColor: `${METRIC_COLORS[m]}40`,
                        }
                      : undefined
                  }
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{ background: METRIC_COLORS[m] }}
                  />
                  {METRIC_LABELS[m]}
                </button>
              );
            })}
          </div>

          {timeseriesLoading ? (
            <div className="h-[260px] rounded bg-[var(--overlay-soft)] animate-pulse" />
          ) : timeseriesError ? (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-3">
              <AlertTriangle className="size-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-[12px] text-[var(--text-muted)]">
                Could not load trends.
              </p>
            </div>
          ) : (
            <TrendChart points={chartPoints} metrics={activeMetrics} />
          )}
        </div>
      </section>

      {/* SDR performance */}
      {hasSdr && (
        <section className="space-y-3">
          <h2 className="text-[13px] font-medium text-[var(--text-primary)]">
            SDR performance
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              label="Outbound calls"
              value={formatNumber(sdr?.outbound_calls)}
              metric={undefined}
              icon={PhoneOutgoing}
            />
            <MetricCard
              label="Prospects contacted"
              value={formatNumber(sdr?.prospects_contacted)}
              metric={undefined}
              icon={Users}
            />
            <MetricCard
              label="Qualified"
              value={formatNumber(sdr?.qualified)}
              metric={undefined}
              icon={CheckCircle2}
            />
            <MetricCard
              label="Conversion rate"
              value={formatPercent(sdr?.conversion_rate)}
              metric={undefined}
              icon={Target}
            />
          </div>

          {sdr?.campaigns && sdr.campaigns.length > 0 && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--overlay-weak)] p-4">
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-3">
                Campaigns
              </p>
              <div className="space-y-2">
                {sdr.campaigns.map((c, i) => (
                  <div
                    key={c.id || `${c.name}-${i}`}
                    className="flex items-center justify-between gap-3 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] text-[var(--text-primary)] truncate">
                        {c.name || "Campaign"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-[12px] text-[var(--text-muted)] shrink-0">
                      <span>
                        <span className="tabular-nums text-[var(--text-secondary)]">
                          {formatNumber(c.sent)}
                        </span>{" "}
                        sent
                      </span>
                      <span>
                        <span className="tabular-nums text-[var(--text-secondary)]">
                          {formatNumber(c.replies)}
                        </span>{" "}
                        replies
                      </span>
                      <span>
                        <span className="tabular-nums text-[var(--text-secondary)]">
                          {formatNumber(c.meetings)}
                        </span>{" "}
                        meetings
                      </span>
                      <span>
                        <span className="tabular-nums text-[var(--text-secondary)]">
                          {formatPercent(c.reply_rate)}
                        </span>{" "}
                        reply rate
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Reports */}
      <section className="space-y-3">
        <h2 className="text-[13px] font-medium text-[var(--text-primary)]">
          Reports
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--overlay-weak)] p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="size-7 rounded-md bg-[var(--overlay-soft)] flex items-center justify-center text-[var(--text-muted)] shrink-0 mt-0.5">
                <BarChart3 className="size-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-[var(--text-primary)]">
                  Weekly report
                </p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Performance and ROI for the last 7 days, delivered by email.
                </p>
                {summary?.last_weekly_report_sent_at && (
                  <p className="text-[11px] text-[var(--text-faint)] mt-1">
                    Last sent {formatRelative(summary.last_weekly_report_sent_at)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onSendWeekly}
                disabled={sendingWeekly}
              >
                <Send />
                {sendingWeekly ? "Sending..." : "Send weekly report"}
              </Button>
              <a
                href="/api/reports/weekly/preview"
                target="_blank"
                rel="noreferrer"
                onClick={() => onPreviewClick("weekly")}
                className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                <Eye className="size-3.5" />
                Preview
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--overlay-weak)] p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="size-7 rounded-md bg-[var(--overlay-soft)] flex items-center justify-center text-[var(--text-muted)] shrink-0 mt-0.5">
                <Sparkles className="size-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-[var(--text-primary)]">
                  Monthly report
                </p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Roll-up of the last 30 days with trend commentary and ROI.
                </p>
                {summary?.last_monthly_report_sent_at && (
                  <p className="text-[11px] text-[var(--text-faint)] mt-1">
                    Last sent {formatRelative(summary.last_monthly_report_sent_at)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onSendMonthly}
                disabled={sendingMonthly}
              >
                <Send />
                {sendingMonthly ? "Sending..." : "Send monthly report"}
              </Button>
              <a
                href="/api/reports/monthly/preview"
                target="_blank"
                rel="noreferrer"
                onClick={() => onPreviewClick("monthly")}
                className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                <Eye className="size-3.5" />
                Preview
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>
        </div>
      </section>

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
