"use client";

import { useState, useEffect } from "react";
import { ArrowRight, AlertTriangle, Clock, Mail, Phone, Calendar } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Priority = {
  id: string;
  type: "overdue_task" | "deal_at_risk" | "follow_up_due" | "meeting_today" | "hot_lead";
  urgency: "high" | "medium" | "low";
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
};

const urgencyColor = {
  high: "border-l-red-500 bg-red-500/5",
  medium: "border-l-amber-500 bg-amber-500/5",
  low: "border-l-blue-500 bg-blue-500/5",
};

const urgencyDot = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-blue-500",
};

export default function TodaysPriorities() {
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function compute() {
      const supabase = createClient();
      const items: Priority[] = [];

      // 1. Overdue tasks
      const today = new Date().toISOString().split("T")[0];
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, title, due_date, priority")
        .neq("status", "done")
        .neq("status", "cancelled")
        .lt("due_date", today)
        .order("due_date")
        .limit(3);

      for (const t of tasks || []) {
        items.push({
          id: `task-${t.id}`,
          type: "overdue_task",
          urgency: t.priority === "urgent" || t.priority === "high" ? "high" : "medium",
          title: t.title,
          subtitle: `Due ${t.due_date}`,
          href: "/tasks",
          icon: <AlertTriangle className="size-4" />,
        });
      }

      // 2. Deals closing soon (next 14 days) with no recent activity
      const twoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
      const { data: deals } = await supabase
        .from("deals")
        .select("id, name, amount, stage, close_date, companies(name)")
        .neq("stage", "Closed Won")
        .neq("stage", "Closed Lost")
        .lte("close_date", twoWeeks)
        .order("close_date")
        .limit(5);

      for (const d of deals || []) {
        const daysLeft = Math.ceil(
          (new Date(d.close_date).getTime() - Date.now()) / 86400000
        );
        const company = (d.companies as unknown as Record<string, unknown> | null)?.name || "";
        items.push({
          id: `deal-${d.id}`,
          type: "deal_at_risk",
          urgency: daysLeft <= 3 ? "high" : daysLeft <= 7 ? "medium" : "low",
          title: `${d.name}${company ? " — " + company : ""}`,
          subtitle: `$${Number(d.amount).toLocaleString()} closes in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
          href: `/deals/${d.id}`,
          icon: <Clock className="size-4" />,
        });
      }

      // 3. Hot leads (score > 70, not yet customer)
      const { data: hotLeads } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, lead_score, lifecycle_stage, companies(name)")
        .gte("lead_score", 70)
        .neq("lifecycle_stage", "customer")
        .is("merged_into", null)
        .order("lead_score", { ascending: false })
        .limit(3);

      for (const c of hotLeads || []) {
        const company = (c.companies as unknown as Record<string, unknown> | null)?.name || "";
        items.push({
          id: `lead-${c.id}`,
          type: "hot_lead",
          urgency: (c.lead_score || 0) >= 80 ? "high" : "medium",
          title: `${c.first_name} ${c.last_name}${company ? " at " + company : ""}`,
          subtitle: `Lead score ${c.lead_score} — ${c.lifecycle_stage}`,
          href: `/contacts/${c.id}`,
          icon: <Mail className="size-4" />,
        });
      }

      // Sort by urgency (high first)
      const order = { high: 0, medium: 1, low: 2 };
      items.sort((a, b) => order[a.urgency] - order[b.urgency]);

      setPriorities(items.slice(0, 8));
      setLoading(false);
    }

    compute();
  }, []);

  if (loading) return null;
  if (priorities.length === 0) return null;

  return (
    <div className="border border-[var(--border)] bg-[var(--overlay-weak)] rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <h3 className="text-[13px] font-medium text-[var(--text-primary)]">Today's Priorities</h3>
        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{priorities.length} items need your attention</p>
      </div>
      <div>
        {priorities.map((p) => (
          <Link
            key={p.id}
            href={p.href}
            className={`flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] border-l-2 hover:bg-[var(--overlay-weak)] transition-colors ${urgencyColor[p.urgency]}`}
          >
            <div className={`size-2 rounded-full shrink-0 ${urgencyDot[p.urgency]}`} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-[var(--text-primary)] truncate">{p.title}</p>
              <p className="text-[11px] text-[var(--text-muted)]">{p.subtitle}</p>
            </div>
            <ArrowRight className="size-3.5 text-[var(--text-muted)] shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
