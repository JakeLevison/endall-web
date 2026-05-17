"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
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
import { createClient } from "@/lib/supabase/client";
import type { Contact as DBContact, Activity as DBActivity, Deal as DBDeal } from "@/lib/types";

type ContactDetail = {
  name: string;
  email: string;
  phone: string;
  company: string;
  stage: string;
  owner: string;
  title: string;
};

type Activity = {
  id: string;
  type: "email" | "call" | "meeting" | "note";
  title: string;
  description: string;
  date: string;
};

type AssociatedDeal = {
  id: string;
  name: string;
  amount: string;
  stage: string;
};

type AssociatedCompany = {
  id: string;
  name: string;
};

type AssociatedEstimate = {
  id: string;
  label: string;
  description: string;
  amount: string;
  status: string;
  date: string;
};

const estimateStatusColor = (status: string) => {
  switch (status) {
    case "approved":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "sent":
    case "ready_for_review":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "rejected":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    case "expired":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    default:
      return "bg-zinc-500/10 text-[var(--text-tertiary)] border-zinc-500/20";
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

export default function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [deals, setDeals] = useState<AssociatedDeal[]>([]);
  const [companies, setCompanies] = useState<AssociatedCompany[]>([]);
  const [estimates, setEstimates] = useState<AssociatedEstimate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function fetchData() {
      try {
        // Fetch contact
        const { data: contactData, error: contactError } = await supabase
          .from("contacts")
          .select("*, companies(id, name)")
          .eq("id", id)
          .single();

        if (contactError) throw contactError;

        const c = contactData as DBContact & { companies?: { id: string; name: string } | null };
        setContact({
          name: `${c.first_name} ${c.last_name}`.trim(),
          email: c.email || "",
          phone: c.phone || "",
          company: c.companies?.name || "",
          stage: c.lifecycle_stage || "Lead",
          owner: c.owner || "",
          title: "", // title not in schema, leave blank
        });

        // Set associated company
        if (c.companies) {
          setCompanies([{ id: c.companies.id, name: c.companies.name }]);
        } else {
          setCompanies([]);
        }

        // Fetch activities for this contact
        const { data: activityData } = await supabase
          .from("activities")
          .select("*")
          .eq("contact_id", id)
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

        // Fetch deals for this contact
        const { data: dealData } = await supabase
          .from("deals")
          .select("*")
          .eq("contact_id", id);

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

        // Estimates linked to this contact by email/phone. Isolated so a
        // missing column or the parallel chief-of-staff PR not yet shipped
        // can never blank the contact page.
        try {
          const orParts: string[] = [];
          if (c.email) orParts.push(`customer_email.eq.${c.email}`);
          if (c.phone) orParts.push(`customer_phone.eq.${c.phone}`);
          if (orParts.length > 0) {
            const { data: estimateData } = await supabase
              .from("estimates")
              .select(
                "id, estimate_number, project_description, grand_total, status, created_at",
              )
              .or(orParts.join(","))
              .order("created_at", { ascending: false });
            setEstimates(
              (estimateData ?? []).map(
                (e: Record<string, unknown>) => ({
                  id: e.id as string,
                  label: (e.estimate_number as string) || "Estimate",
                  description: (e.project_description as string) || "",
                  amount:
                    "$" +
                    Number(e.grand_total ?? 0).toLocaleString("en-US"),
                  status: (e.status as string) || "",
                  date: e.created_at
                    ? (e.created_at as string).split("T")[0]
                    : "",
                }),
              ),
            );
          }
        } catch {
          setEstimates([]);
        }
      } catch {
        // Supabase query failed — show empty state
        setContact(null);
        setActivities([]);
        setDeals([]);
        setCompanies([]);
        setEstimates([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const stageBadgeColor = (stage: string) => {
    switch (stage) {
      case "Customer": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Opportunity": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Lead": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default: return "bg-zinc-500/10 text-[var(--text-tertiary)] border-zinc-500/20";
    }
  };

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

  if (!contact) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-1.5 text-[13px] mb-4">
          <Link href="/contacts" className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            Contacts
          </Link>
          <ChevronRight className="size-3 text-[var(--text-faint)]" />
          <span className="text-[var(--text-primary)]">Not found</span>
        </div>
        <div className="border border-dashed border-[var(--border)] rounded-lg p-10 text-center">
          <p className="text-[13px] text-[var(--text-primary)] font-medium mb-1">Contact not found</p>
          <p className="text-[12px] text-[var(--text-muted)] mb-4">
            This contact may have been deleted or never existed.
          </p>
          <Link href="/contacts">
            <Button className="bg-[var(--surface-inverse)] text-[var(--text-inverse)] hover:opacity-90 text-[13px] h-8 px-3">
              Back to contacts
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
          <Link href="/contacts" className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            Contacts
          </Link>
          <ChevronRight className="size-3 text-[var(--text-faint)]" />
          <span className="text-[var(--text-primary)]">{contact.name}</span>
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
            <DropdownMenuItem className="text-[13px] text-[var(--text-tertiary)]">Enroll in Sequence</DropdownMenuItem>
            <DropdownMenuItem className="text-[13px] text-red-400">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 3-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left column — Contact info */}
        <div className="w-80 shrink-0 border-r border-[var(--border)] overflow-y-auto p-5">
          <div className="flex items-center gap-3 mb-5">
            <Avatar className="size-10">
              <AvatarFallback className="bg-[var(--overlay-medium)] text-[13px] text-[var(--text-tertiary)]">
                {contact.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-[15px] font-medium text-[var(--text-primary)]">{contact.name}</h2>
              {contact.title && <p className="text-[13px] text-[var(--text-muted)]">{contact.title}</p>}
            </div>
          </div>

          <Separator className="bg-[var(--overlay-soft)] mb-4" />

          <div className="space-y-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-0.5">Email</p>
              <p className="text-[13px] text-[var(--text-secondary)] break-all">{contact.email || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-0.5">Phone</p>
              <p className="text-[13px] text-[var(--text-secondary)]">{contact.phone || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-0.5">Company</p>
              <p className="text-[13px] text-[var(--text-secondary)]">{contact.company || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-0.5">Stage</p>
              <Badge variant="outline" className={`text-[11px] font-normal ${stageBadgeColor(contact.stage)}`}>
                {contact.stage}
              </Badge>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-0.5">Owner</p>
              <p className="text-[13px] text-[var(--text-secondary)]">{contact.owner || "Unassigned"}</p>
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
            <h3 className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-3">Companies</h3>
            {companies.length === 0 ? (
              <p className="text-[13px] text-[var(--text-muted)]">No associated companies.</p>
            ) : (
              companies.map((company) => (
                <Link
                  key={company.id}
                  href={`/companies/${company.id}`}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-[var(--overlay-weak)] transition-colors"
                >
                  <Building2 className="size-4 text-[var(--text-muted)]" />
                  <span className="text-[13px] text-[var(--text-secondary)]">{company.name}</span>
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

          <div className="mt-6">
            <h3 className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-3">Estimates</h3>
            {estimates.length === 0 ? (
              <p className="text-[13px] text-[var(--text-muted)]">No estimates yet.</p>
            ) : (
              estimates.map((est) => (
                <Link
                  key={est.id}
                  href={`/estimates/${est.id}`}
                  className="block p-2 rounded-md hover:bg-[var(--overlay-weak)] transition-colors mb-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] text-[var(--text-secondary)] truncate">
                      {est.description?.trim() ? est.description : est.label}
                    </p>
                    {est.status && (
                      <Badge
                        variant="outline"
                        className={`shrink-0 text-[11px] font-normal capitalize ${estimateStatusColor(est.status)}`}
                      >
                        {est.status.replace(/_/g, " ")}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-[var(--text-muted)]">{est.amount}</span>
                    {est.date && (
                      <>
                        <span className="text-[11px] text-[var(--text-muted)]">-</span>
                        <span className="text-[11px] text-[var(--text-muted)]">{est.date}</span>
                      </>
                    )}
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
