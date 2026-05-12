"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ChevronRight, Mail, Phone, Building2, MoreHorizontal, Users, DollarSign } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import DealHealthBadge from "@/components/deals/DealHealthBadge";
import type { Deal as DBDeal, Activity as DBActivity } from "@/lib/types";

type DealDetail = {
  name: string;
  amount: string;
  stage: string;
  closeDate: string;
  owner: string;
  contactName: string;
  contactId: string;
  companyName: string;
  companyId: string;
};

type Activity = {
  id: string;
  type: "email" | "call" | "meeting" | "note";
  title: string;
  description: string;
  date: string;
};

const stageColor = (stage: string) => {
  switch (stage) {
    case "Closed Won": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "Closed Lost": return "bg-red-500/10 text-red-400 border-red-500/20";
    case "Negotiation": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "Proposal Sent": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "Meeting Scheduled":
    case "Qualified": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    default: return "bg-zinc-500/10 text-[var(--text-tertiary)] border-zinc-500/20";
  }
};

const activityIcon = (type: Activity["type"]) => {
  switch (type) {
    case "email": return <Mail className="size-3.5" />;
    case "call": return <Phone className="size-3.5" />;
    case "meeting": return <Building2 className="size-3.5" />;
    case "note": return <div className="size-3.5 text-center leading-[14px] text-[10px]">N</div>;
  }
};

const activityColor = (type: Activity["type"]) => {
  switch (type) {
    case "email": return "bg-blue-500/10 text-blue-400";
    case "call": return "bg-emerald-500/10 text-emerald-400";
    case "meeting": return "bg-purple-500/10 text-purple-400";
    case "note": return "bg-zinc-500/10 text-[var(--text-tertiary)]";
  }
};

function mapActivityType(type: string): Activity["type"] {
  if (["email", "call", "meeting", "note"].includes(type)) return type as Activity["type"];
  return "note";
}

export default function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [deal, setDeal] = useState<DealDetail | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function fetchData() {
      try {
        // Fetch deal with company and contact joins
        const { data: dealData, error: dealError } = await supabase
          .from("deals")
          .select("*, companies(id, name), contacts(id, first_name, last_name)")
          .eq("id", id)
          .single();

        if (dealError) throw dealError;

        const d = dealData as DBDeal & {
          companies?: { id: string; name: string } | null;
          contacts?: { id: string; first_name: string; last_name: string } | null;
        };

        setDeal({
          name: d.name || "",
          amount: "$" + (d.amount || 0).toLocaleString("en-US"),
          stage: d.stage || "",
          closeDate: d.close_date ? d.close_date.split("T")[0] : "",
          owner: d.owner || "",
          contactName: d.contacts ? `${d.contacts.first_name} ${d.contacts.last_name}`.trim() : "",
          contactId: d.contacts?.id || "",
          companyName: d.companies?.name || "",
          companyId: d.companies?.id || "",
        });

        // Fetch activities for this deal
        const { data: activityData } = await supabase
          .from("activities")
          .select("*")
          .eq("deal_id", id)
          .order("created_at", { ascending: false });

        if (activityData && activityData.length > 0) {
          setActivities((activityData as DBActivity[]).map((a) => ({
            id: a.id,
            type: mapActivityType(a.type),
            title: a.subject || "",
            description: a.body || "",
            date: a.created_at ? a.created_at.split("T")[0] : "",
          })));
        } else {
          setActivities([]);
        }
      } catch {
        // Supabase query failed — render not-found state below
        setDeal(null);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="h-full flex flex-col" aria-busy="true">
        <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)]">
          <div className="h-4 w-48 rounded bg-[var(--overlay-soft)] animate-pulse" />
          <div className="h-7 w-20 rounded bg-[var(--overlay-soft)] animate-pulse" />
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="w-80 shrink-0 border-r border-[var(--border)] p-5 space-y-3">
            <div className="flex items-center gap-3 mb-5">
              <div className="size-10 rounded-full bg-[var(--overlay-soft)] animate-pulse" />
              <div className="h-4 w-32 rounded bg-[var(--overlay-soft)] animate-pulse" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 rounded bg-[var(--overlay-soft)] animate-pulse" />
            ))}
          </div>
          <div className="flex-1 p-5">
            <div className="h-4 w-20 rounded bg-[var(--overlay-soft)] animate-pulse mb-4" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 mb-3 rounded bg-[var(--overlay-soft)] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-1.5 text-[13px] mb-4">
          <Link href="/deals" className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            Deals
          </Link>
          <ChevronRight className="size-3 text-[var(--text-faint)]" />
          <span className="text-[var(--text-primary)]">Not found</span>
        </div>
        <div className="border border-dashed border-[var(--border)] rounded-lg p-10 text-center">
          <p className="text-[13px] text-[var(--text-primary)] font-medium mb-1">Deal not found</p>
          <p className="text-[12px] text-[var(--text-muted)] mb-4">
            This deal may have been deleted or never existed.
          </p>
          <Link href="/deals">
            <Button className="bg-[var(--surface-inverse)] text-[var(--text-inverse)] hover:opacity-90 text-[13px] h-8 px-3">
              Back to deals
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Breadcrumb + Actions */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-1.5 text-[13px]">
          <Link href="/deals" className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            Deals
          </Link>
          <ChevronRight className="size-3 text-[var(--text-faint)]" />
          <span className="text-[var(--text-primary)]">{deal.name}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[13px] text-[var(--text-tertiary)] border-[var(--border)] bg-[var(--overlay-weak)]"
            >
              Actions
              <MoreHorizontal className="size-3.5 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[var(--surface)] border-[var(--border)]">
            <DropdownMenuItem className="text-[13px] text-[var(--text-tertiary)]">Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-[13px] text-[var(--text-tertiary)]">Change Stage</DropdownMenuItem>
            <DropdownMenuItem className="text-[13px] text-red-400">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 3-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left column — Deal info */}
        <div className="w-80 shrink-0 border-r border-[var(--border)] overflow-y-auto p-5">
          <div className="flex items-center gap-3 mb-5">
            <Avatar className="size-10">
              <AvatarFallback className="bg-[var(--overlay-medium)] text-[13px] text-[var(--text-tertiary)]">
                <DollarSign className="size-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-[15px] font-medium text-[var(--text-primary)]">{deal.name}</h2>
              <p className="text-[13px] text-[var(--text-muted)]">{deal.amount}</p>
            </div>
          </div>

          <Separator className="bg-[var(--overlay-soft)] mb-4" />

          <div className="space-y-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-0.5">Amount</p>
              <p className="text-[13px] text-[var(--text-secondary)]">{deal.amount}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-0.5">Stage</p>
              <Badge variant="outline" className={`text-[11px] font-normal ${stageColor(deal.stage)}`}>
                {deal.stage}
              </Badge>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-0.5">Close Date</p>
              <p className="text-[13px] text-[var(--text-secondary)]">{deal.closeDate || "---"}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-0.5">Owner</p>
              <p className="text-[13px] text-[var(--text-secondary)]">{deal.owner || "---"}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-0.5">Health</p>
              <DealHealthBadge
                dealId={id}
                stage={deal.stage}
                amount={parseFloat(deal.amount.replace(/[$,]/g, "")) || 0}
                closeDate={deal.closeDate || null}
                contactId={deal.contactId || null}
              />
            </div>
          </div>
        </div>

        {/* Center column — Activity timeline */}
        <div className="flex-1 overflow-y-auto p-5 min-w-0">
          <h3 className="text-[13px] font-medium text-[var(--text-primary)] mb-4">Activity</h3>
          {activities.length === 0 ? (
            <div className="border border-dashed border-[var(--border)] rounded-lg p-10 text-center">
              <p className="text-[13px] text-[var(--text-primary)] font-medium mb-1">No activity yet</p>
              <p className="text-[12px] text-[var(--text-muted)]">
                Emails, calls, meetings, and notes for this deal will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-3 p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--overlay-weak)] transition-colors"
                >
                  <div className={`size-7 rounded-md flex items-center justify-center shrink-0 ${activityColor(activity.type)}`}>
                    {activityIcon(activity.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[13px] text-[var(--text-primary)]">{activity.title}</p>
                      <span className="text-[11px] text-[var(--text-muted)]">{activity.date}</span>
                    </div>
                    <p className="text-[13px] text-[var(--text-muted)]">{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column — Associated records */}
        <div className="w-72 shrink-0 border-l border-[var(--border)] overflow-y-auto p-5 hidden lg:block">
          <div className="mb-6">
            <h3 className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-3">Contact</h3>
            {deal.contactName ? (
              <Link
                href={`/contacts/${deal.contactId}`}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-[var(--overlay-weak)] transition-colors"
              >
                <Users className="size-4 text-[var(--text-muted)]" />
                <span className="text-[13px] text-[var(--text-secondary)]">{deal.contactName}</span>
              </Link>
            ) : (
              <p className="text-[13px] text-[var(--text-muted)]">No associated contact.</p>
            )}
          </div>

          <div>
            <h3 className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-3">Company</h3>
            {deal.companyName ? (
              <Link
                href={`/companies/${deal.companyId}`}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-[var(--overlay-weak)] transition-colors"
              >
                <Building2 className="size-4 text-[var(--text-muted)]" />
                <span className="text-[13px] text-[var(--text-secondary)]">{deal.companyName}</span>
              </Link>
            ) : (
              <p className="text-[13px] text-[var(--text-muted)]">No associated company.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
