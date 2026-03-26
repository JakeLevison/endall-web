"use client";

import Link from "next/link";
import { use } from "react";
import { ChevronRight, Mail, Phone, Building2, MoreHorizontal } from "lucide-react";
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

const mockContacts: Record<
  string,
  {
    name: string;
    email: string;
    phone: string;
    company: string;
    stage: string;
    owner: string;
    title: string;
  }
> = {
  "1": { name: "Sarah Chen", email: "sarah@acmecorp.com", phone: "+1 (555) 123-4567", company: "Acme Corp", stage: "Customer", owner: "Jake", title: "VP of Operations" },
  "2": { name: "Marcus Johnson", email: "marcus@techlabs.io", phone: "+1 (555) 234-5678", company: "TechLabs", stage: "Lead", owner: "Jake", title: "CTO" },
  "3": { name: "Emily Rodriguez", email: "emily@brightpath.co", phone: "+1 (555) 345-6789", company: "BrightPath", stage: "Opportunity", owner: "Jake", title: "CEO" },
  "4": { name: "David Kim", email: "david@novasoft.com", phone: "+1 (555) 456-7890", company: "NovaSoft", stage: "Customer", owner: "Jake", title: "Director of Engineering" },
  "5": { name: "Lisa Thompson", email: "lisa@greenleaf.org", phone: "+1 (555) 567-8901", company: "GreenLeaf", stage: "Lead", owner: "Jake", title: "Founder" },
  "6": { name: "James Wilson", email: "james@skylinedev.com", phone: "+1 (555) 678-9012", company: "Skyline Dev", stage: "Opportunity", owner: "Jake", title: "COO" },
  "7": { name: "Anna Petrov", email: "anna@cloudnine.io", phone: "+1 (555) 789-0123", company: "CloudNine", stage: "Lead", owner: "Jake", title: "Head of Product" },
  "8": { name: "Robert Chang", email: "robert@dataflow.com", phone: "+1 (555) 890-1234", company: "DataFlow", stage: "Customer", owner: "Jake", title: "VP of Sales" },
};

type Activity = {
  id: string;
  type: "email" | "call" | "meeting" | "note";
  title: string;
  description: string;
  date: string;
};

const mockActivities: Activity[] = [
  { id: "a1", type: "email", title: "Follow-up email sent", description: "Sent proposal follow-up with updated pricing.", date: "2026-03-25" },
  { id: "a2", type: "call", title: "Discovery call", description: "30 min call discussing requirements and timeline.", date: "2026-03-24" },
  { id: "a3", type: "meeting", title: "Product demo", description: "Walked through platform features and integrations.", date: "2026-03-22" },
  { id: "a4", type: "note", title: "Internal note", description: "Decision maker is the CFO. Need to loop them in on next call.", date: "2026-03-21" },
  { id: "a5", type: "email", title: "Introduction email", description: "Initial outreach with case study attached.", date: "2026-03-19" },
];

const mockDeals = [
  { id: "d1", name: "Enterprise License", amount: "$48,000", stage: "Proposal Sent" },
  { id: "d2", name: "Consulting Engagement", amount: "$12,000", stage: "Qualified" },
];

const mockCompanies = [
  { id: "c1", name: "Acme Corp" },
];

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

export default function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const contact = mockContacts[id] || mockContacts["1"];

  const stageBadgeColor = (stage: string) => {
    switch (stage) {
      case "Customer": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Opportunity": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Lead": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Breadcrumb + Actions */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-1.5 text-[13px]">
          <Link href="/contacts" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            Contacts
          </Link>
          <ChevronRight className="size-3 text-zinc-700" />
          <span className="text-white">{contact.name}</span>
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
            <DropdownMenuItem className="text-[13px] text-zinc-400">Enroll in Sequence</DropdownMenuItem>
            <DropdownMenuItem className="text-[13px] text-red-400">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 3-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left column — Contact info */}
        <div className="w-80 shrink-0 border-r border-white/[0.04] overflow-y-auto p-5">
          <div className="flex items-center gap-3 mb-5">
            <Avatar className="size-10">
              <AvatarFallback className="bg-white/[0.06] text-[13px] text-zinc-400">
                {contact.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-[15px] font-medium text-white">{contact.name}</h2>
              <p className="text-[13px] text-zinc-500">{contact.title}</p>
            </div>
          </div>

          <Separator className="bg-white/[0.04] mb-4" />

          <div className="space-y-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-zinc-600 mb-0.5">Email</p>
              <p className="text-[13px] text-zinc-300">{contact.email}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-zinc-600 mb-0.5">Phone</p>
              <p className="text-[13px] text-zinc-300">{contact.phone}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-zinc-600 mb-0.5">Company</p>
              <p className="text-[13px] text-zinc-300">{contact.company}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-zinc-600 mb-0.5">Stage</p>
              <Badge variant="outline" className={`text-[11px] font-normal ${stageBadgeColor(contact.stage)}`}>
                {contact.stage}
              </Badge>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-zinc-600 mb-0.5">Owner</p>
              <p className="text-[13px] text-zinc-300">{contact.owner}</p>
            </div>
          </div>
        </div>

        {/* Center column — Activity timeline */}
        <div className="flex-1 overflow-y-auto p-5 min-w-0">
          <h3 className="text-[13px] font-medium text-white mb-4">Activity</h3>
          <div className="space-y-3">
            {mockActivities.map((activity) => (
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
        </div>

        {/* Right column — Associated records */}
        <div className="w-72 shrink-0 border-l border-white/[0.04] overflow-y-auto p-5 hidden lg:block">
          <div className="mb-6">
            <h3 className="text-[11px] uppercase tracking-wide text-zinc-600 mb-3">Companies</h3>
            {mockCompanies.map((company) => (
              <Link
                key={company.id}
                href="/companies"
                className="flex items-center gap-2 p-2 rounded-md hover:bg-white/[0.02] transition-colors"
              >
                <Building2 className="size-4 text-zinc-500" />
                <span className="text-[13px] text-zinc-300">{company.name}</span>
              </Link>
            ))}
          </div>

          <div>
            <h3 className="text-[11px] uppercase tracking-wide text-zinc-600 mb-3">Deals</h3>
            {mockDeals.map((deal) => (
              <Link
                key={deal.id}
                href="/deals"
                className="block p-2 rounded-md hover:bg-white/[0.02] transition-colors mb-1"
              >
                <p className="text-[13px] text-zinc-300">{deal.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-zinc-500">{deal.amount}</span>
                  <span className="text-[11px] text-zinc-600">-</span>
                  <span className="text-[11px] text-zinc-500">{deal.stage}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
