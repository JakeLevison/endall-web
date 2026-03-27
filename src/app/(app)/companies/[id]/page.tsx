"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ChevronRight, Building2, Mail, Phone, MoreHorizontal, Globe, Users } from "lucide-react";
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
import type { Company as DBCompany, Activity as DBActivity, Contact as DBContact, Deal as DBDeal } from "@/lib/types";

type CompanyDetail = {
  name: string;
  domain: string;
  industry: string;
  size: string;
  city: string;
  state: string;
  country: string;
  owner: string;
};

type Activity = {
  id: string;
  type: "email" | "call" | "meeting" | "note";
  title: string;
  description: string;
  date: string;
};

type AssociatedContact = {
  id: string;
  name: string;
  email: string;
};

type AssociatedDeal = {
  id: string;
  name: string;
  amount: string;
  stage: string;
};

const fallbackCompanies: Record<string, CompanyDetail> = {
  "1": { name: "Acme Corp", domain: "acmecorp.com", industry: "Technology", size: "51-200", city: "San Francisco", state: "CA", country: "US", owner: "Jake" },
  "2": { name: "TechLabs", domain: "techlabs.io", industry: "SaaS", size: "11-50", city: "Austin", state: "TX", country: "US", owner: "Jake" },
  "3": { name: "BrightPath", domain: "brightpath.co", industry: "Consulting", size: "1-10", city: "New York", state: "NY", country: "US", owner: "Jake" },
  "4": { name: "NovaSoft", domain: "novasoft.com", industry: "Technology", size: "201-500", city: "Seattle", state: "WA", country: "US", owner: "Jake" },
  "5": { name: "GreenLeaf", domain: "greenleaf.org", industry: "Non-Profit", size: "11-50", city: "Portland", state: "OR", country: "US", owner: "Jake" },
  "6": { name: "Skyline Dev", domain: "skylinedev.com", industry: "Development", size: "11-50", city: "Denver", state: "CO", country: "US", owner: "Jake" },
  "7": { name: "CloudNine", domain: "cloudnine.io", industry: "Cloud Services", size: "51-200", city: "Chicago", state: "IL", country: "US", owner: "Jake" },
  "8": { name: "DataFlow", domain: "dataflow.com", industry: "Data Analytics", size: "51-200", city: "Boston", state: "MA", country: "US", owner: "Jake" },
};

const fallbackActivities: Activity[] = [
  { id: "a1", type: "email", title: "Partnership proposal sent", description: "Sent updated partnership terms and pricing structure.", date: "2026-03-25" },
  { id: "a2", type: "call", title: "Quarterly review call", description: "Discussed Q1 results and expansion plans.", date: "2026-03-23" },
  { id: "a3", type: "meeting", title: "Strategy session", description: "On-site meeting to align on product roadmap.", date: "2026-03-20" },
  { id: "a4", type: "note", title: "Internal note", description: "Key stakeholder is transitioning roles. Monitor for impact.", date: "2026-03-18" },
];

const fallbackContacts: AssociatedContact[] = [
  { id: "c1", name: "Sarah Chen", email: "sarah@acmecorp.com" },
  { id: "c2", name: "David Kim", email: "david@acmecorp.com" },
];

const fallbackDeals: AssociatedDeal[] = [
  { id: "d1", name: "Enterprise License", amount: "$48,000", stage: "Proposal Sent" },
  { id: "d2", name: "Consulting Engagement", amount: "$12,000", stage: "Qualified" },
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

function mapActivityType(type: string): Activity["type"] {
  if (["email", "call", "meeting", "note"].includes(type)) return type as Activity["type"];
  return "note";
}

export default function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [contacts, setContacts] = useState<AssociatedContact[]>([]);
  const [deals, setDeals] = useState<AssociatedDeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function fetchData() {
      try {
        // Fetch company
        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .select("*")
          .eq("id", id)
          .single();

        if (companyError) throw companyError;

        const c = companyData as DBCompany;
        setCompany({
          name: c.name || "",
          domain: c.domain || "",
          industry: c.industry || "",
          size: c.size || "",
          city: c.city || "",
          state: c.state || "",
          country: c.country || "",
          owner: c.owner || "",
        });

        // Fetch activities for this company
        const { data: activityData } = await supabase
          .from("activities")
          .select("*")
          .eq("company_id", id)
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

        // Fetch contacts for this company
        const { data: contactData } = await supabase
          .from("contacts")
          .select("*")
          .eq("company_id", id);

        if (contactData && contactData.length > 0) {
          setContacts((contactData as DBContact[]).map((ct) => ({
            id: ct.id,
            name: `${ct.first_name} ${ct.last_name}`.trim(),
            email: ct.email || "",
          })));
        } else {
          setContacts([]);
        }

        // Fetch deals for this company
        const { data: dealData } = await supabase
          .from("deals")
          .select("*")
          .eq("company_id", id);

        if (dealData && dealData.length > 0) {
          setDeals((dealData as DBDeal[]).map((d) => ({
            id: d.id,
            name: d.name || "",
            amount: "$" + (d.amount || 0).toLocaleString("en-US"),
            stage: d.stage || "",
          })));
        } else {
          setDeals([]);
        }
      } catch {
        // Supabase query failed — use fallback data
        const fallback = fallbackCompanies[id] || fallbackCompanies["1"];
        setCompany(fallback);
        setActivities(fallbackActivities);
        setContacts(fallbackContacts);
        setDeals(fallbackDeals);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading || !company) {
    return (
      <div className="p-6">
        <p className="text-[13px] text-zinc-500">Loading...</p>
      </div>
    );
  }

  const location = [company.city, company.state, company.country].filter(Boolean).join(", ");

  return (
    <div className="h-full flex flex-col">
      {/* Breadcrumb + Actions */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-1.5 text-[13px]">
          <Link href="/companies" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            Companies
          </Link>
          <ChevronRight className="size-3 text-zinc-700" />
          <span className="text-white">{company.name}</span>
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
            <DropdownMenuItem className="text-[13px] text-red-400">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 3-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left column — Company info */}
        <div className="w-80 shrink-0 border-r border-white/[0.04] overflow-y-auto p-5">
          <div className="flex items-center gap-3 mb-5">
            <Avatar className="size-10">
              <AvatarFallback className="bg-white/[0.06] text-[13px] text-zinc-400">
                {company.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-[15px] font-medium text-white">{company.name}</h2>
              {company.domain && <p className="text-[13px] text-zinc-500">{company.domain}</p>}
            </div>
          </div>

          <Separator className="bg-white/[0.04] mb-4" />

          <div className="space-y-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-zinc-600 mb-0.5">Domain</p>
              <p className="text-[13px] text-zinc-300">{company.domain || "---"}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-zinc-600 mb-0.5">Industry</p>
              <p className="text-[13px] text-zinc-300">{company.industry || "---"}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-zinc-600 mb-0.5">Size</p>
              <p className="text-[13px] text-zinc-300">{company.size || "---"}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-zinc-600 mb-0.5">Location</p>
              <p className="text-[13px] text-zinc-300">{location || "---"}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-zinc-600 mb-0.5">Owner</p>
              <p className="text-[13px] text-zinc-300">{company.owner || "---"}</p>
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
            <h3 className="text-[11px] uppercase tracking-wide text-zinc-600 mb-3">Contacts</h3>
            {contacts.length === 0 ? (
              <p className="text-[13px] text-zinc-600">No associated contacts.</p>
            ) : (
              contacts.map((contact) => (
                <Link
                  key={contact.id}
                  href={`/contacts/${contact.id}`}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-white/[0.02] transition-colors"
                >
                  <Users className="size-4 text-zinc-500" />
                  <div className="min-w-0">
                    <span className="text-[13px] text-zinc-300 block">{contact.name}</span>
                    <span className="text-[11px] text-zinc-600 block truncate">{contact.email}</span>
                  </div>
                </Link>
              ))
            )}
          </div>

          <div>
            <h3 className="text-[11px] uppercase tracking-wide text-zinc-600 mb-3">Deals</h3>
            {deals.length === 0 ? (
              <p className="text-[13px] text-zinc-600">No associated deals.</p>
            ) : (
              deals.map((deal) => (
                <Link
                  key={deal.id}
                  href={`/deals/${deal.id}`}
                  className="block p-2 rounded-md hover:bg-white/[0.02] transition-colors mb-1"
                >
                  <p className="text-[13px] text-zinc-300">{deal.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-zinc-500">{deal.amount}</span>
                    <span className="text-[11px] text-zinc-600">-</span>
                    <span className="text-[11px] text-zinc-500">{deal.stage}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
