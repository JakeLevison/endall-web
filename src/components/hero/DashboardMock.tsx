"use client";

import { useEffect, useState, useRef } from "react";
import {
  ChevronRight,
  Mail,
  Phone,
  FileText,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  X,
} from "lucide-react";

/* ─── CountUp ─────────────────────────────────────────────────────────── */
function CountUp({ target, suffix = "", delay = 0 }: { target: number; suffix?: string; delay?: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const duration = 1200;
      const start = performance.now();
      const step = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, delay]);
  return <span>{value.toLocaleString()}{suffix}</span>;
}

/* ─── Sample Data ─────────────────────────────────────────────────────── */
const DEALS = [
  { company: "Acme Corp", value: "$48,000", stage: "Negotiation", status: "Active", industry: "Commercial Construction", location: "Arlington, VA", contact: "Sarah Mitchell", phone: "(703) 555-0142", email: "s.mitchell@acmecorp.com", timeline: [{ action: "Proposal sent", date: "Mar 24" }, { action: "Discovery call", date: "Mar 20" }, { action: "Inbound lead", date: "Mar 18" }] },
  { company: "TechFlow", value: "$32,500", stage: "Proposal", status: "Active", industry: "Data Centers", location: "Ashburn, VA", contact: "James Park", phone: "(571) 555-0389", email: "j.park@techflow.io", timeline: [{ action: "Estimate delivered", date: "Mar 22" }, { action: "Site walk scheduled", date: "Mar 19" }, { action: "RFP received", date: "Mar 15" }] },
  { company: "Meridian Labs", value: "$67,200", stage: "Closed Won", status: "Won", industry: "Life Sciences", location: "Bethesda, MD", contact: "Lisa Chen", phone: "(301) 555-0276", email: "l.chen@meridianlabs.com", timeline: [{ action: "Contract signed", date: "Mar 21" }, { action: "Final negotiation", date: "Mar 17" }, { action: "Proposal sent", date: "Mar 10" }] },
  { company: "Apex Digital", value: "$21,000", stage: "Discovery", status: "New", industry: "Office Buildout", location: "Tysons, VA", contact: "Mike Torres", phone: "(703) 555-0518", email: "m.torres@apexdigital.com", timeline: [{ action: "Qualification call", date: "Mar 25" }, { action: "Inbound via website", date: "Mar 23" }] },
];

const SEQUENCE_STEPS = [
  { name: "Introduction email", day: 0, openRate: 45, status: "completed" as const },
  { name: "Value prop follow-up", day: 3, openRate: 38, status: "completed" as const },
  { name: "Case study share", day: 7, openRate: 29, status: "active" as const },
  { name: "Final check-in", day: 14, openRate: 22, status: "pending" as const },
];

const TASKS = [
  { task: "Follow up with Meridian Labs", agent: "SDR", due: "Today", priority: "High", status: "In Progress" },
  { task: "Send proposal to TechFlow", agent: "Email", due: "Today", priority: "High", status: "Pending" },
  { task: "Research Apex Digital team", agent: "Research", due: "Tomorrow", priority: "Medium", status: "Pending" },
  { task: "Schedule discovery call \u2013 Acme Corp", agent: "Front Desk", due: "Mar 28", priority: "Medium", status: "Completed" },
  { task: "Prep competitive brief for DC-14 bid", agent: "Research", due: "Mar 29", priority: "Low", status: "Pending" },
];

type Tab = "Pipeline" | "Sequences" | "Workflows" | "Tasks";

/* ─── Pipeline Tab ────────────────────────────────────────────────────── */
function PipelineView({ onTabChange }: { onTabChange: (tab: Tab) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revenueExpanded, setRevenueExpanded] = useState(false);
  const [dealsExpanded, setDealsExpanded] = useState(false);
  const deal = selected !== null ? DEALS[selected] : null;

  return (
    <>
      {/* Stat cards — all clickable */}
      <div
        className="grid grid-cols-2 md:grid-cols-3"
        style={{ padding: "16px 20px", gap: "12px" }}
      >
        <StatCard label="Revenue" value={<>$<CountUp target={284} suffix="k" delay={200} /></>} trend="+23%" onClick={() => setRevenueExpanded(!revenueExpanded)} active={revenueExpanded} />
        <StatCard label="Active Deals" value={<CountUp target={47} delay={200} />} onClick={() => setDealsExpanded(!dealsExpanded)} active={dealsExpanded} />
        <div className="hidden md:block">
          <StatCard label="Emails Sent" value={<CountUp target={3812} delay={200} />} onClick={() => onTabChange("Sequences")} />
        </div>
      </div>

      {/* Revenue breakdown mini-chart */}
      {revenueExpanded && (
        <div style={{ margin: "0 20px 12px", padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "8px", background: "var(--bg)", animation: "panel-slide 250ms ease-out" }}>
          <div style={{ marginBottom: "6px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Revenue by Quarter</div>
            <div style={{ fontSize: "10px", color: "var(--text-faint)", marginTop: "2px" }}>FY 2025, +74% YoY Q4</div>
          </div>
          <RevenueChart />
        </div>
      )}

      {/* Active deals breakdown */}
      {dealsExpanded && (
        <div style={{ margin: "0 20px 12px", padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "8px", background: "var(--bg)", animation: "panel-slide 250ms ease-out" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>Pipeline by Stage</div>
          {[{ stage: "Discovery", count: 12, color: "#60a5fa" }, { stage: "Proposal", count: 18, color: "#a78bfa" }, { stage: "Negotiation", count: 11, color: "#f59e0b" }, { stage: "Closed Won", count: 6, color: "#22c55e" }].map((s) => (
            <div key={s.stage} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", width: "80px" }}>{s.stage}</span>
              <div style={{ flex: 1, height: "6px", background: "var(--overlay-medium)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: `${(s.count / 18) * 100}%`, height: "100%", background: s.color, borderRadius: "3px" }} />
              </div>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", width: "20px", textAlign: "right" }}>{s.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Deals table */}
      <div style={{ padding: "0 20px 16px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Company", "Value", "Stage", "Status"].map((h) => (
                <th key={h} style={{ fontFamily: "var(--font-sans), sans-serif", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", textAlign: "left", padding: "8px 0", borderBottom: "1px solid var(--border)", fontWeight: 400 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DEALS.map((row, i) => (
              <tr
                key={row.company}
                onClick={() => setSelected(selected === i ? null : i)}
                className={i >= 2 ? "hidden md:table-row" : ""}
                style={{ cursor: "pointer", transition: "background 150ms ease", background: selected === i ? "var(--overlay-soft)" : "transparent" }}
                onMouseEnter={(e) => { if (selected !== i) e.currentTarget.style.background = "var(--overlay-weak)"; }}
                onMouseLeave={(e) => { if (selected !== i) e.currentTarget.style.background = "transparent"; }}
              >
                <td style={{ fontFamily: "var(--font-sans), sans-serif", fontSize: "12px", color: "var(--text-secondary)", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    {row.company}
                    <ChevronRight size={10} style={{ color: "var(--text-faint)", transform: selected === i ? "rotate(90deg)" : "none", transition: "transform 200ms ease" }} />
                  </span>
                </td>
                <td style={{ fontFamily: "var(--font-mono), monospace", fontSize: "12px", color: "var(--text-secondary)", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>{row.value}</td>
                <td style={{ fontFamily: "var(--font-sans), sans-serif", fontSize: "12px", color: "var(--text-tertiary)", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>{row.stage}</td>
                <td style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail panel */}
      {deal && (
        <div style={{ margin: "0 20px 16px", border: "1px solid var(--border)", borderRadius: "8px", background: "var(--bg)", overflow: "hidden", animation: "panel-slide 250ms ease-out" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 16px 0" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>{deal.company}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{deal.industry} &middot; {deal.location}</div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setSelected(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "2px" }}>
              <X size={14} />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", padding: "12px 16px" }}>
            <div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Contact</div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{deal.contact}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{deal.email}</div>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Deal</div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{deal.value} &middot; {deal.stage}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{deal.phone}</div>
            </div>
          </div>
          {/* Mini pipeline indicator */}
          <div style={{ display: "flex", gap: "2px", padding: "0 16px 12px" }}>
            {["Discovery", "Proposal", "Negotiation", "Closed Won"].map((s) => (
              <div key={s} style={{ flex: 1, height: "3px", borderRadius: "2px", background: ["Discovery", "Proposal", "Negotiation", "Closed Won"].indexOf(s) <= ["Discovery", "Proposal", "Negotiation", "Closed Won"].indexOf(deal.stage) ? "var(--brand-accent-light)" : "var(--overlay-medium)" }} />
            ))}
          </div>
          {/* Activity timeline */}
          <div style={{ borderTop: "1px solid var(--border)", padding: "12px 16px" }}>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Recent Activity</div>
            {deal.timeline.map((item, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: idx === 0 ? "var(--brand-accent-light)" : "var(--overlay-medium)", flexShrink: 0 }} />
                <span style={{ fontSize: "12px", color: "var(--text-secondary)", flex: 1 }}>{item.action}</span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{item.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Sequences Tab ───────────────────────────────────────────────────── */
function SequencesView() {
  return (
    <div style={{ padding: "16px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>New Lead Follow-Up</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>4 steps &middot; 14 day sequence</div>
        </div>
        <div style={{ display: "flex", gap: "16px" }}>
          {[{ label: "Enrolled", val: "156" }, { label: "Active", val: "43" }, { label: "Replied", val: "28" }].map((m) => (
            <div key={m.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "16px", fontWeight: 500, color: "var(--text-primary)" }}>{m.val}</div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Steps timeline */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
        {SEQUENCE_STEPS.map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            {/* Timeline connector */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "2px" }}>
              {step.status === "completed" ? (
                <CheckCircle2 size={16} style={{ color: "#22c55e", flexShrink: 0 }} />
              ) : step.status === "active" ? (
                <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid var(--brand-accent-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand-accent-light)" }} />
                </div>
              ) : (
                <Circle size={16} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
              )}
              {i < SEQUENCE_STEPS.length - 1 && (
                <div style={{ width: "1px", height: "32px", background: "var(--border)", marginTop: "4px" }} />
              )}
            </div>
            {/* Step content */}
            <div style={{ flex: 1, paddingBottom: i < SEQUENCE_STEPS.length - 1 ? "16px" : "0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "13px", fontWeight: 500, color: step.status === "pending" ? "var(--text-muted)" : "var(--text-primary)" }}>{step.name}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Day {step.day}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <div style={{ flex: 1, maxWidth: "120px", height: "4px", borderRadius: "2px", background: "var(--overlay-medium)", overflow: "hidden" }}>
                  <div style={{ width: `${step.openRate}%`, height: "100%", borderRadius: "2px", background: step.status === "pending" ? "var(--text-faint)" : "var(--brand-accent-light)", transition: "width 800ms ease" }} />
                </div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{step.openRate}% open</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Workflows Tab ───────────────────────────────────────────────────── */
function WorkflowsView() {
  return (
    <div style={{ padding: "16px 20px" }}>
      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>Inbound Lead Qualification</div>
      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "20px" }}>Triggers on new form submission</div>

      {/* Trigger */}
      <FlowNode icon={<Mail size={14} />} label="New form submission" type="trigger" />
      <FlowConnector />

      {/* Condition */}
      <FlowNode icon={<FileText size={14} />} label='Service type = "Data Center"?' type="condition" />

      {/* Branch */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", margin: "0 20px" }}>
        <div>
          <div style={{ textAlign: "center", fontSize: "11px", color: "#22c55e", fontWeight: 500, marginBottom: "6px" }}>Yes</div>
          <div style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 12px", background: "var(--overlay-weak)" }}>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Create deal<br />
              Assign to SDR<br />
              Send intro email
            </div>
          </div>
        </div>
        <div>
          <div style={{ textAlign: "center", fontSize: "11px", color: "var(--brand-accent-light)", fontWeight: 500, marginBottom: "6px" }}>No</div>
          <div style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 12px", background: "var(--overlay-weak)" }}>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Add to nurture sequence
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlowNode({ icon, label, type }: { icon: React.ReactNode; label: string; type: "trigger" | "condition" | "action" }) {
  const colors = {
    trigger: { border: "var(--brand-accent-light)", bg: "rgba(245, 158, 11, 0.08)" },
    condition: { border: "var(--border-hover)", bg: "var(--overlay-soft)" },
    action: { border: "var(--border)", bg: "var(--overlay-weak)" },
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", border: `1px solid ${colors[type].border}`, borderRadius: "8px", padding: "10px 14px", background: colors[type].bg, marginLeft: "20px", marginRight: "20px" }}>
      <span style={{ color: type === "trigger" ? "var(--brand-accent-light)" : "var(--text-muted)" }}>{icon}</span>
      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{label}</span>
    </div>
  );
}

function FlowConnector() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
      <div style={{ width: "1px", height: "16px", background: "var(--border)" }} />
    </div>
  );
}

/* ─── Tasks Tab ───────────────────────────────────────────────────────── */
function TasksView() {
  return (
    <div style={{ padding: "16px 20px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {TASKS.map((t, i) => (
          <div
            key={i}
            className={i >= 3 ? "hidden md:flex" : ""}
            style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: t.status === "Completed" ? "var(--overlay-weak)" : "transparent" }}
          >
            {t.status === "Completed" ? (
              <CheckCircle2 size={14} style={{ color: "#22c55e", flexShrink: 0 }} />
            ) : t.status === "In Progress" ? (
              <Clock size={14} style={{ color: "var(--brand-accent-light)", flexShrink: 0 }} />
            ) : (
              <Circle size={14} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "12px", color: t.status === "Completed" ? "var(--text-muted)" : "var(--text-secondary)", textDecoration: t.status === "Completed" ? "line-through" : "none" }}>{t.task}</div>
            </div>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", padding: "2px 6px", background: "var(--overlay-soft)", borderRadius: "4px", flexShrink: 0 }}>{t.agent}</span>
            <span style={{ fontSize: "10px", color: t.priority === "High" ? "var(--brand-accent-light)" : "var(--text-faint)", flexShrink: 0, display: "none" }} className="md:!inline">{t.due}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Revenue Chart ───────────────────────────────────────────────────── */
// Chart geometry chosen so mobile scaling (SVG viewBox) keeps bar labels
// legible at ~320px container widths.
function RevenueChart() {
  const BARS = [
    { q: "Q1", v: 0.847, label: "$847K" },
    { q: "Q2", v: 1.12, label: "$1.12M" },
    { q: "Q3", v: 1.34, label: "$1.34M" },
    { q: "Q4", v: 1.48, label: "$1.48M" },
  ];
  const YMAX = 1.5;                // $1.5M ceiling leaves headroom above Q4
  const TARGET = 1.2;              // dashed target line
  const CHART_TOP = 28;            // reserve space above bars for value labels
  const CHART_BOTTOM = 160;        // baseline
  const CHART_H = CHART_BOTTOM - CHART_TOP;
  const LEFT = 44;                 // reserve space for Y-axis labels
  const RIGHT = 400;               // right edge of plot area (bars/line end here)
  const VB_W = 484;                // viewBox width reserves right margin for target label
  const COL_W = (RIGHT - LEFT) / BARS.length;
  const BAR_W = Math.min(60, COL_W * 0.65);
  const yForValue = (v: number) => CHART_BOTTOM - (v / YMAX) * CHART_H;

  const YTICKS = [
    { v: YMAX, label: "$1.5M" },
    { v: 1.0, label: "$1.0M" },
    { v: 0.5, label: "$500K" },
    { v: 0, label: "$0" },
  ];

  return (
    <svg
      viewBox={`0 0 ${VB_W} 180`}
      role="img"
      aria-label="Revenue by quarter, FY 2025"
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      {YTICKS.map((t) => (
        <text
          key={t.label}
          x={LEFT - 6}
          y={yForValue(t.v) + 3}
          textAnchor="end"
          fontSize="11"
          fill="var(--text-muted)"
        >
          {t.label}
        </text>
      ))}

      {BARS.map((bar, i) => {
        const cx = LEFT + (i + 0.5) * COL_W;
        const bx = cx - BAR_W / 2;
        const by = yForValue(bar.v);
        const h = CHART_BOTTOM - by;
        return (
          <g key={bar.q}>
            <rect
              x={bx}
              y={by}
              width={BAR_W}
              height={h}
              fill="var(--brand-accent-light)"
              rx="3"
            />
            <text
              x={cx}
              y={by - 5}
              textAnchor="middle"
              fontSize="12"
              fontWeight="500"
              fill="var(--text-primary)"
            >
              {bar.label}
            </text>
            <text
              x={cx}
              y={CHART_BOTTOM + 14}
              textAnchor="middle"
              fontSize="12"
              fill="var(--text-muted)"
            >
              {bar.q}
            </text>
          </g>
        );
      })}

      {/* Target line renders after bars so it overlays them */}
      <line
        x1={LEFT}
        x2={RIGHT}
        y1={yForValue(TARGET)}
        y2={yForValue(TARGET)}
        stroke="var(--text-faint)"
        strokeDasharray="4 3"
        strokeWidth="1"
      />
      <text
        x={RIGHT + 4}
        y={yForValue(TARGET) + 4}
        textAnchor="start"
        fontSize="11"
        fill="var(--text-muted)"
      >
        Target $1.2M
      </text>
    </svg>
  );
}

/* ─── Shared UI ───────────────────────────────────────────────────────── */
function StatCard({ label, value, trend, onClick, active }: { label: string; value: React.ReactNode; trend?: string; onClick?: () => void; active?: boolean }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: active ? "var(--overlay-soft)" : "var(--bg)",
        border: `1px solid ${active ? "var(--brand-accent-light)" : "var(--border)"}`,
        borderRadius: "8px",
        padding: "14px",
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 200ms ease, background 200ms ease",
      }}
    >
      <div style={{ fontFamily: "var(--font-sans), sans-serif", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>{label}</div>
      <div style={{ fontFamily: "var(--font-sans), sans-serif", fontSize: "22px", fontWeight: 500, color: "var(--text-primary)" }}>{value}</div>
      {trend && <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: "10px", color: "var(--brand-accent-light)", marginTop: "4px" }}>{trend}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = status === "Won" ? "#4ade80" : status === "New" ? "#60a5fa" : undefined;
  const bg = status === "Won" ? "rgba(74, 222, 128, 0.1)" : status === "New" ? "rgba(96, 165, 250, 0.1)" : "var(--overlay-soft)";
  return (
    <span style={{ fontFamily: "var(--font-sans), sans-serif", fontSize: "10px", color: color || "var(--text-tertiary)", backgroundColor: bg, padding: "3px 8px", borderRadius: "4px" }}>{status}</span>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────── */
export default function DashboardMock() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Pipeline");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (cardRef.current) cardRef.current.style.animation = "none";
    }, 1100);
    return () => clearTimeout(timer);
  }, []);

  const tabs: Tab[] = ["Pipeline", "Sequences", "Workflows", "Tasks"];

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 16px" }}>
      <div
        ref={cardRef}
        className="dashboard-mock"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          overflow: "hidden",
          position: "relative",
          animation: "dashboard-fadein-flat 600ms cubic-bezier(0.16, 1, 0.3, 1) 400ms both",
        }}
      >
        {/* Shimmer line */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", overflow: "hidden" }}>
          <div style={{ width: "100px", height: "1px", background: "linear-gradient(90deg, transparent, var(--overlay-strong), transparent)", animation: "shimmer 3s linear infinite" }} />
        </div>

        {/* Top bar with tabs */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontFamily: "var(--font-sans), sans-serif", fontSize: "14px", color: "var(--text-primary)" }}>endall</span>
          <div style={{ display: "flex", gap: "4px" }}>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: "11px",
                  color: tab === activeTab ? "var(--text-primary)" : "var(--text-muted)",
                  background: tab === activeTab ? "var(--overlay-soft)" : "transparent",
                  border: "none",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: tab === activeTab ? 500 : 400,
                  transition: "all 150ms ease",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content with fade transition */}
        <div key={activeTab} style={{ animation: "tab-fade 250ms ease-out" }}>
          {activeTab === "Pipeline" && <PipelineView onTabChange={setActiveTab} />}
          {activeTab === "Sequences" && <SequencesView />}
          {activeTab === "Workflows" && <WorkflowsView />}
          {activeTab === "Tasks" && <TasksView />}
        </div>
      </div>

      <style jsx>{`
        @keyframes dashboard-fadein-flat {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: none; }
        }
        @keyframes tab-fade {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes panel-slide {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 400px; }
        }
        .dashboard-mock {
          transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .dashboard-mock:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px var(--overlay-strong);
        }
        @media (hover: none) {
          .dashboard-mock:hover {
            transform: none;
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
}
