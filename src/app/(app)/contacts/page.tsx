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
import { enrichFromEmail } from "@/lib/enrichment";
import type { Contact as DBContact } from "@/lib/types";

type Contact = {
  id: string;
  name: string;
  email: string;
  company: string;
  stage: string;
  lastActivity: string;
  owner: string;
};

const stages = ["All", "Lead", "Opportunity", "Customer"];

type SortKey = keyof Contact;
type SortDir = "asc" | "desc";

const lifecycleStages = ["subscriber", "lead", "mql", "sql", "opportunity", "customer"];

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
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

  // Fetch companies for dropdown
  useEffect(() => {
    const supabase = createClient();
    supabase.from("companies").select("id, name").then(({ data }) => {
      if (data) setCompaniesList(data);
    });
  }, []);

  async function handleCreateContact() {
    setCreating(true);
    try {
      const supabase = createClient();
      const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
      const { error } = await supabase.from("contacts").insert({
        first_name: newFirstName,
        last_name: newLastName,
        email: newEmail || null,
        phone: newPhone || null,
        company_id: newCompanyId || null,
        lifecycle_stage: newLifecycleStage || "lead",
        tenant_id: tenantId,
      });
      if (error) throw error;
      setCreateOpen(false);
      setNewFirstName("");
      setNewLastName("");
      setNewEmail("");
      setNewPhone("");
      setNewCompanyId("");
      setNewLifecycleStage("");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Failed to create contact:", err);
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    const supabase = createClient();
    async function fetchContacts() {
      try {
        const { data, error } = await supabase
          .from("contacts")
          .select("*, companies(name)");

        if (error) throw error;

        if (data && data.length > 0) {
          const mapped: Contact[] = (data as DBContact[]).map((c) => ({
            id: c.id,
            name: `${c.first_name} ${c.last_name}`.trim(),
            email: c.email || "",
            company: c.companies?.name || "",
            stage: c.lifecycle_stage || "Lead",
            lastActivity: c.updated_at ? c.updated_at.split("T")[0] : "",
            owner: c.owner || "",
          }));
          setContacts(mapped);
          setTotalCount(mapped.length);
        } else {
          setContacts([]);
          setTotalCount(0);
        }
      } catch {
        // Supabase query failed — show empty state
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
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [contacts, search, stageFilter, sortKey, sortDir]);

  const stageBadgeColor = (stage: string) => {
    switch (stage) {
      case "Customer":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Opportunity":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Lead":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <button
      onClick={() => toggleSort(sortKeyName)}
      className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-zinc-600 hover:text-zinc-400 transition-colors"
    >
      {label}
      <ArrowUpDown className="size-3" />
    </button>
  );

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-[13px] text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[15px] font-medium text-white">Contacts</h1>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-white text-zinc-900 hover:bg-zinc-100 text-[13px] h-8 px-3"
        >
          <Plus className="size-4 mr-1" />
          Add contact
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-zinc-600" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 bg-white/[0.02] border-white/[0.06] text-[13px] text-zinc-300 placeholder:text-zinc-600"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-8 text-[13px] text-zinc-400 border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
            >
              Stage: {stageFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#111113] border-white/[0.06]">
            {stages.map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => setStageFilter(s)}
                className="text-[13px] text-zinc-400"
              >
                {s}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[13px] text-zinc-600">
            No contacts yet. Import or add your first contact.
          </p>
        </div>
      ) : (
        <div className="border border-white/[0.04] rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.04] hover:bg-transparent">
                <TableHead className="h-9">
                  <SortHeader label="Name" sortKeyName="name" />
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
              {filtered.map((contact) => (
                <TableRow
                  key={contact.id}
                  onClick={() => router.push(`/contacts/${contact.id}`)}
                  className="cursor-pointer border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                >
                  <TableCell className="text-[13px] text-white font-medium py-2.5">
                    {contact.name}
                  </TableCell>
                  <TableCell className="text-[13px] text-zinc-400 py-2.5">
                    {contact.email}
                  </TableCell>
                  <TableCell className="text-[13px] text-zinc-400 py-2.5 hidden md:table-cell">
                    {contact.company}
                  </TableCell>
                  <TableCell className="py-2.5">
                    <Badge
                      variant="outline"
                      className={`text-[11px] font-normal ${stageBadgeColor(contact.stage)}`}
                    >
                      {contact.stage}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[13px] text-zinc-500 py-2.5 hidden lg:table-cell">
                    {contact.lastActivity}
                  </TableCell>
                  <TableCell className="text-[13px] text-zinc-500 py-2.5 hidden lg:table-cell">
                    {contact.owner}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-[11px] text-zinc-600">
          {filtered.length} of {totalCount} contacts
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled
            className="text-[11px] text-zinc-600 border-white/[0.06] bg-transparent"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="text-[11px] text-zinc-600 border-white/[0.06] bg-transparent"
          >
            Next
          </Button>
        </div>
      </div>

      {/* Create Contact Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[#111113] border-white/[0.06] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px] text-white">Add contact</DialogTitle>
            <DialogDescription className="text-[13px] text-zinc-500">
              Create a new contact record.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-zinc-600">First name</Label>
                <Input
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  placeholder="First name"
                  className="h-8 bg-white/[0.02] border-white/[0.06] text-[13px] text-zinc-300 placeholder:text-zinc-600"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-zinc-600">Last name</Label>
                <Input
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  placeholder="Last name"
                  className="h-8 bg-white/[0.02] border-white/[0.06] text-[13px] text-zinc-300 placeholder:text-zinc-600"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-zinc-600">Email</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onBlur={async () => {
                  if (newEmail && newEmail.includes("@") && !newCompanyId) {
                    const supabase = createClient();
                    const result = await enrichFromEmail(supabase, process.env.NEXT_PUBLIC_TENANT_ID || "", newEmail);
                    if (result.company_id) {
                      setNewCompanyId(result.company_id);
                      setEnrichHint(`Matched to ${result.company_name}`);
                    } else if (result.company_name) {
                      setEnrichHint(`Suggested company: ${result.company_name}`);
                    }
                  }
                }}
                placeholder="email@example.com"
                className="h-8 bg-white/[0.02] border-white/[0.06] text-[13px] text-zinc-300 placeholder:text-zinc-600"
              />
              {enrichHint && (
                <p className="text-[11px] text-emerald-400">{enrichHint}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-zinc-600">Phone</Label>
              <Input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="h-8 bg-white/[0.02] border-white/[0.06] text-[13px] text-zinc-300 placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-zinc-600">Company</Label>
              <Select value={newCompanyId} onValueChange={setNewCompanyId}>
                <SelectTrigger className="h-8 bg-white/[0.02] border-white/[0.06] text-[13px] text-zinc-300">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent className="bg-[#111113] border-white/[0.06]">
                  {companiesList.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-[13px] text-zinc-300">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-zinc-600">Lifecycle stage</Label>
              <Select value={newLifecycleStage} onValueChange={setNewLifecycleStage}>
                <SelectTrigger className="h-8 bg-white/[0.02] border-white/[0.06] text-[13px] text-zinc-300">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent className="bg-[#111113] border-white/[0.06]">
                  {lifecycleStages.map((s) => (
                    <SelectItem key={s} value={s} className="text-[13px] text-zinc-300 capitalize">
                      {s.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              className="h-8 text-[13px] text-zinc-400 border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateContact}
              disabled={creating || !newFirstName.trim()}
              className="bg-white text-zinc-900 hover:bg-zinc-100 text-[13px] h-8"
            >
              {creating ? "Creating..." : "Create contact"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
