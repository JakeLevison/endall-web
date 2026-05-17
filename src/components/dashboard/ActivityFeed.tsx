"use client";

import { useState, useEffect } from "react";
import { Mail, Phone, Calendar, FileText, Clock, CalendarPlus } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type FeedItem = {
  id: string;
  type: string;
  subject: string;
  contactName: string;
  contactId: string | null;
  dealId: string | null;
  time: string;
};

// Wire-shape from GET /api/jobs/unified (bridge merges voice_jobs + jobs).
// Mirrors the dispatch page consumer; we only surface source === "voice_jobs"
// rows here so the dashboard shows what Front Desk booked over the phone.
type UnifiedJob = {
  id: string;
  source: "jobs" | "voice_jobs";
  title: string | null;
  status: string | null;
  scheduled_at: string | null;
  customer_id: string | null;
  created_at: string | null;
};

const typeIcon: Record<string, React.ReactNode> = {
  email: <Mail className="size-3.5" />,
  call: <Phone className="size-3.5" />,
  meeting: <Calendar className="size-3.5" />,
  note: <FileText className="size-3.5" />,
  task: <Clock className="size-3.5" />,
  booking: <CalendarPlus className="size-3.5" />,
};

const typeColor: Record<string, string> = {
  email: "bg-blue-500/10 text-blue-400",
  call: "bg-amber-500/10 text-amber-400",
  meeting: "bg-purple-500/10 text-purple-400",
  note: "bg-emerald-500/10 text-emerald-400",
  task: "bg-zinc-500/10 text-[var(--text-tertiary)]",
  booking: "bg-purple-500/10 text-purple-400",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatBookingDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function entityHref(item: FeedItem): string | null {
  // calls → contact, emails → deal or contact, bookings → contact, others → contact
  if (item.type === "call" && item.contactId) return `/contacts/${item.contactId}`;
  if (item.type === "email" && item.dealId) return `/deals/${item.dealId}`;
  if (item.type === "email" && item.contactId) return `/contacts/${item.contactId}`;
  if (item.contactId) return `/contacts/${item.contactId}`;
  if (item.dealId) return `/deals/${item.dealId}`;
  return null;
}

// Voice bookings come from /api/jobs/unified. The wire shape carries no
// estimate_id or caller name, so we surface the job title + scheduled date
// and link to the contact when the bridge resolved one. Fails silently:
// a bridge outage must never blank the activity feed.
async function fetchVoiceBookings(): Promise<FeedItem[]> {
  try {
    const res = await fetch("/api/jobs/unified");
    if (!res.ok) return [];
    const body = await res.json();
    const jobs: UnifiedJob[] = Array.isArray(body)
      ? body
      : Array.isArray(body?.jobs)
        ? body.jobs
        : [];
    return jobs
      .filter((j) => j.source === "voice_jobs")
      .map((j) => {
        const when = formatBookingDate(j.scheduled_at);
        return {
          id: `booking-${j.id}`,
          type: "booking",
          subject: `New booking: ${j.title?.trim() || "Job"}${when ? ` on ${when}` : ""}`,
          contactName: "",
          contactId: j.customer_id,
          dealId: null,
          time: j.created_at || j.scheduled_at || "",
        };
      });
  } catch {
    return [];
  }
}

export default function ActivityFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [activitiesRes, bookings] = await Promise.all([
        supabase
          .from("activities")
          .select(
            "id, type, subject, contact_id, deal_id, created_at, contacts(first_name, last_name)",
          )
          .order("created_at", { ascending: false })
          .limit(10),
        fetchVoiceBookings(),
      ]);

      const activityItems: FeedItem[] = (activitiesRes.data ?? []).map(
        (a: Record<string, unknown>) => {
          const contact = a.contacts as unknown as {
            first_name: string;
            last_name: string;
          } | null;
          return {
            id: a.id as string,
            type: (a.type as string) || "note",
            subject: (a.subject as string) || "",
            contactName: contact
              ? `${contact.first_name} ${contact.last_name}`
              : "",
            contactId: a.contact_id as string | null,
            dealId: a.deal_id as string | null,
            time: (a.created_at as string) || "",
          };
        },
      );

      const merged = [...activityItems, ...bookings]
        .sort((x, y) => new Date(y.time).getTime() - new Date(x.time).getTime())
        .slice(0, 12);

      setItems(merged);
      setLoading(false);
    }
    load();
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <div className="border border-[var(--border)] bg-[var(--overlay-weak)] rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <h3 className="text-[13px] font-medium text-[var(--text-primary)]">Recent Activity</h3>
      </div>
      <div>
        {items.map((item) => {
          const href = entityHref(item);
          const content = (
            <>
              <div className={`size-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${typeColor[item.type] || typeColor.note}`}>
                {typeIcon[item.type] || typeIcon.note}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-[var(--text-primary)] truncate">{item.subject}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.contactName && item.contactId ? (
                    <Link href={`/contacts/${item.contactId}`} className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors" onClick={(e) => e.stopPropagation()}>
                      {item.contactName}
                    </Link>
                  ) : item.contactName ? (
                    <span className="text-[11px] text-[var(--text-muted)]">{item.contactName}</span>
                  ) : null}
                  <span className="text-[11px] text-[var(--text-faint)]">{item.time ? timeAgo(item.time) : ""}</span>
                </div>
              </div>
            </>
          );

          return href ? (
            <Link
              key={item.id}
              href={href}
              className="flex items-start gap-3 px-4 py-2.5 border-b border-[var(--border)] last:border-0 hover:bg-[var(--overlay-soft)] transition-colors"
            >
              {content}
            </Link>
          ) : (
            <div
              key={item.id}
              className="flex items-start gap-3 px-4 py-2.5 border-b border-[var(--border)] last:border-0"
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
