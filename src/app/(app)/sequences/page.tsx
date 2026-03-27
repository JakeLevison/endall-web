"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Mail } from "lucide-react";
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
import { createClient } from "@/lib/supabase/client";

type Sequence = {
  id: string;
  name: string;
  status: "active" | "draft" | "paused" | "archived";
  steps: number;
  enrolled: number;
  reply_rate: number;
  created_at: string;
};

const fallbackSequences: Sequence[] = [
  { id: "1", name: "Cold Outreach - SaaS", status: "active", steps: 5, enrolled: 142, reply_rate: 18.3, created_at: "2026-03-10" },
  { id: "2", name: "Post-Demo Follow-up", status: "active", steps: 3, enrolled: 67, reply_rate: 34.2, created_at: "2026-03-12" },
  { id: "3", name: "Re-engagement Campaign", status: "draft", steps: 4, enrolled: 0, reply_rate: 0, created_at: "2026-03-20" },
  { id: "4", name: "Inbound Lead Nurture", status: "paused", steps: 6, enrolled: 89, reply_rate: 22.1, created_at: "2026-02-28" },
  { id: "5", name: "Conference Attendees", status: "archived", steps: 3, enrolled: 210, reply_rate: 12.5, created_at: "2026-01-15" },
  { id: "6", name: "Partner Intro Sequence", status: "active", steps: 4, enrolled: 31, reply_rate: 41.9, created_at: "2026-03-18" },
];

const statusColor = (status: string) => {
  switch (status) {
    case "active": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "draft": return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    case "paused": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "archived": return "bg-red-500/10 text-red-400 border-red-500/20";
    default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  }
};

export default function SequencesPage() {
  const router = useRouter();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    async function fetchSequences() {
      try {
        const { data, error } = await supabase
          .from("sequences")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setSequences(data.map((s: Record<string, unknown>) => ({
            id: s.id as string,
            name: (s.name as string) || "",
            status: (s.status as Sequence["status"]) || "draft",
            steps: (s.steps as number) || 0,
            enrolled: (s.enrolled as number) || 0,
            reply_rate: (s.reply_rate as number) || 0,
            created_at: s.created_at ? (s.created_at as string).split("T")[0] : "",
          })));
        } else {
          setSequences([]);
        }
      } catch {
        setSequences(fallbackSequences);
        setUsingFallback(true);
      } finally {
        setLoading(false);
      }
    }
    fetchSequences();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);

    if (usingFallback) {
      const newSeq: Sequence = {
        id: String(Date.now()),
        name: newName.trim(),
        status: "draft",
        steps: 0,
        enrolled: 0,
        reply_rate: 0,
        created_at: new Date().toISOString().split("T")[0],
      };
      setSequences((prev) => [newSeq, ...prev]);
    } else {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("sequences")
          .insert({
            name: newName.trim(),
            status: "draft",
            tenant_id: process.env.NEXT_PUBLIC_TENANT_ID,
          })
          .select()
          .single();

        if (error) throw error;

        setSequences((prev) => [{
          id: data.id,
          name: data.name || "",
          status: data.status || "draft",
          steps: data.steps || 0,
          enrolled: data.enrolled || 0,
          reply_rate: data.reply_rate || 0,
          created_at: data.created_at ? data.created_at.split("T")[0] : "",
        }, ...prev]);
      } catch {
        // Silently fail
      }
    }

    setNewName("");
    setDialogOpen(false);
    setCreating(false);
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
        <h1 className="text-[15px] font-medium text-white">Sequences</h1>
        <Button
          className="bg-white text-zinc-900 hover:bg-zinc-100 text-[13px] h-8 px-3"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="size-4 mr-1" />
          Create sequence
        </Button>
      </div>

      {sequences.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="size-10 rounded-lg bg-white/[0.03] border border-white/[0.04] flex items-center justify-center mb-4">
            <Mail className="size-5 text-zinc-600" />
          </div>
          <p className="text-[13px] text-zinc-500 mb-1">No sequences yet</p>
          <p className="text-[11px] text-zinc-600">Create multi-step email cadences with smart scheduling and auto-unenroll.</p>
        </div>
      ) : (
        <div className="border border-white/[0.04] rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.04] hover:bg-transparent">
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600">Name</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600">Status</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600">Steps</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600">Enrolled</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600 hidden md:table-cell">Reply Rate</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600 hidden md:table-cell">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sequences.map((seq) => (
                <TableRow
                  key={seq.id}
                  className="border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors"
                  onClick={() => router.push(`/sequences/${seq.id}`)}
                >
                  <TableCell className="text-[13px] text-white font-medium py-2.5">{seq.name}</TableCell>
                  <TableCell className="py-2.5">
                    <Badge variant="outline" className={`text-[11px] font-normal capitalize ${statusColor(seq.status)}`}>
                      {seq.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[13px] text-zinc-400 py-2.5">{seq.steps}</TableCell>
                  <TableCell className="text-[13px] text-zinc-400 py-2.5">{seq.enrolled}</TableCell>
                  <TableCell className="text-[13px] text-zinc-500 py-2.5 hidden md:table-cell">{seq.reply_rate}%</TableCell>
                  <TableCell className="text-[13px] text-zinc-500 py-2.5 hidden md:table-cell">{seq.created_at}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#111113] border-white/[0.06]">
          <DialogHeader>
            <DialogTitle className="text-[15px] text-white">Create sequence</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[11px] uppercase tracking-wide text-zinc-600 mb-1.5">Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Cold Outreach - SaaS"
                className="bg-white/[0.03] border-white/[0.06] text-[13px] text-white placeholder:text-zinc-600 h-8"
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wide text-zinc-600 mb-1.5">Status</Label>
              <p className="text-[13px] text-zinc-400">Draft</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="text-[13px] h-8 text-zinc-400 border-white/[0.06] bg-white/[0.02]"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-white text-zinc-900 hover:bg-zinc-100 text-[13px] h-8"
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
            >
              {creating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
