"use client";

import { useState, useMemo } from "react";
import { Plus, ArrowUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Company = {
  id: string;
  name: string;
  domain: string;
  industry: string;
  contacts: number;
  deals: number;
  owner: string;
};

const mockCompanies: Company[] = [
  { id: "1", name: "Acme Corp", domain: "acmecorp.com", industry: "Technology", contacts: 3, deals: 2, owner: "Jake" },
  { id: "2", name: "TechLabs", domain: "techlabs.io", industry: "SaaS", contacts: 2, deals: 1, owner: "Jake" },
  { id: "3", name: "BrightPath", domain: "brightpath.co", industry: "Consulting", contacts: 1, deals: 1, owner: "Jake" },
  { id: "4", name: "NovaSoft", domain: "novasoft.com", industry: "Technology", contacts: 2, deals: 1, owner: "Jake" },
  { id: "5", name: "GreenLeaf", domain: "greenleaf.org", industry: "Non-Profit", contacts: 1, deals: 1, owner: "Jake" },
  { id: "6", name: "Skyline Dev", domain: "skylinedev.com", industry: "Development", contacts: 1, deals: 1, owner: "Jake" },
  { id: "7", name: "CloudNine", domain: "cloudnine.io", industry: "Cloud Services", contacts: 1, deals: 1, owner: "Jake" },
  { id: "8", name: "DataFlow", domain: "dataflow.com", industry: "Data Analytics", contacts: 1, deals: 1, owner: "Jake" },
];

type SortKey = keyof Company;
type SortDir = "asc" | "desc";

export default function CompaniesPage() {
  const [search, setSearch] = useState("");
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
    let list = mockCompanies;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.domain.toLowerCase().includes(q) ||
          c.industry.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [search, sortKey, sortDir]);

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[15px] font-medium text-white">Companies</h1>
        <Button className="bg-white text-zinc-900 hover:bg-zinc-100 text-[13px] h-8 px-3">
          <Plus className="size-4 mr-1" />
          Add company
        </Button>
      </div>

      <div className="relative max-w-xs mb-4">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-zinc-600" />
        <Input
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 bg-white/[0.02] border-white/[0.06] text-[13px] text-zinc-300 placeholder:text-zinc-600"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[13px] text-zinc-600">No companies yet. Add your first company.</p>
        </div>
      ) : (
        <div className="border border-white/[0.04] rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.04] hover:bg-transparent">
                <TableHead className="h-9"><SortHeader label="Name" sortKeyName="name" /></TableHead>
                <TableHead className="h-9"><SortHeader label="Domain" sortKeyName="domain" /></TableHead>
                <TableHead className="h-9 hidden md:table-cell"><SortHeader label="Industry" sortKeyName="industry" /></TableHead>
                <TableHead className="h-9 hidden lg:table-cell"><SortHeader label="Contacts" sortKeyName="contacts" /></TableHead>
                <TableHead className="h-9 hidden lg:table-cell"><SortHeader label="Deals" sortKeyName="deals" /></TableHead>
                <TableHead className="h-9 hidden lg:table-cell"><SortHeader label="Owner" sortKeyName="owner" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((company) => (
                <TableRow key={company.id} className="border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors">
                  <TableCell className="text-[13px] text-white font-medium py-2.5">{company.name}</TableCell>
                  <TableCell className="text-[13px] text-zinc-400 py-2.5">{company.domain}</TableCell>
                  <TableCell className="text-[13px] text-zinc-400 py-2.5 hidden md:table-cell">{company.industry}</TableCell>
                  <TableCell className="text-[13px] text-zinc-500 py-2.5 hidden lg:table-cell">{company.contacts}</TableCell>
                  <TableCell className="text-[13px] text-zinc-500 py-2.5 hidden lg:table-cell">{company.deals}</TableCell>
                  <TableCell className="text-[13px] text-zinc-500 py-2.5 hidden lg:table-cell">{company.owner}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between mt-4">
        <p className="text-[11px] text-zinc-600">{filtered.length} of {mockCompanies.length} companies</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled className="text-[11px] text-zinc-600 border-white/[0.06] bg-transparent">Previous</Button>
          <Button variant="outline" size="sm" disabled className="text-[11px] text-zinc-600 border-white/[0.06] bg-transparent">Next</Button>
        </div>
      </div>
    </div>
  );
}
