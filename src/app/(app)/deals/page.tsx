"use client";

import { useState, useEffect, useRef, useCallback, DragEvent, TouchEvent as ReactTouchEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import type { Deal as DBDeal } from "@/lib/types";

type Deal = {
  id: string;
  name: string;
  company: string;
  amount: string;
  closeDate: string;
  owner: string;
  stage: string;
};

const stages = [
  "Qualified",
  "Meeting Scheduled",
  "Proposal Sent",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
];

const stageColor = (stage: string) => {
  switch (stage) {
    case "Closed Won": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "Closed Lost": return "bg-red-500/10 text-red-400 border-red-500/20";
    case "Negotiation": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "Proposal Sent": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "Meeting Scheduled": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  }
};

function formatAmount(amount: number): string {
  return "$" + amount.toLocaleString("en-US");
}

function KanbanBoard({ deals, onMove }: { deals: Deal[]; onMove: (dealId: string, newStage: string) => void }) {
  const router = useRouter();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const handleDragStart = (e: DragEvent, dealId: string) => {
    setDraggedId(dealId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", dealId);
  };

  const handleDragOver = (e: DragEvent, stage: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: DragEvent, stage: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("text/plain");
    if (dealId) {
      onMove(dealId, stage);
    }
    setDraggedId(null);
    setDragOverStage(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverStage(null);
  };

  // Touch drag support
  const touchIdRef = useRef<string | null>(null);

  const handleTouchStart = useCallback((dealId: string) => (e: ReactTouchEvent) => {
    // Long-press delay to avoid interfering with scroll
    touchIdRef.current = dealId;
    setDraggedId(dealId);
  }, []);

  const handleTouchMove = useCallback((e: ReactTouchEvent) => {
    if (!touchIdRef.current) return;
    e.preventDefault(); // prevent scroll while dragging
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const col = el?.closest<HTMLElement>("[data-stage]");
    setDragOverStage(col?.dataset.stage ?? null);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchIdRef.current && dragOverStage) {
      onMove(touchIdRef.current, dragOverStage);
    }
    touchIdRef.current = null;
    setDraggedId(null);
    setDragOverStage(null);
  }, [dragOverStage, onMove]);

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageDeals = deals.filter((d) => d.stage === stage);
        const isOver = dragOverStage === stage;
        return (
          <div
            key={stage}
            data-stage={stage}
            className={`min-w-[220px] w-[220px] shrink-0 rounded-lg transition-colors ${
              isOver ? "bg-white/[0.03]" : ""
            }`}
            onDragOver={(e) => handleDragOver(e, stage)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage)}
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-[11px] uppercase tracking-wide text-zinc-600">{stage}</h3>
              <span className="text-[11px] text-zinc-700">{stageDeals.length}</span>
            </div>
            <div className="space-y-2 min-h-[80px]">
              {stageDeals.map((deal) => (
                <div
                  key={deal.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, deal.id)}
                  onDragEnd={handleDragEnd}
                  onTouchStart={handleTouchStart(deal.id)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onClick={() => { if (!draggedId) router.push(`/deals/${deal.id}`); }}
                  className={`p-3 rounded-lg border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] transition-all cursor-grab active:cursor-grabbing select-none ${
                    draggedId === deal.id ? "opacity-40 scale-95" : ""
                  }`}
                >
                  <p className="text-[13px] text-white mb-1">{deal.name}</p>
                  <p className="text-[11px] text-zinc-500 mb-2">{deal.company}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-zinc-300">{deal.amount}</span>
                    <Avatar className="size-5">
                      <AvatarFallback className="bg-white/[0.06] text-[9px] text-zinc-500">
                        {deal.owner.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <p className="text-[11px] text-zinc-600 mt-1">Close: {deal.closeDate}</p>
                </div>
              ))}
              {stageDeals.length === 0 && (
                <div className={`p-3 rounded-lg border border-dashed text-center transition-colors ${
                  isOver ? "border-white/[0.12] bg-white/[0.02]" : "border-white/[0.04]"
                }`}>
                  <p className="text-[11px] text-zinc-700">
                    {isOver ? "Drop here" : "No deals"}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TableView({ deals }: { deals: Deal[] }) {
  const router = useRouter();
  return (
    <div className="border border-white/[0.04] rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-white/[0.04] hover:bg-transparent">
            <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600">Name</TableHead>
            <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600">Company</TableHead>
            <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600">Amount</TableHead>
            <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600">Stage</TableHead>
            <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600 hidden md:table-cell">Close Date</TableHead>
            <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600 hidden md:table-cell">Owner</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((deal) => (
            <TableRow key={deal.id} onClick={() => router.push(`/deals/${deal.id}`)} className="border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors">
              <TableCell className="text-[13px] text-white font-medium py-2.5">{deal.name}</TableCell>
              <TableCell className="text-[13px] text-zinc-400 py-2.5">{deal.company}</TableCell>
              <TableCell className="text-[13px] text-zinc-300 py-2.5">{deal.amount}</TableCell>
              <TableCell className="py-2.5">
                <Badge variant="outline" className={`text-[11px] font-normal ${stageColor(deal.stage)}`}>
                  {deal.stage}
                </Badge>
              </TableCell>
              <TableCell className="text-[13px] text-zinc-500 py-2.5 hidden md:table-cell">{deal.closeDate}</TableCell>
              <TableCell className="text-[13px] text-zinc-500 py-2.5 hidden md:table-cell">{deal.owner}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function DealsPage() {
  const [view, setView] = useState("board");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newDealName, setNewDealName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newStage, setNewStage] = useState("");
  const [newCloseDate, setNewCloseDate] = useState("");
  const [newCompanyId, setNewCompanyId] = useState("");
  const [newContactId, setNewContactId] = useState("");
  const [companiesList, setCompaniesList] = useState<{ id: string; name: string }[]>([]);
  const [contactsList, setContactsList] = useState<{ id: string; first_name: string; last_name: string }[]>([]);

  // Fetch companies and contacts for dropdowns
  useEffect(() => {
    const supabase = createClient();
    supabase.from("companies").select("id, name").then(({ data }) => {
      if (data) setCompaniesList(data);
    });
    supabase.from("contacts").select("id, first_name, last_name").then(({ data }) => {
      if (data) setContactsList(data);
    });
  }, []);

  async function handleCreateDeal() {
    setCreating(true);
    try {
      const supabase = createClient();
      const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
      const { error } = await supabase.from("deals").insert({
        name: newDealName,
        amount: newAmount ? parseFloat(newAmount) : 0,
        stage: newStage || "Qualified",
        close_date: newCloseDate || null,
        company_id: newCompanyId || null,
        contact_id: newContactId || null,
        tenant_id: tenantId,
      });
      if (error) throw error;
      setCreateOpen(false);
      setNewDealName("");
      setNewAmount("");
      setNewStage("");
      setNewCloseDate("");
      setNewCompanyId("");
      setNewContactId("");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Failed to create deal:", err);
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    const supabase = createClient();
    async function fetchDeals() {
      try {
        const { data, error } = await supabase
          .from("deals")
          .select("*, companies(name)");

        if (error) throw error;

        if (data && data.length > 0) {
          const mapped: Deal[] = (data as DBDeal[]).map((d) => ({
            id: d.id,
            name: d.name || "",
            company: d.companies?.name || "",
            amount: formatAmount(d.amount || 0),
            closeDate: d.close_date ? d.close_date.split("T")[0] : "",
            owner: d.owner || "",
            stage: d.stage || "Qualified",
          }));
          setDeals(mapped);
        } else {
          setDeals([]);
        }
      } catch {
        setDeals([]);
      } finally {
        setLoading(false);
      }
    }
    fetchDeals();
  }, [refreshKey]);

  const handleMoveDeal = async (dealId: string, newStage: string) => {
    // Optimistically update UI
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
    );

    // Persist to Supabase
    try {
      const supabase = createClient();
      await supabase
        .from("deals")
        .update({ stage: newStage })
        .eq("id", dealId);
    } catch {
      // Silently fail — optimistic update stays in place
    }
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
        <h1 className="text-[15px] font-medium text-white">Deals</h1>
        <Button onClick={() => setCreateOpen(true)} className="bg-white text-zinc-900 hover:bg-zinc-100 text-[13px] h-8 px-3">
          <Plus className="size-4 mr-1" />
          Add deal
        </Button>
      </div>

      <Tabs value={view} onValueChange={setView} className="mb-4">
        <TabsList className="bg-white/[0.03] border border-white/[0.04] h-8">
          <TabsTrigger
            value="board"
            className="text-[13px] text-zinc-500 data-[state=active]:text-white data-[state=active]:bg-white/[0.06] h-6 px-3"
          >
            Board
          </TabsTrigger>
          <TabsTrigger
            value="table"
            className="text-[13px] text-zinc-500 data-[state=active]:text-white data-[state=active]:bg-white/[0.06] h-6 px-3"
          >
            Table
          </TabsTrigger>
        </TabsList>
        <TabsContent value="board" className="mt-4">
          {deals.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[13px] text-zinc-600">No deals yet. Create your first deal.</p>
            </div>
          ) : (
            <KanbanBoard deals={deals} onMove={handleMoveDeal} />
          )}
        </TabsContent>
        <TabsContent value="table" className="mt-4">
          {deals.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[13px] text-zinc-600">No deals yet. Create your first deal.</p>
            </div>
          ) : (
            <TableView deals={deals} />
          )}
        </TabsContent>
      </Tabs>

      {/* Create Deal Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[#111113] border-white/[0.06] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px] text-white">Add deal</DialogTitle>
            <DialogDescription className="text-[13px] text-zinc-500">
              Create a new deal record.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-zinc-600">Name</Label>
              <Input
                value={newDealName}
                onChange={(e) => setNewDealName(e.target.value)}
                placeholder="Deal name"
                className="h-8 bg-white/[0.02] border-white/[0.06] text-[13px] text-zinc-300 placeholder:text-zinc-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-zinc-600">Amount</Label>
                <Input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="0"
                  className="h-8 bg-white/[0.02] border-white/[0.06] text-[13px] text-zinc-300 placeholder:text-zinc-600"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-zinc-600">Stage</Label>
                <Select value={newStage} onValueChange={setNewStage}>
                  <SelectTrigger className="h-8 bg-white/[0.02] border-white/[0.06] text-[13px] text-zinc-300">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111113] border-white/[0.06]">
                    {stages.map((s) => (
                      <SelectItem key={s} value={s} className="text-[13px] text-zinc-300">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-zinc-600">Close date</Label>
              <Input
                type="date"
                value={newCloseDate}
                onChange={(e) => setNewCloseDate(e.target.value)}
                className="h-8 bg-white/[0.02] border-white/[0.06] text-[13px] text-zinc-300 placeholder:text-zinc-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
                <Label className="text-[11px] text-zinc-600">Contact</Label>
                <Select value={newContactId} onValueChange={setNewContactId}>
                  <SelectTrigger className="h-8 bg-white/[0.02] border-white/[0.06] text-[13px] text-zinc-300">
                    <SelectValue placeholder="Select contact" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111113] border-white/[0.06]">
                    {contactsList.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-[13px] text-zinc-300">
                        {c.first_name} {c.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              onClick={handleCreateDeal}
              disabled={creating || !newDealName.trim()}
              className="bg-white text-zinc-900 hover:bg-zinc-100 text-[13px] h-8"
            >
              {creating ? "Creating..." : "Create deal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
