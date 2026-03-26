"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

type Contact = {
  id: string;
  name: string;
  email: string;
  company: string;
  stage: string;
  lastActivity: string;
  owner: string;
};

const mockContacts: Contact[] = [
  { id: "1", name: "Sarah Chen", email: "sarah@acmecorp.com", company: "Acme Corp", stage: "Customer", lastActivity: "2026-03-25", owner: "Jake" },
  { id: "2", name: "Marcus Johnson", email: "marcus@techlabs.io", company: "TechLabs", stage: "Lead", lastActivity: "2026-03-24", owner: "Jake" },
  { id: "3", name: "Emily Rodriguez", email: "emily@brightpath.co", company: "BrightPath", stage: "Opportunity", lastActivity: "2026-03-23", owner: "Jake" },
  { id: "4", name: "David Kim", email: "david@novasoft.com", company: "NovaSoft", stage: "Customer", lastActivity: "2026-03-22", owner: "Jake" },
  { id: "5", name: "Lisa Thompson", email: "lisa@greenleaf.org", company: "GreenLeaf", stage: "Lead", lastActivity: "2026-03-21", owner: "Jake" },
  { id: "6", name: "James Wilson", email: "james@skylinedev.com", company: "Skyline Dev", stage: "Opportunity", lastActivity: "2026-03-20", owner: "Jake" },
  { id: "7", name: "Anna Petrov", email: "anna@cloudnine.io", company: "CloudNine", stage: "Lead", lastActivity: "2026-03-19", owner: "Jake" },
  { id: "8", name: "Robert Chang", email: "robert@dataflow.com", company: "DataFlow", stage: "Customer", lastActivity: "2026-03-18", owner: "Jake" },
];

const stages = ["All", "Lead", "Opportunity", "Customer"];

type SortKey = keyof Contact;
type SortDir = "asc" | "desc";

export default function ContactsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    let list = mockContacts;
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
  }, [search, stageFilter, sortKey, sortDir]);

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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[15px] font-medium text-white">Contacts</h1>
        <Button
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
          {filtered.length} of {mockContacts.length} contacts
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
    </div>
  );
}
