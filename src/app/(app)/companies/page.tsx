"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import ExportButton from "@/components/shared/ExportButton";
import type { Company as DBCompany } from "@/lib/types";

type Company = {
  id: string;
  name: string;
  domain: string;
  industry: string;
  contacts: number;
  deals: number;
  owner: string;
};

type SortKey = keyof Company;
type SortDir = "asc" | "desc";

const companySizes = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [refreshKey, setRefreshKey] = useState(0);

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [newIndustry, setNewIndustry] = useState("");
  const [newSize, setNewSize] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newCountry, setNewCountry] = useState("");

  async function handleCreateCompany() {
    setCreating(true);
    try {
      const supabase = createClient();
      const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
      const { error } = await supabase.from("companies").insert({
        name: newName,
        domain: newDomain || null,
        industry: newIndustry || null,
        size: newSize || null,
        city: newCity || null,
        state: newState || null,
        country: newCountry || null,
        tenant_id: tenantId,
      });
      if (error) throw error;
      setCreateOpen(false);
      setNewName("");
      setNewDomain("");
      setNewIndustry("");
      setNewSize("");
      setNewCity("");
      setNewState("");
      setNewCountry("");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Failed to create company:", err);
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    const supabase = createClient();
    async function fetchCompanies() {
      try {
        const { data, error } = await supabase
          .from("companies")
          .select("*");

        if (error) throw error;

        if (data && data.length > 0) {
          const mapped: Company[] = (data as DBCompany[]).map((c) => ({
            id: c.id,
            name: c.name || "",
            domain: c.domain || "",
            industry: c.industry || "",
            contacts: 0, // counts would need separate queries or aggregates
            deals: 0,
            owner: c.owner || "",
          }));
          setCompanies(mapped);
          setTotalCount(mapped.length);
        } else {
          setCompanies([]);
          setTotalCount(0);
        }
      } catch {
        // Supabase query failed — show empty state
        setCompanies([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    }
    fetchCompanies();
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
    let list = companies;
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
  }, [companies, search, sortKey, sortDir]);

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
      <div className="p-6">
        <p className="text-[13px] text-[var(--text-muted)]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[15px] font-medium text-[var(--text-primary)]">Companies</h1>
        <div className="flex items-center gap-2">
          <ExportButton
            data={companies as unknown as Record<string, unknown>[]}
            columns={["name", "domain", "industry", "size", "city", "state"]}
            filename="companies"
          />
          <Button onClick={() => setCreateOpen(true)} className="bg-[var(--surface-inverse)] text-[var(--text-inverse)] hover:opacity-90 text-[13px] h-8 px-3">
            <Plus className="size-4 mr-1" />
            Add company
          </Button>
        </div>
      </div>

      <div className="relative max-w-xs mb-4">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]" />
        <Input
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 bg-[var(--overlay-weak)] border-[var(--border)] text-[13px] text-[var(--text-secondary)] placeholder:text-[var(--text-muted)]"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[13px] text-[var(--text-muted)]">No companies yet. Add your first company.</p>
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[var(--border)] hover:bg-transparent">
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
                <TableRow key={company.id} onClick={() => router.push(`/companies/${company.id}`)} className="border-[var(--border)] hover:bg-[var(--overlay-weak)] cursor-pointer transition-colors">
                  <TableCell className="text-[13px] text-[var(--text-primary)] font-medium py-2.5">{company.name}</TableCell>
                  <TableCell className="text-[13px] text-[var(--text-tertiary)] py-2.5">{company.domain}</TableCell>
                  <TableCell className="text-[13px] text-[var(--text-tertiary)] py-2.5 hidden md:table-cell">{company.industry}</TableCell>
                  <TableCell className="text-[13px] text-[var(--text-muted)] py-2.5 hidden lg:table-cell">{company.contacts}</TableCell>
                  <TableCell className="text-[13px] text-[var(--text-muted)] py-2.5 hidden lg:table-cell">{company.deals}</TableCell>
                  <TableCell className="text-[13px] text-[var(--text-muted)] py-2.5 hidden lg:table-cell">{company.owner}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between mt-4">
        <p className="text-[11px] text-[var(--text-muted)]">{filtered.length} of {totalCount} companies</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled className="text-[11px] text-[var(--text-muted)] border-[var(--border)] bg-transparent">Previous</Button>
          <Button variant="outline" size="sm" disabled className="text-[11px] text-[var(--text-muted)] border-[var(--border)] bg-transparent">Next</Button>
        </div>
      </div>

      {/* Create Company Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[var(--surface)] border-[var(--border)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px] text-[var(--text-primary)]">Add company</DialogTitle>
            <DialogDescription className="text-[13px] text-[var(--text-muted)]">
              Create a new company record.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-[var(--text-muted)]">Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Company name"
                  className="h-8 bg-[var(--overlay-weak)] border-[var(--border)] text-[13px] text-[var(--text-secondary)] placeholder:text-[var(--text-muted)]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-[var(--text-muted)]">Domain</Label>
                <Input
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="example.com"
                  className="h-8 bg-[var(--overlay-weak)] border-[var(--border)] text-[13px] text-[var(--text-secondary)] placeholder:text-[var(--text-muted)]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-[var(--text-muted)]">Industry</Label>
                <Input
                  value={newIndustry}
                  onChange={(e) => setNewIndustry(e.target.value)}
                  placeholder="e.g. Technology"
                  className="h-8 bg-[var(--overlay-weak)] border-[var(--border)] text-[13px] text-[var(--text-secondary)] placeholder:text-[var(--text-muted)]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-[var(--text-muted)]">Size</Label>
                <Select value={newSize} onValueChange={setNewSize}>
                  <SelectTrigger className="h-8 bg-[var(--overlay-weak)] border-[var(--border)] text-[13px] text-[var(--text-secondary)]">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--surface)] border-[var(--border)]">
                    {companySizes.map((s) => (
                      <SelectItem key={s} value={s} className="text-[13px] text-[var(--text-secondary)]">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-[var(--text-muted)]">City</Label>
                <Input
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="City"
                  className="h-8 bg-[var(--overlay-weak)] border-[var(--border)] text-[13px] text-[var(--text-secondary)] placeholder:text-[var(--text-muted)]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-[var(--text-muted)]">State</Label>
                <Input
                  value={newState}
                  onChange={(e) => setNewState(e.target.value)}
                  placeholder="State"
                  className="h-8 bg-[var(--overlay-weak)] border-[var(--border)] text-[13px] text-[var(--text-secondary)] placeholder:text-[var(--text-muted)]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-[var(--text-muted)]">Country</Label>
                <Input
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value)}
                  placeholder="Country"
                  className="h-8 bg-[var(--overlay-weak)] border-[var(--border)] text-[13px] text-[var(--text-secondary)] placeholder:text-[var(--text-muted)]"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              className="h-8 text-[13px] text-[var(--text-tertiary)] border-[var(--border)] bg-[var(--overlay-weak)] hover:bg-[var(--overlay-soft)]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCompany}
              disabled={creating || !newName.trim()}
              className="bg-[var(--surface-inverse)] text-[var(--text-inverse)] hover:opacity-90 text-[13px] h-8"
            >
              {creating ? "Creating..." : "Create company"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
