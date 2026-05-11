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
        // Supabase query failed — render not-found state below
        setCompany(null);
        setActivities([]);
        setContacts([]);
        setDeals([]);
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

  if (!company) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-1.5 text-[13px] mb-4">
          <Link href="/companies" className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            Companies
          </Link>
          <ChevronRight className="size-3 text-[var(--text-faint)]" />
          <span className="text-[var(--text-primary)]">Not found</span>
        </div>
        <div className="border border-dashed border-[var(--border)] rounded-lg p-10 text-center">
          <p className="text-[13px] text-[var(--text-primary)] font-medium mb-1">Company not found</p>
          <p className="text-[12px] text-[var(--text-muted)] mb-4">
            This company may have been deleted or never existed.
          </p>
          <Link href="/companies">
            <Button className="bg-[var(--surface-inverse)] text-[var(--text-inverse)] hover:opacity-90 text-[13px] h-8 px-3">
              Back to companies
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const location = [company.city, company.state, company.country].filter(Boolean).join(", ");

  return (
    <div className="h-full flex flex-col">
      {/* Breadcrumb + Actions */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-1.5 text-[13px]">
          <Link href="/companies" className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            Companies
          </Link>
          <ChevronRight className="size-3 text-[var(--text-faint)]" />
          <span className="text-[var(--text-primary)]">{company.name}</span>
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
            <DropdownMenuItem className="text-[13px] text-red-400">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 3-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left column — Company info */}
        <div className="w-80 shrink-0 border-r border-[var(--border)] overflow-y-auto p-5">
          <div className="flex items-center gap-3 mb-5">
            <Avatar className="size-10">
              <AvatarFallback className="bg-[var(--overlay-medium)] text-[13px] text-[var(--text-tertiary)]">
                {company.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-[15px] font-medium text-[var(--text-primary)]">{company.name}</h2>
              {company.domain && <p className="text-[13px] text-[var(--text-muted)]">{company.domain}</p>}
            </div>
          </div>

          <Separator className="bg-[var(--overlay-soft)] mb-4" />

          <div className="space-y-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-0.5">Domain</p>
              <p className="text-[13px] text-[var(--text-secondary)]">{company.domain || "---"}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-0.5">Industry</p>
              <p className="text-[13px] text-[var(--text-secondary)]">{company.industry || "---"}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-0.5">Size</p>
              <p className="text-[13px] text-[var(--text-secondary)]">{company.size || "---"}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-0.5">Location</p>
              <p className="text-[13px] text-[var(--text-secondary)]">{location || "---"}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-0.5">Owner</p>
              <p className="text-[13px] text-[var(--text-secondary)]">{company.owner || "---"}</p>
            </div>
          </div>
        </div>

        {/* Center column — Activity timeline */}
        <div className="flex-1 overflow-y-auto p-5 min-w-0">
          <h3 className="text-[13px] font-medium text-[var(--text-primary)] mb-4">Activity</h3>
          {activities.length === 0 ? (
            <p className="text-[13px] text-[var(--text-muted)]">No activities yet.</p>
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
            <h3 className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-3">Contacts</h3>
            {contacts.length === 0 ? (
              <p className="text-[13px] text-[var(--text-muted)]">No associated contacts.</p>
            ) : (
              contacts.map((contact) => (
                <Link
                  key={contact.id}
                  href={`/contacts/${contact.id}`}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-[var(--overlay-weak)] transition-colors"
                >
                  <Users className="size-4 text-[var(--text-muted)]" />
                  <div className="min-w-0">
                    <span className="text-[13px] text-[var(--text-secondary)] block">{contact.name}</span>
                    <span className="text-[11px] text-[var(--text-muted)] block truncate">{contact.email}</span>
                  </div>
                </Link>
              ))
            )}
          </div>

          <div>
            <h3 className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-3">Deals</h3>
            {deals.length === 0 ? (
              <p className="text-[13px] text-[var(--text-muted)]">No associated deals.</p>
            ) : (
              deals.map((deal) => (
                <Link
                  key={deal.id}
                  href={`/deals/${deal.id}`}
                  className="block p-2 rounded-md hover:bg-[var(--overlay-weak)] transition-colors mb-1"
                >
                  <p className="text-[13px] text-[var(--text-secondary)]">{deal.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-[var(--text-muted)]">{deal.amount}</span>
                    <span className="text-[11px] text-[var(--text-muted)]">-</span>
                    <span className="text-[11px] text-[var(--text-muted)]">{deal.stage}</span>
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
