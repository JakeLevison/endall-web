"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Zap } from "lucide-react";
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

type Workflow = {
  id: string;
  name: string;
  status: "active" | "draft" | "paused" | "archived";
  trigger_type: string;
  enrolled: number;
  created_at: string;
};

const triggerTypes = [
  { value: "record_created", label: "Record Created" },
  { value: "record_updated", label: "Record Updated" },
  { value: "email_opened", label: "Email Opened" },
  { value: "email_clicked", label: "Email Clicked" },
  { value: "form_submitted", label: "Form Submitted" },
  { value: "schedule", label: "Schedule" },
  { value: "webhook", label: "Webhook" },
];

const triggerLabel = (type: string) => {
  return triggerTypes.find((t) => t.value === type)?.label || type;
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

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTrigger, setNewTrigger] = useState("record_created");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    async function fetchWorkflows() {
      try {
        const { data, error } = await supabase
          .from("workflows")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setWorkflows(data.map((w: Record<string, unknown>) => ({
            id: w.id as string,
            name: (w.name as string) || "",
            status: (w.status as Workflow["status"]) || "draft",
            trigger_type: (w.trigger_type as string) || "",
            enrolled: (w.enrolled as number) || 0,
            created_at: w.created_at ? (w.created_at as string).split("T")[0] : "",
          })));
        } else {
          setWorkflows([]);
        }
      } catch {
        // Supabase query failed — show empty state
        setWorkflows([]);
      } finally {
        setLoading(false);
      }
    }
    fetchWorkflows();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("workflows")
        .insert({
          name: newName.trim(),
          status: "draft",
          trigger_type: newTrigger,
          tenant_id: process.env.NEXT_PUBLIC_TENANT_ID,
        })
        .select()
        .single();

      if (error) throw error;

      setWorkflows((prev) => [{
        id: data.id,
        name: data.name || "",
        status: data.status || "draft",
        trigger_type: data.trigger_type || "",
        enrolled: data.enrolled || 0,
        created_at: data.created_at ? data.created_at.split("T")[0] : "",
      }, ...prev]);
    } catch {
      // Silently fail
    }

    setNewName("");
    setNewTrigger("record_created");
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
        <h1 className="text-[15px] font-medium text-[var(--text-primary)]">Workflows</h1>
        <Button
          className="bg-[var(--surface-inverse)] text-[var(--text-inverse)] hover:opacity-90 text-[13px] h-8 px-3"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="size-4 mr-1" />
          Create workflow
        </Button>
      </div>

      {workflows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="size-10 rounded-lg bg-[var(--overlay-soft)] border border-[var(--border)] flex items-center justify-center mb-4">
            <Zap className="size-5 text-[var(--text-muted)]" />
          </div>
          <p className="text-[13px] text-[var(--text-muted)] mb-1">No workflows yet</p>
          <p className="text-[11px] text-[var(--text-muted)]">Automate any process with triggers, conditions, and AI-powered actions.</p>
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[var(--border)] hover:bg-transparent">
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Name</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Status</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Trigger Type</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)] hidden md:table-cell">Enrolled</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide text-[var(--text-muted)] hidden md:table-cell">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.map((wf) => (
                <TableRow
                  key={wf.id}
                  className="border-[var(--border)] hover:bg-[var(--overlay-weak)] cursor-pointer transition-colors"
                  onClick={() => router.push(`/workflows/${wf.id}`)}
                >
                  <TableCell className="text-[13px] text-[var(--text-primary)] font-medium py-2.5">{wf.name}</TableCell>
                  <TableCell className="py-2.5">
                    <Badge variant="outline" className={`text-[11px] font-normal capitalize ${statusColor(wf.status)}`}>
                      {wf.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[13px] text-[var(--text-tertiary)] py-2.5">{triggerLabel(wf.trigger_type)}</TableCell>
                  <TableCell className="text-[13px] text-[var(--text-muted)] py-2.5 hidden md:table-cell">{wf.enrolled}</TableCell>
                  <TableCell className="text-[13px] text-[var(--text-muted)] py-2.5 hidden md:table-cell">{wf.created_at}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[var(--surface)] border-[var(--border)]">
          <DialogHeader>
            <DialogTitle className="text-[15px] text-[var(--text-primary)]">Create workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5">Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. New Lead Assignment"
                className="bg-[var(--overlay-soft)] border-[var(--border)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] h-8"
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5">Trigger type</Label>
              <Select value={newTrigger} onValueChange={setNewTrigger}>
                <SelectTrigger className="bg-[var(--overlay-soft)] border-[var(--border)] text-[13px] text-[var(--text-primary)] h-8 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--surface)] border-[var(--border)]">
                  {triggerTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-[13px] text-[var(--text-secondary)]">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
