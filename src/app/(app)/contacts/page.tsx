"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useTenant } from "@/lib/tenant-hook";
import { enrichFromEmail } from "@/lib/enrichment";
import { normalizePhone } from "@/lib/normalize-phone";
import ExportButton from "@/components/shared/ExportButton";

type DuplicateMatch = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  matchedOn: "email" | "phone";
};

type UnifiedSource = "contacts" | "voice_contacts" | "outreach_prospects";

type UnifiedRow = {
  id: string;
  source: UnifiedSource;
  source_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  lifecycle_stage: string | null;
  last_seen_at: string | null;
};

type Contact = {
  id: string;
  source: UnifiedSource;
  sourceId: string;
  name: string;
  email: string;
  company: string;
  stage: string;
  lastActivity: string;
  owner: string;
};

const stages = ["All", "Lead", "Opportunity", "Customer"];

const sourceFilters: { key: "all" | UnifiedSource; label: string }[] = [
  { key: "all", label: "All" },
  { key: "contacts", label: "Contacts" },
  { key: "voice_contacts", label: "Voice" },
  { key: "outreach_prospects", label: "Outreach" },
];

const sourceLabel: Record<UnifiedSource, string> = {
  contacts: "Contacts",
  voice_contacts: "Voice",
  outreach_prospects: "Outreach",
};

const sourceBadgeColor: Record<UnifiedSource, string> = {
  contacts: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  voice_contacts: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  outreach_prospects: "bg-sky-500/10 text-sky-400 border-sky-500/20",
};

type SortKey = keyof Contact;
type SortDir = "asc" | "desc";

const lifecycleStages = ["subscriber", "lead", "mql", "sql", "opportunity", "customer"];

export default function ContactsPage() {
  const router = useRouter();
  const { tenant_id: tenantId } = useTenant();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState<"all" | UnifiedSource>(
    "all",
  );
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [refreshKey, setRefreshKey] = useState(0);

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCompanyId, setNewCompanyId] = useState("");
  const [newLifecycleStage, setNewLifecycleStage] = useState("");
  const [companiesList, setCompaniesList] = useState<{ id: string; name: string }[]>([]);
  const [enrichHint, setEnrichHint] = useState("");
  const [createError, setCreateError] = useState("");

  // Duplicate-confirm dialog state
  const [duplicateMatch, setDuplicateMatch] = useState<DuplicateMatch | null>(null);
  const [duplicateOpen, setDuplicateOpen] = useState(false);

  // Fetch companies for dropdown. Explicit tenant filter is defense in depth
  // on top of the RLS policy from migration 075; if RLS is ever misconfigured
  // we still scope the result set to the current tenant.
  useEffect(() => {
    if (!tenantId) return;
    const supabase = createClient();
    supabase
      .from("companies")
      .select("id, name")
      .eq("tenant_id", tenantId)
      .then(({ data }) => {
        if (data) setCompaniesList(data);
      });
  }, [tenantId]);

  function resetCreateForm() {
    setNewFirstName("");
    setNewLastName("");
    setNewEmail("");
    setNewPhone("");
    setNewCompanyId("");
    setNewLifecycleStage("");
    setEnrichHint("");
    setCreateError("");
  }

  function isUniqueViolation(err: unknown): boolean {
    if (!err || typeof err !== "object") return false;
    const e = err as { code?: string; message?: string };
    if (e.code === "23505") return true;
    return typeof e.message === "string" && /duplicate key|unique constraint/i.test(e.message);
  }

  async function lookupExistingByEmail(email: string): Promise<DuplicateMatch | null> {
    if (!tenantId || !email) return null;
    const supabase = createClient();
    const { data } = await supabase
      .from("contacts")
      .select("id, first_name, last_name, email, phone")
      .eq("tenant_id", tenantId)
      .eq("email", email)
      .limit(1)
      .maybeSingle();
    return data ? { ...(data as Omit<DuplicateMatch, "matchedOn">), matchedOn: "email" } : null;
  }

  async function lookupExistingByPhone(normalizedPhone: string): Promise<DuplicateMatch | null> {
    if (!tenantId || !normalizedPhone) return null;
    const supabase = createClient();
    const { data } = await supabase
      .from("contacts")
      .select("id, first_name, last_name, email, phone")
      .eq("tenant_id", tenantId)
      .eq("phone", normalizedPhone)
      .limit(1)
      .maybeSingle();
    return data ? { ...(data as Omit<DuplicateMatch, "matchedOn">), matchedOn: "phone" } : null;
  }

  async function insertContact() {
    if (!tenantId) return;
    const supabase = createClient();
    const normalizedPhone = normalizePhone(newPhone);
    const { error } = await supabase.from("contacts").insert({
      first_name: newFirstName,
      last_name: newLastName,
      email: newEmail || null,
      phone: normalizedPhone || null,
      company_id: newCompanyId || null,
      lifecycle_stage: newLifecycleStage || "lead",
      tenant_id: tenantId,
    });
    if (error) {
      if (isUniqueViolation(error)) {
        // Race: another writer beat us to it. Find the matching row and offer
        // to navigate, rather than show the raw Supabase error.
        const existing =
          (newEmail ? await lookupExistingByEmail(newEmail) : null) ||
          (normalizedPhone ? await lookupExistingByPhone(normalizedPhone) : null);
        if (existing) {
          setDuplicateMatch(existing);
          setDuplicateOpen(true);
          setCreateError("");
          return;
        }
        setCreateError("A contact with this email or phone already exists.");
        return;
      }
      throw error;
    }
    setCreateOpen(false);
    resetCreateForm();
    setRefreshKey((k) => k + 1);
  }

  async function handleCreateContact() {
    if (!tenantId) return;
    setCreating(true);
    setCreateError("");
    try {
      const normalizedPhone = normalizePhone(newPhone);
      const [emailMatch, phoneMatch] = await Promise.all([
        newEmail ? lookupExistingByEmail(newEmail) : Promise.resolve(null),
        normalizedPhone ? lookupExistingByPhone(normalizedPhone) : Promise.resolve(null),
      ]);
      const match = emailMatch || phoneMatch;
      if (match) {
        setDuplicateMatch(match);
        setDuplicateOpen(true);
        return;
      }
      await insertContact();
    } catch (err) {
      console.error("Failed to create contact:", err);
      setCreateError("Could not create contact. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleCreateAnyway() {
    setDuplicateOpen(false);
    setDuplicateMatch(null);
    setCreating(true);
    setCreateError("");
    try {
      await insertContact();
    } catch (err) {
      console.error("Failed to create contact:", err);
      setCreateError("Could not create contact. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  function handleViewExisting() {
    if (!duplicateMatch) return;
    const id = duplicateMatch.id;
    setDuplicateOpen(false);
    setDuplicateMatch(null);
    setCreateOpen(false);
    resetCreateForm();
    router.push(`/contacts/${id}`);
  }

  function handleDuplicateCancel() {
    setDuplicateOpen(false);
    setDuplicateMatch(null);
  }

  useEffect(() => {
    async function fetchContacts() {
      try {
        const resp = await fetch("/api/contacts/unified", {
          cache: "no-store",
        });
        if (!resp.ok) throw new Error(`unified fetch failed: ${resp.status}`);
        const payload = (await resp.json()) as UnifiedRow[] | { rows?: UnifiedRow[] };
        const rows: UnifiedRow[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.rows)
            ? payload.rows
            : [];

        const mapped: Contact[] = rows.map((r) => {
          const stageRaw = r.lifecycle_stage;
          const stagePretty = stageRaw
            ? stageRaw.charAt(0).toUpperCase() + stageRaw.slice(1).toLowerCase()
            : r.source === "contacts"
              ? "Lead"
              : "";
          return {
            id: `${r.source}:${r.source_id ?? r.id}`,
            source: r.source,
            sourceId: r.source_id ?? r.id,
            name: r.name?.trim() || r.email || r.phone || "(no name)",
            email: r.email || "",
            company: r.company_name || "",
            stage: stagePretty,
            lastActivity: r.last_seen_at
              ? r.last_seen_at.split("T")[0]
              : "",
            owner: "",
          };
        });
        setContacts(mapped);
        setTotalCount(mapped.length);
      } catch (err) {
        console.error("Failed to load unified contacts:", err);
        setContacts([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    }
    fetchContacts();
  }, [refreshKey]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    let list = contacts;
    if (sourceFilter !== "all") {
      list = list.filter((c) => c.source === sourceFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q)
      );
    }
    if (stageFilter !== "All") {
      list = list.filter((c) => c.stage === stageFilter);
    }
    list = [...list].sort((a, b) => {
      const aVal = a[sortKey] ?? "";
      const bVal = b[sortKey] ?? "";
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [contacts, search, stageFilter, sourceFilter, sortKey, sortDir]);

  const stageBadgeColor = (stage: string) => {
    switch (stage) {
      case "Customer":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Opportunity":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Lead":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-zinc-500/10 text-[var(--text-tertiary)] border-zinc-500/20";
    }
  };

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <button
      onClick={() => toggleSort(sortKeyName)}
      className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-[var(--text-muted)] hover:text-[var(--text-tertiary)] transition-colors"
    >
      {label}
      <ArrowUpDown className="size-3" />
    </button>
  );

  if (loading) {
    return (
      <div className="p-6" aria-busy="true">
        <div className="flex items-center justify-between mb-6">
          <div className="h-5 w-32 rounded bg-[var(--overlay-soft)] animate-pulse" />
          <div className="h-8 w-28 rounded bg-[var(--overlay-soft)] animate-pulse" />
        </div>
        <div className="flex gap-3 mb-4">
          <div className="h-8 w-64 rounded bg-[var(--overlay-soft)] animate-pulse" />
          <div className="h-8 w-32 rounded bg-[var(--overlay-soft)] animate-pulse" />
        </div>
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <div className="h-9 bg-[var(--overlay-weak)]" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-12 border-t border-[var(--border)] bg-[var(--overlay-weak)] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[15px] font-medium text-[var(--text-primary)]">Contacts</h1>
        <div className="flex items-center gap-2">
          <ExportButton
            data={contacts as unknown as Record<string, unknown>[]}
            columns={["name", "source", "email", "company", "stage", "lastActivity"]}
            filename="contacts"
          />
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-[var(--surface-inverse)] text-[var(--text-inverse)] hover:opacity-90 text-[13px] h-8 px-3"
          >
            <Plus className="size-4 mr-1" />
            Add contact
          </Button>
        </div>
      </div>

      {/* Source filter chips */}
      <div className="flex flex-wrap gap-2 mb-3" role="tablist" aria-label="Filter contacts by source">
        {sourceFilters.map((f) => {
          const active = sourceFilter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSourceFilter(f.key)}
              className={`px-3 h-7 rounded-full text-[12px] border transition-colors ${
                active
                  ? "bg-[var(--surface-inverse)] text-[var(--text-inverse)] border-[var(--surface-inverse)]"
                  : "bg-[var(--overlay-weak)] text-[var(--text-tertiary)] border-[var(--border)] hover:bg-[var(--overlay-soft)]"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 bg-[var(--overlay-weak)] border-[var(--border)] text-[13px] text-[var(--text-secondary)] placeholder:text-[var(--text-muted)]"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-8 text-[13px] text-[var(--text-tertiary)] border-[var(--border)] bg-[var(--overlay-weak)] hover:bg-[var(--overlay-soft)]"
            >
              Stage: {stageFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[var(--surface)] border-[var(--border)]">
            {stages.map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => setStageFilter(s)}
                className="text-[13px] text-[var(--text-tertiary)]"
              >
                {s}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[var(--border)] rounded-lg">
          <p className="text-[13px] text-[var(--text-primary)] font-medium mb-1">
            {contacts.length === 0 ? "No contacts yet" : "No matches"}
          </p>
          <p className="text-[12px] text-[var(--text-muted)] mb-4">
            {contacts.length === 0
              ? "Add a contact to start tracking outreach and pipeline activity."
              : "Try a different search term or stage filter."}
          </p>
          {contacts.length === 0 && (
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-[var(--surface-inverse)] text-[var(--text-inverse)] hover:opacity-90 text-[13px] h-8 px-3"
            >
              <Plus className="size-4 mr-1" />
              Add contact
            </Button>
          )}
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[var(--border)] hover:bg-transparent">
                <TableHead className="h-9">
                  <SortHeader label="Name" sortKeyName="name" />
                </TableHead>
                <TableHead className="h-9">
                  <SortHeader label="Source" sortKeyName="source" />
                </TableHead>
                <TableHead className="h-9">
                  <SortHeader label="Email" sortKeyName="email" />
                </TableHead>
                <TableHead className="h-9 hidden md:table-cell">
                  <SortHeader label="Company" sortKeyName="company" />
                </TableHead>
                <TableHead className="h-9">
                  <SortHeader label="Stage" sortKeyName="stage" />
                </TableHead>
                <TableHead className="h-9 hidden lg:table-cell">
                  <SortHeader label="Last Activity" sortKeyName="lastActivity" />
                </TableHead>
                <TableHead className="h-9 hidden lg:table-cell">
                  <SortHeader label="Owner" sortKeyName="owner" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((contact) => {
                const navigable = contact.source === "contacts";
                const rowTitle = navigable
                  ? undefined
                  : contact.source === "voice_contacts"
                    ? "From voice intake. Detail view not yet wired."
                    : "From outreach list. Detail view not yet wired.";
                return (
                  <TableRow
                    key={contact.id}
                    title={rowTitle}
                    onClick={() => {
                      if (navigable) {
                        router.push(`/contacts/${contact.sourceId}`);
                      }
                    }}
                    className={`border-[var(--border)] transition-colors ${
                      navigable
                        ? "cursor-pointer hover:bg-[var(--overlay-weak)]"
                        : "cursor-default hover:bg-[var(--overlay-weak)]/40"
                    }`}
                  >
                    <TableCell className="text-[13px] text-[var(--text-primary)] font-medium py-2.5">
                      {contact.name}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge
                        variant="outline"
                        className={`text-[11px] font-normal ${sourceBadgeColor[contact.source]}`}
                      >
                        {sourceLabel[contact.source]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[13px] text-[var(--text-tertiary)] py-2.5">
                      {contact.email || (
                        <span className="text-[var(--text-muted)]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-[13px] text-[var(--text-tertiary)] py-2.5 hidden md:table-cell">
                      {contact.company || (
                        <span className="text-[var(--text-muted)]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5">
                      {contact.stage ? (
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-normal ${stageBadgeColor(contact.stage)}`}
                        >
                          {contact.stage}
                        </Badge>
                      ) : (
                        <span className="text-[12px] text-[var(--text-muted)]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-[13px] text-[var(--text-muted)] py-2.5 hidden lg:table-cell">
                      {contact.lastActivity || "—"}
                    </TableCell>
                    <TableCell className="text-[13px] text-[var(--text-muted)] py-2.5 hidden lg:table-cell">
                      {contact.owner || "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-[11px] text-[var(--text-muted)]">
          {filtered.length} of {totalCount} contacts
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled
            className="text-[11px] text-[var(--text-muted)] border-[var(--border)] bg-transparent"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="text-[11px] text-[var(--text-muted)] border-[var(--border)] bg-transparent"
          >
            Next
          </Button>
        </div>
      </div>

      {/* Create Contact Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[var(--surface)] border-[var(--border)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px] text-[var(--text-primary)]">Add contact</DialogTitle>
            <DialogDescription className="text-[13px] text-[var(--text-muted)]">
              Create a new contact record.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-[var(--text-muted)]">First name</Label>
                <Input
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  placeholder="First name"
                  className="h-8 bg-[var(--overlay-weak)] border-[var(--border)] text-[13px] text-[var(--text-secondary)] placeholder:text-[var(--text-muted)]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-[var(--text-muted)]">Last name</Label>
                <Input
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  placeholder="Last name"
                  className="h-8 bg-[var(--overlay-weak)] border-[var(--border)] text-[13px] text-[var(--text-secondary)] placeholder:text-[var(--text-muted)]"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-[var(--text-muted)]">Email</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onBlur={async () => {
                  if (newEmail && newEmail.includes("@") && !newCompanyId && tenantId) {
                    const supabase = createClient();
                    const result = await enrichFromEmail(supabase, tenantId, newEmail);
                    if (result.company_id) {
                      setNewCompanyId(result.company_id);
                      setEnrichHint(`Matched to ${result.company_name}`);
                    } else if (result.company_name) {
                      setEnrichHint(`Suggested company: ${result.company_name}`);
                    }
                  }
                }}
                placeholder="email@example.com"
                className="h-8 bg-[var(--overlay-weak)] border-[var(--border)] text-[13px] text-[var(--text-secondary)] placeholder:text-[var(--text-muted)]"
              />
              {enrichHint && (
                <p className="text-[11px] text-emerald-400">{enrichHint}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-[var(--text-muted)]">Phone</Label>
              <Input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="h-8 bg-[var(--overlay-weak)] border-[var(--border)] text-[13px] text-[var(--text-secondary)] placeholder:text-[var(--text-muted)]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-[var(--text-muted)]">Company</Label>
              <Select value={newCompanyId} onValueChange={setNewCompanyId}>
                <SelectTrigger className="h-8 bg-[var(--overlay-weak)] border-[var(--border)] text-[13px] text-[var(--text-secondary)]">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--surface)] border-[var(--border)]">
                  {companiesList.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-[13px] text-[var(--text-secondary)]">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-[var(--text-muted)]">Lifecycle stage</Label>
              <Select value={newLifecycleStage} onValueChange={setNewLifecycleStage}>
                <SelectTrigger className="h-8 bg-[var(--overlay-weak)] border-[var(--border)] text-[13px] text-[var(--text-secondary)]">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--surface)] border-[var(--border)]">
                  {lifecycleStages.map((s) => (
                    <SelectItem key={s} value={s} className="text-[13px] text-[var(--text-secondary)] capitalize">
                      {s.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {createError && (
            <p className="text-[12px] text-red-400" role="alert">
              {createError}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setCreateOpen(false);
                setCreateError("");
              }}
              className="h-8 text-[13px] text-[var(--text-tertiary)] border-[var(--border)] bg-[var(--overlay-weak)] hover:bg-[var(--overlay-soft)]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateContact}
              disabled={creating || !newFirstName.trim()}
              className="bg-[var(--surface-inverse)] text-[var(--text-inverse)] hover:opacity-90 text-[13px] h-8"
            >
              {creating ? "Creating..." : "Create contact"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Duplicate Confirm Dialog */}
      <Dialog open={duplicateOpen} onOpenChange={(open) => (open ? setDuplicateOpen(true) : handleDuplicateCancel())}>
        <DialogContent className="bg-[var(--surface)] border-[var(--border)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px] text-[var(--text-primary)]">
              Possible duplicate found
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[var(--text-muted)]">
              A contact already exists with this {duplicateMatch?.matchedOn === "email" ? "email" : "phone"}.
            </DialogDescription>
          </DialogHeader>
          {duplicateMatch && (
            <div className="rounded-md border border-[var(--border)] bg-[var(--overlay-weak)] p-3 space-y-1">
              <p className="text-[13px] text-[var(--text-primary)] font-medium">
                {`${duplicateMatch.first_name ?? ""} ${duplicateMatch.last_name ?? ""}`.trim() || "(no name)"}
              </p>
              {duplicateMatch.email && (
                <p className="text-[12px] text-[var(--text-tertiary)]">{duplicateMatch.email}</p>
              )}
              {duplicateMatch.phone && (
                <p className="text-[12px] text-[var(--text-tertiary)]">{duplicateMatch.phone}</p>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleDuplicateCancel}
              className="h-8 text-[13px] text-[var(--text-tertiary)] border-[var(--border)] bg-[var(--overlay-weak)] hover:bg-[var(--overlay-soft)]"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleViewExisting}
              className="h-8 text-[13px] text-[var(--text-tertiary)] border-[var(--border)] bg-[var(--overlay-weak)] hover:bg-[var(--overlay-soft)]"
            >
              View existing contact
            </Button>
            <Button
              onClick={handleCreateAnyway}
              disabled={creating}
              className="bg-[var(--surface-inverse)] text-[var(--text-inverse)] hover:opacity-90 text-[13px] h-8"
            >
              {creating ? "Creating..." : "Create anyway"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
