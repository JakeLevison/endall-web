"use client";

import { useState, useEffect } from "react";
import { Plus, Send, Clock, CheckCircle, XCircle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

type Prospect = {
  id: string;
  company_name: string;
  contact_name: string;
  contact_title: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  employee_count: string;
  priority: "A" | "B" | "C";
  status: string;
  qualifying_signal: string;
  last_contacted: string | null;
  next_follow_up: string | null;
  notes: string;
};

const statusColor: Record<string, string> = {
  new: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  contacted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  replied: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  meeting_scheduled: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  demo_completed: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  proposal_sent: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  won: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  lost: "bg-red-500/10 text-red-400 border-red-500/20",
  deferred: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
};

const statusLabel: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  replied: "Replied",
  meeting_scheduled: "Meeting",
  demo_completed: "Demo Done",
  proposal_sent: "Proposal",
  won: "Won",
  lost: "Lost",
  deferred: "Deferred",
};

const priorityColor: Record<string, string> = {
  A: "bg-red-500/10 text-red-400 border-red-500/20",
  B: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  C: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

export default function OutreachPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  // Form fields
  const [newCompany, setNewCompany] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newSize, setNewSize] = useState("");
  const [newPriority, setNewPriority] = useState<"A" | "B" | "C">("B");
  const [newSignal, setNewSignal] = useState("");

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      try {
        const { data } = await supabase
          .from("outreach_prospects")
          .select("*")
          .order("priority")
          .order("created_at", { ascending: false });

        if (data) {
          setProspects(
            data.map((p: Record<string, unknown>) => ({
              id: p.id as string,
              company_name: (p.company_name as string) || "",
              contact_name: (p.contact_name as string) || "",
              contact_title: (p.contact_title as string) || "",
              email: (p.email as string) || "",
              phone: (p.phone as string) || "",
              city: (p.city as string) || "",
              state: (p.state as string) || "",
              employee_count: (p.employee_count as string) || "",
              priority: (p.priority as "A" | "B" | "C") || "B",
              status: (p.status as string) || "new",
              qualifying_signal: (p.qualifying_signal as string) || "",
              last_contacted: p.last_contacted as string | null,
              next_follow_up: p.next_follow_up as string | null,
              notes: (p.notes as string) || "",
            }))
          );
        }
      } catch {
        // Table might not exist yet
      }
      setLoading(false);
    }
    fetch();
  }, []);

  const handleCreate = async () => {
    if (!newCompany.trim()) return;
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("outreach_prospects")
        .insert({
          company_name: newCompany.trim(),
          contact_name: newContact.trim() || null,
          contact_title: newTitle.trim() || null,
          email: newEmail.trim() || null,
          phone: newPhone.trim() || null,
          city: newCity.trim() || null,
          state: newState.trim() || null,
          employee_count: newSize.trim() || null,
          priority: newPriority,
          qualifying_signal: newSignal.trim() || null,
          tenant_id: process.env.NEXT_PUBLIC_TENANT_ID,
        })
        .select()
        .single();

      if (data) {
        setProspects((prev) => [
          {
            id: data.id,
            company_name: data.company_name || "",
            contact_name: data.contact_name || "",
            contact_title: data.contact_title || "",
            email: data.email || "",
            phone: data.phone || "",
            city: data.city || "",
            state: data.state || "",
            employee_count: data.employee_count || "",
            priority: data.priority || "B",
            status: "new",
            qualifying_signal: data.qualifying_signal || "",
            last_contacted: null,
            next_follow_up: null,
            notes: "",
          },
          ...prev,
        ]);
      }
    } catch {
      // silent
    }

    setNewCompany("");
    setNewContact("");
    setNewTitle("");
    setNewEmail("");
    setNewPhone("");
    setNewCity("");
    setNewState("");
    setNewSize("");
    setNewPriority("B");
    setNewSignal("");
    setDialogOpen(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setProspects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
    try {
      const supabase = createClient();
      await supabase
        .from("outreach_prospects")
        .update({ status: newStatus, last_contacted: newStatus !== "new" ? new Date().toISOString() : null })
        .eq("id", id);
    } catch {
      // silent
    }
  };

  const filtered = prospects.filter((p) => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (filterPriority !== "all" && p.priority !== filterPriority) return false;
    return true;
  });

  const stats = {
    total: prospects.length,
    contacted: prospects.filter((p) => p.status !== "new").length,
    replied: prospects.filter((p) => ["replied", "meeting_scheduled", "demo_completed", "proposal_sent", "won"].includes(p.status)).length,
    won: prospects.filter((p) => p.status === "won").length,
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-[13px] text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[15px] font-medium text-white">Outreach</h1>
          <p className="text-[11px] text-zinc-600 mt-0.5">
            {stats.total} prospects · {stats.contacted} contacted · {stats.replied} replied · {stats.won} won
          </p>
        </div>
        <Button
          className="bg-white text-zinc-900 hover:bg-zinc-100 text-[13px] h-8 px-3"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="size-4 mr-1" />
          Add prospect
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5">
          <Filter className="size-3.5 text-zinc-600" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-[12px] text-zinc-400 h-7 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#111113] border-white/[0.06]">
              <SelectItem value="all" className="text-[12px] text-zinc-300">All stages</SelectItem>
              {Object.entries(statusLabel).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-[12px] text-zinc-300">{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-[12px] text-zinc-400 h-7 w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#111113] border-white/[0.06]">
            <SelectItem value="all" className="text-[12px] text-zinc-300">All priority</SelectItem>
            <SelectItem value="A" className="text-[12px] text-zinc-300">A — High</SelectItem>
            <SelectItem value="B" className="text-[12px] text-zinc-300">B — Medium</SelectItem>
            <SelectItem value="C" className="text-[12px] text-zinc-300">C — Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Send className="size-8 text-zinc-700 mb-3" />
          <p className="text-[13px] text-zinc-500 mb-1">No prospects yet</p>
          <p className="text-[11px] text-zinc-600">Add HVAC companies to start your outreach campaign.</p>
        </div>
      ) : (
        <div className="border border-white/[0.04] rounded-lg overflow-hidden overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.04] hover:bg-transparent">
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600">Company</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600">Contact</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600 hidden md:table-cell">Location</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600">Priority</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600">Status</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600 hidden lg:table-cell">Signal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} className="border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <TableCell className="py-2.5">
                    <p className="text-[13px] text-white font-medium">{p.company_name}</p>
                    {p.employee_count && <p className="text-[11px] text-zinc-600">{p.employee_count} employees</p>}
                  </TableCell>
                  <TableCell className="py-2.5">
                    <p className="text-[13px] text-zinc-300">{p.contact_name || "—"}</p>
                    {p.email && <p className="text-[11px] text-zinc-600">{p.email}</p>}
                  </TableCell>
                  <TableCell className="py-2.5 hidden md:table-cell">
                    <p className="text-[13px] text-zinc-400">{p.city && p.state ? `${p.city}, ${p.state}` : "—"}</p>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <Badge variant="outline" className={`text-[11px] font-medium ${priorityColor[p.priority]}`}>
                      {p.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <Select value={p.status} onValueChange={(v) => handleUpdateStatus(p.id, v)}>
                      <SelectTrigger className={`h-6 w-28 text-[11px] border ${statusColor[p.status] || statusColor.new} bg-transparent`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111113] border-white/[0.06]">
                        {Object.entries(statusLabel).map(([k, v]) => (
                          <SelectItem key={k} value={k} className="text-[12px] text-zinc-300">{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="py-2.5 hidden lg:table-cell">
                    <p className="text-[11px] text-zinc-500 max-w-[200px] truncate">{p.qualifying_signal || "—"}</p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add prospect dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#111113] border-white/[0.06] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[15px] text-white">Add prospect</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-[11px] uppercase tracking-wide text-zinc-600 mb-1">Company name</Label>
              <Input value={newCompany} onChange={(e) => setNewCompany(e.target.value)} placeholder="Greenleaf HVAC" className="bg-white/[0.03] border-white/[0.06] text-[13px] text-white h-8" />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wide text-zinc-600 mb-1">Contact name</Label>
              <Input value={newContact} onChange={(e) => setNewContact(e.target.value)} placeholder="John Smith" className="bg-white/[0.03] border-white/[0.06] text-[13px] text-white h-8" />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wide text-zinc-600 mb-1">Title</Label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Owner / GM" className="bg-white/[0.03] border-white/[0.06] text-[13px] text-white h-8" />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wide text-zinc-600 mb-1">Email</Label>
              <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="john@company.com" className="bg-white/[0.03] border-white/[0.06] text-[13px] text-white h-8" />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wide text-zinc-600 mb-1">Phone</Label>
              <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="555-555-5555" className="bg-white/[0.03] border-white/[0.06] text-[13px] text-white h-8" />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wide text-zinc-600 mb-1">City</Label>
              <Input value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="Austin" className="bg-white/[0.03] border-white/[0.06] text-[13px] text-white h-8" />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wide text-zinc-600 mb-1">State</Label>
              <Input value={newState} onChange={(e) => setNewState(e.target.value)} placeholder="TX" className="bg-white/[0.03] border-white/[0.06] text-[13px] text-white h-8" />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wide text-zinc-600 mb-1">Employees</Label>
              <Input value={newSize} onChange={(e) => setNewSize(e.target.value)} placeholder="50-100" className="bg-white/[0.03] border-white/[0.06] text-[13px] text-white h-8" />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wide text-zinc-600 mb-1">Priority</Label>
              <Select value={newPriority} onValueChange={(v) => setNewPriority(v as "A" | "B" | "C")}>
                <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-[13px] text-white h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111113] border-white/[0.06]">
                  <SelectItem value="A" className="text-[12px] text-zinc-300">A — High</SelectItem>
                  <SelectItem value="B" className="text-[12px] text-zinc-300">B — Medium</SelectItem>
                  <SelectItem value="C" className="text-[12px] text-zinc-300">C — Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-[11px] uppercase tracking-wide text-zinc-600 mb-1">Qualifying signal</Label>
              <Input value={newSignal} onChange={(e) => setNewSignal(e.target.value)} placeholder="Expanding to commercial, recently hired..." className="bg-white/[0.03] border-white/[0.06] text-[13px] text-white h-8" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="text-[13px] h-8 text-zinc-400 border-white/[0.06] bg-white/[0.02]" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-white text-zinc-900 hover:bg-zinc-100 text-[13px] h-8" onClick={handleCreate} disabled={!newCompany.trim()}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
