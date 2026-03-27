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

const fallbackDeals: Record<string, DealDetail> = {
  "1": { name: "Enterprise Platform License", amount: "$48,000", stage: "Proposal Sent", closeDate: "2026-04-15", owner: "Jake", contactName: "Sarah Chen", contactId: "1", companyName: "Acme Corp", companyId: "1" },
  "2": { name: "Consulting Engagement", amount: "$12,000", stage: "Qualified", closeDate: "2026-04-30", owner: "Jake", contactName: "Marcus Johnson", contactId: "2", companyName: "TechLabs", companyId: "2" },
  "3": { name: "Annual Subscription", amount: "$24,000", stage: "Negotiation", closeDate: "2026-05-01", owner: "Jake", contactName: "Emily Rodriguez", contactId: "3", companyName: "BrightPath", companyId: "3" },
  "4": { name: "Implementation Services", amount: "$36,000", stage: "Meeting Scheduled", closeDate: "2026-04-20", owner: "Jake", contactName: "David Kim", contactId: "4", companyName: "NovaSoft", companyId: "4" },
  "5": { name: "Starter Plan", amount: "$6,000", stage: "Closed Won", closeDate: "2026-03-30", owner: "Jake", contactName: "Lisa Thompson", contactId: "5", companyName: "GreenLeaf", companyId: "5" },
  "6": { name: "Custom Integration", amount: "$18,000", stage: "Proposal Sent", closeDate: "2026-04-10", owner: "Jake", contactName: "James Wilson", contactId: "6", companyName: "Skyline Dev", companyId: "6" },
  "7": { name: "Pro Subscription", amount: "$9,600", stage: "Qualified", closeDate: "2026-05-15", owner: "Jake", contactName: "Anna Petrov", contactId: "7", companyName: "CloudNine", companyId: "7" },
  "8": { name: "Data Migration", amount: "$15,000", stage: "Closed Lost", closeDate: "2026-03-28", owner: "Jake", contactName: "Robert Chang", contactId: "8", companyName: "DataFlow", companyId: "8" },
};

const fallbackActivities: Activity[] = [
  { id: "a1", type: "email", title: "Proposal sent", description: "Sent pricing proposal with implementation timeline.", date: "2026-03-25" },
  { id: "a2", type: "call", title: "Negotiation call", description: "Discussed terms and discount options.", date: "2026-03-23" },
  { id: "a3", type: "meeting", title: "Demo presentation", description: "Full product walkthrough with decision makers.", date: "2026-03-20" },
  { id: "a4", type: "note", title: "Internal note", description: "Budget approved on their side. Awaiting final sign-off from legal.", date: "2026-03-18" },
];

const stageColor = (stage: string) => {
  switch (stage) {
    case "Closed Won": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "Closed Lost": return "bg-red-500/10 text-red-400 border-red-500/20";
    case "Negotiation": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "Proposal Sent": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "Meeting Scheduled":
    case "Qualified": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
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
    case "note": return "bg-zinc-500/10 text-zinc-400";
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
        // Supabase query failed — use fallback data
        const fallback = fallbackDeals[id] || fallbackDeals["1"];
        setDeal(fallback);
        setActivities(fallbackActivities);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading || !deal) {
    return (
      <div className="p-6">
        <p className="text-[13px] text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Breadcrumb + Actions */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-1.5 text-[13px]">
          <Link href="/deals" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            Deals
          </Link>
          <ChevronRight className="size-3 text-zinc-700" />
          <span className="text-white">{deal.name}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[13px] text-zinc-400 border-white/[0.06] bg-white/[0.02]"
            >
              Actions
              <MoreHorizontal className="size-3.5 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#111113] border-white/[0.06]">
            <DropdownMenuItem className="text-[13px] text-zinc-400">Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-[13px] text-zinc-400">Change Stage</DropdownMenuItem>
            <DropdownMenuItem className="text-[13px] text-red-400">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 3-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left column — Deal info */}
        <div className="w-80 shrink-0 border-r border-white/[0.04] overflow-y-auto p-5">
          <div className="flex items-center gap-3 mb-5">
            <Avatar className="size-10">
              <AvatarFallback className="bg-white/[0.06] text-[13px] text-zinc-400">
                <DollarSign className="size-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-[15px] font-medium text-white">{deal.name}</h2>
              <p className="text-[13px] text-zinc-500">{deal.amount}</p>
            </div>
          </div>

          <Separator className="bg-white/[0.04] mb-4" />

          <div className="space-y-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-zinc-600 mb-0.5">Amount</p>
              <p className="text-[13px] text-zinc-300">{deal.amount}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-zinc-600 mb-0.5">Stage</p>
              <Badge variant="outline" className={`text-[11px] font-normal ${stageColor(deal.stage)}`}>
                {deal.stage}
              </Badge>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-zinc-600 mb-0.5">Close Date</p>
              <p className="text-[13px] text-zinc-300">{deal.closeDate || "---"}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-zinc-600 mb-0.5">Owner</p>
              <p className="text-[13px] text-zinc-300">{deal.owner || "---"}</p>
            </div>
          </div>
        </div>

        {/* Center column — Activity timeline */}
        <div className="flex-1 overflow-y-auto p-5 min-w-0">
          <h3 className="text-[13px] font-medium text-white mb-4">Activity</h3>
          {activities.length === 0 ? (
            <p className="text-[13px] text-zinc-600">No activities yet.</p>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-3 p-3 rounded-lg border border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                >
                  <div className={`size-7 rounded-md flex items-center justify-center shrink-0 ${activityColor(activity.type)}`}>
                    {activityIcon(activity.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[13px] text-white">{activity.title}</p>
                      <span className="text-[11px] text-zinc-600">{activity.date}</span>
                    </div>
                    <p className="text-[13px] text-zinc-500">{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column — Associated records */}
        <div className="w-72 shrink-0 border-l border-white/[0.04] overflow-y-auto p-5 hidden lg:block">
          <div className="mb-6">
            <h3 className="text-[11px] uppercase tracking-wide text-zinc-600 mb-3">Contact</h3>
            {deal.contactName ? (
              <Link
                href={`/contacts/${deal.contactId}`}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-white/[0.02] transition-colors"
              >
                <Users className="size-4 text-zinc-500" />
                <span className="text-[13px] text-zinc-300">{deal.contactName}</span>
              </Link>
            ) : (
              <p className="text-[13px] text-zinc-600">No associated contact.</p>
            )}
          </div>

          <div>
            <h3 className="text-[11px] uppercase tracking-wide text-zinc-600 mb-3">Company</h3>
            {deal.companyName ? (
              <Link
                href={`/companies/${deal.companyId}`}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-white/[0.02] transition-colors"
              >
                <Building2 className="size-4 text-zinc-500" />
                <span className="text-[13px] text-zinc-300">{deal.companyName}</span>
              </Link>
            ) : (
              <p className="text-[13px] text-zinc-600">No associated company.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
