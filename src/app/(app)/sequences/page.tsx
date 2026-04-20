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
import { useTenant } from "@/lib/tenant-hook";
import { SEQUENCE_TEMPLATES } from "@/lib/sequence-templates";

type Sequence = {
  id: string;
  name: string;
  status: "active" | "draft" | "paused" | "archived";
  steps: number;
  enrolled: number;
  reply_rate: number;
  created_at: string;
};

const statusColor = (status: string) => {
  switch (status) {
    case "active": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "draft": return "bg-zinc-500/10 text-[var(--text-tertiary)] border-zinc-500/20";
    case "paused": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "archived": return "bg-red-500/10 text-red-400 border-red-500/20";
    default: return "bg-zinc-500/10 text-[var(--text-tertiary)] border-zinc-500/20";
  }
};

export default function SequencesPage() {
  const router = useRouter();
  const { tenant_id: tenantId } = useTenant();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

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
        // Supabase query failed — show empty state
        setSequences([]);
      } finally {
        setLoading(false);
      }
    }
    fetchSequences();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim() || !tenantId) return;
    setCreating(true);

    try {
      const supabase = createClient();
      const template = SEQUENCE_TEMPLATES.find((t) => t.id === selectedTemplate);

      const { data, error } = await supabase
        .from("sequences")
        .insert({
          name: newName.trim(),
          status: "draft",
          steps_count: template?.steps.length || 0,
          tenant_id: tenantId,
        })
        .select()
        .single();

      if (error) throw error;

      // Insert template steps if a template was selected
      if (template && data) {
        const steps = template.steps.map((s, i) => ({
          sequence_id: data.id,
          step_order: i + 1,
          step_type: s.step_type,
          delay_days: s.delay_days,
          subject: s.subject || null,
          body: s.body || null,
          tenant_id: tenantId,
        }));
        await supabase.from("sequence_steps").insert(steps);
      }

      if (data) {
        router.push(`/sequences/${data.id}`);
      }
    } catch {
      // Silently fail
    }

    setNewName("");
    setSelectedTemplate("");
    setDialogOpen(false);
    setCreating(false);
  };

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
        <h1 className="text-[15px] font-medium text-[var(--text-primary)]">Sequences</h1>
        <Button
          className="bg-[var(--surface-inverse)] text-[var(--text-inverse)] hover:opacity-90 text-[13px] h-8 px-3"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="size-4 mr-1" />
          Create sequence
        </Button>
      </div>

      {sequences.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="size-10 rounded-lg bg-[var(--overlay-soft)] border border-[var(--border)] flex items-center justify-center mb-4">
            <Mail className="size-5 text-[var(--text-muted)]" />
          </div>
          <p className="text-[13px] text-[var(--text-muted)] mb-1">No sequences yet</p>
          <p className="text-[11px] text-[var(--text-muted)]">Create multi-step email cadences with smart scheduling and auto-unenroll.</p>
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[var(--border)] hover:bg-transparent">
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Name</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Status</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Steps</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Enrolled</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)] hidden md:table-cell">Reply Rate</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)] hidden md:table-cell">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sequences.map((seq) => (
                <TableRow
                  key={seq.id}
                  className="border-[var(--border)] hover:bg-[var(--overlay-weak)] cursor-pointer transition-colors"
                  onClick={() => router.push(`/sequences/${seq.id}`)}
                >
                  <TableCell className="text-[13px] text-[var(--text-primary)] font-medium py-2.5">{seq.name}</TableCell>
                  <TableCell className="py-2.5">
                    <Badge variant="outline" className={`text-[11px] font-normal capitalize ${statusColor(seq.status)}`}>
                      {seq.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[13px] text-[var(--text-tertiary)] py-2.5">{seq.steps}</TableCell>
                  <TableCell className="text-[13px] text-[var(--text-tertiary)] py-2.5">{seq.enrolled}</TableCell>
                  <TableCell className="text-[13px] text-[var(--text-muted)] py-2.5 hidden md:table-cell">{seq.reply_rate}%</TableCell>
                  <TableCell className="text-[13px] text-[var(--text-muted)] py-2.5 hidden md:table-cell">{seq.created_at}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[var(--surface)] border-[var(--border)]">
          <DialogHeader>
            <DialogTitle className="text-[15px] text-[var(--text-primary)]">Create sequence</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5">Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Cold Outreach - SaaS"
                className="bg-[var(--overlay-soft)] border-[var(--border)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] h-8"
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5">Template</Label>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedTemplate("")}
                  className={`w-full text-left px-3 py-2 rounded-md text-[13px] border transition-colors ${
                    !selectedTemplate ? "border-[var(--overlay-strong)] bg-[var(--overlay-soft)] text-[var(--text-primary)]" : "border-[var(--border)] bg-[var(--overlay-weak)] text-[var(--text-muted)]"
                  }`}
                >
                  Blank sequence
                </button>
                {SEQUENCE_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { setSelectedTemplate(t.id); if (!newName) setNewName(t.name); }}
                    className={`w-full text-left px-3 py-2 rounded-md border transition-colors ${
                      selectedTemplate === t.id ? "border-[var(--overlay-strong)] bg-[var(--overlay-soft)]" : "border-[var(--border)] bg-[var(--overlay-weak)]"
                    }`}
                  >
                    <p className={`text-[13px] ${selectedTemplate === t.id ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"}`}>{t.name}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{t.description} — {t.steps.length} steps</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="text-[13px] h-8 text-[var(--text-tertiary)] border-[var(--border)] bg-[var(--overlay-weak)]"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[var(--surface-inverse)] text-[var(--text-inverse)] hover:opacity-90 text-[13px] h-8"
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
