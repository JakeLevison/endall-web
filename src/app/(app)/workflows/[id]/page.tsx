"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ChevronRight, Zap, GitBranch, Play, Clock, Plus, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
};

type WorkflowNode = {
  id: string;
  node_type: "trigger" | "condition" | "action" | "delay" | "ai_action";
  node_order: number;
  config: Record<string, string>;
};

const triggerLabels: Record<string, string> = {
  record_created: "Record Created",
  record_updated: "Record Updated",
  email_opened: "Email Opened",
  email_clicked: "Email Clicked",
  form_submitted: "Form Submitted",
  schedule: "Schedule",
  webhook: "Webhook",
};

const fallbackWorkflow: Workflow = {
  id: "1",
  name: "New Lead Assignment",
  status: "active",
  trigger_type: "record_created",
  enrolled: 340,
};

const fallbackNodes: WorkflowNode[] = [
  { id: "n1", node_type: "trigger", node_order: 1, config: { trigger_type: "record_created", description: "When a new contact is created" } },
  { id: "n2", node_type: "condition", node_order: 2, config: { field: "lifecycle_stage", operator: "equals", value: "Lead", description: "If lifecycle stage is Lead" } },
  { id: "n3", node_type: "action", node_order: 3, config: { action: "assign_owner", value: "Round robin", description: "Assign owner via round robin" } },
  { id: "n4", node_type: "delay", node_order: 4, config: { delay_days: "1", description: "Wait 1 day" } },
  { id: "n5", node_type: "action", node_order: 5, config: { action: "send_notification", value: "Slack", description: "Send Slack notification to sales team" } },
];

const statusColor = (status: string) => {
  switch (status) {
    case "active": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "draft": return "bg-zinc-500/10 text-[var(--text-tertiary)] border-zinc-500/20";
    case "paused": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "archived": return "bg-red-500/10 text-red-400 border-red-500/20";
    default: return "bg-zinc-500/10 text-[var(--text-tertiary)] border-zinc-500/20";
  }
};

const nodeIcon = (type: WorkflowNode["node_type"]) => {
  switch (type) {
    case "trigger": return <Zap className="size-4" />;
    case "condition": return <GitBranch className="size-4" />;
    case "action": return <Play className="size-4" />;
    case "delay": return <Clock className="size-4" />;
    case "ai_action": return <Sparkles className="size-4" />;
  }
};

const nodeBorderColor = (type: WorkflowNode["node_type"]) => {
  switch (type) {
    case "trigger": return "border-l-blue-500";
    case "condition": return "border-l-amber-500";
    case "action": return "border-l-emerald-500";
    case "delay": return "border-l-zinc-500";
    case "ai_action": return "border-l-purple-500";
  }
};

const nodeIconBg = (type: WorkflowNode["node_type"]) => {
  switch (type) {
    case "trigger": return "bg-blue-500/10 text-blue-400";
    case "condition": return "bg-amber-500/10 text-amber-400";
    case "action": return "bg-emerald-500/10 text-emerald-400";
    case "delay": return "bg-zinc-500/10 text-[var(--text-tertiary)]";
    case "ai_action": return "bg-purple-500/10 text-purple-400";
  }
};

const nodeTypeLabel = (type: WorkflowNode["node_type"]) => {
  switch (type) {
    case "trigger": return "Trigger";
    case "condition": return "Condition";
    case "action": return "Action";
    case "delay": return "Delay";
    case "ai_action": return "AI Action";
  }
};

export default function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newNodeType, setNewNodeType] = useState<WorkflowNode["node_type"]>("action");
  const [newDescription, setNewDescription] = useState("");
  const [newConfig, setNewConfig] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    async function fetchData() {
      try {
        const { data: wfData, error: wfError } = await supabase
          .from("workflows")
          .select("*")
          .eq("id", id)
          .single();

        if (wfError) throw wfError;

        setWorkflow({
          id: wfData.id,
          name: wfData.name || "",
          status: wfData.status || "draft",
          trigger_type: wfData.trigger_type || "",
          enrolled: wfData.enrolled || 0,
        });

        const { data: nodesData, error: nodesError } = await supabase
          .from("workflow_nodes")
          .select("*")
          .eq("workflow_id", id)
          .order("node_order", { ascending: true });

        if (nodesError) throw nodesError;

        if (nodesData && nodesData.length > 0) {
          setNodes(nodesData.map((n: Record<string, unknown>) => ({
            id: n.id as string,
            node_type: (n.node_type as WorkflowNode["node_type"]) || "action",
            node_order: (n.node_order as number) || 0,
            config: (typeof n.config === "object" && n.config !== null ? n.config : {}) as Record<string, string>,
          })));
        } else {
          setNodes([]);
        }
      } catch {
        setWorkflow(fallbackWorkflow);
        setNodes(fallbackNodes);
        setUsingFallback(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!workflow) return;
    const newStatus = workflow.status === "active" ? "paused" : "active";
    setWorkflow({ ...workflow, status: newStatus });

    if (!usingFallback) {
      try {
        const supabase = createClient();
        await supabase
          .from("workflows")
          .update({ status: newStatus })
          .eq("id", id);
      } catch {
        // Silently fail
      }
    }
  };

  const handleAddNode = async () => {
    setCreating(true);
    const nextOrder = nodes.length > 0 ? Math.max(...nodes.map((n) => n.node_order)) + 1 : 1;

    const config: Record<string, string> = {
      description: newDescription.trim(),
    };
    if (newConfig.trim()) {
      config.value = newConfig.trim();
    }
    if (newNodeType === "delay") {
      config.delay_days = newConfig.trim() || "1";
    }

    const newNode: WorkflowNode = {
      id: String(Date.now()),
      node_type: newNodeType,
      node_order: nextOrder,
      config,
    };

    if (usingFallback) {
      setNodes((prev) => [...prev, newNode]);
    } else {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("workflow_nodes")
          .insert({
            workflow_id: id,
            node_type: newNodeType,
            node_order: nextOrder,
            config,
          })
          .select()
          .single();

        if (error) throw error;

        setNodes((prev) => [...prev, {
          id: data.id,
          node_type: data.node_type,
          node_order: data.node_order,
          config: data.config || {},
        }]);
      } catch {
        setNodes((prev) => [...prev, newNode]);
      }
    }

    setNewNodeType("action");
    setNewDescription("");
    setNewConfig("");
    setDialogOpen(false);
    setCreating(false);
  };

  const handleDeleteNode = async (nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    if (!usingFallback) {
      try {
        const supabase = createClient();
        await supabase.from("workflow_nodes").delete().eq("id", nodeId);
      } catch { /* silent */ }
    }
  };

  if (loading || !workflow) {
    return (
      <div className="p-6">
        <p className="text-[13px] text-[var(--text-muted)]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-1.5 text-[13px]">
          <Link href="/workflows" className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            Workflows
          </Link>
          <ChevronRight className="size-3 text-[var(--text-faint)]" />
          <span className="text-[var(--text-primary)]">{workflow.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`text-[11px] font-normal capitalize ${statusColor(workflow.status)}`}>
            {workflow.status}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[13px] text-[var(--text-tertiary)] border-[var(--border)] bg-[var(--overlay-weak)]"
            onClick={handleToggleStatus}
          >
            {workflow.status === "active" ? "Pause" : "Activate"}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          {/* Node flow */}
          {nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-[13px] text-[var(--text-muted)]">No nodes yet. Add a trigger to start building this workflow.</p>
            </div>
          ) : (
            <div className="relative">
              {nodes.map((node, idx) => (
                <div key={node.id}>
                  {/* Node card */}
                  <div className={`p-4 rounded-lg border border-[var(--border)] bg-[var(--overlay-weak)] border-l-2 ${nodeBorderColor(node.node_type)} hover:bg-[var(--overlay-weak)] transition-colors`}>
                    <div className="flex items-start gap-3">
                      <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${nodeIconBg(node.node_type)}`}>
                        {nodeIcon(node.node_type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                          <span className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">{nodeTypeLabel(node.node_type)}</span>
                          {node.node_type === "trigger" && (
                            <Badge variant="outline" className="text-[11px] font-normal bg-blue-500/10 text-blue-400 border-blue-500/20">
                              {triggerLabels[node.config.trigger_type || workflow.trigger_type] || node.config.trigger_type || workflow.trigger_type}
                            </Badge>
                          )}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id); }}
                            className="text-[var(--text-faint)] hover:text-red-400 transition-colors p-1"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                        <p className="text-[13px] text-[var(--text-primary)]">{node.config.description || "No description"}</p>
                        {node.config.value && node.node_type !== "delay" && (
                          <p className="text-[13px] text-[var(--text-muted)] mt-0.5">{node.config.value}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Connector line */}
                  {idx < nodes.length - 1 && (
                    <div className="flex justify-center py-1">
                      <div className="w-px h-6 bg-[var(--overlay-medium)]" />
                    </div>
                  )}
                </div>
              ))}

              {/* Add node at bottom */}
              <div className="flex justify-center py-1">
                <div className="w-px h-6 bg-[var(--overlay-medium)]" />
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => setDialogOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-[var(--border)] hover:border-[var(--overlay-strong)] hover:bg-[var(--overlay-weak)] transition-colors"
                >
                  <Plus className="size-4 text-[var(--text-muted)]" />
                  <span className="text-[13px] text-[var(--text-muted)]">Add node</span>
                </button>
              </div>
            </div>
          )}

          {nodes.length === 0 && (
            <div className="flex justify-center mt-4">
              <Button
                className="bg-[var(--surface-inverse)] text-[var(--text-inverse)] hover:opacity-90 text-[13px] h-8 px-3"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="size-4 mr-1" />
                Add node
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Add node dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[var(--surface)] border-[var(--border)]">
          <DialogHeader>
            <DialogTitle className="text-[15px] text-[var(--text-primary)]">Add node</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5">Node type</Label>
              <Select value={newNodeType} onValueChange={(v) => setNewNodeType(v as WorkflowNode["node_type"])}>
                <SelectTrigger className="bg-[var(--overlay-soft)] border-[var(--border)] text-[13px] text-[var(--text-primary)] h-8 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--surface)] border-[var(--border)]">
                  <SelectItem value="trigger" className="text-[13px] text-[var(--text-secondary)]">Trigger</SelectItem>
                  <SelectItem value="condition" className="text-[13px] text-[var(--text-secondary)]">Condition</SelectItem>
                  <SelectItem value="action" className="text-[13px] text-[var(--text-secondary)]">Action</SelectItem>
                  <SelectItem value="ai_action" className="text-[13px] text-[var(--text-secondary)]">AI Action</SelectItem>
                  <SelectItem value="delay" className="text-[13px] text-[var(--text-secondary)]">Delay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5">Description</Label>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="What does this node do?"
                className="bg-[var(--overlay-soft)] border-[var(--border)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] min-h-[60px]"
              />
            </div>

            {newNodeType === "delay" && (
              <div>
                <Label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5">Delay (days)</Label>
                <Input
                  type="number"
                  min="1"
                  value={newConfig}
                  onChange={(e) => setNewConfig(e.target.value)}
                  placeholder="1"
                  className="bg-[var(--overlay-soft)] border-[var(--border)] text-[13px] text-[var(--text-primary)] h-8 w-24"
                />
              </div>
            )}

            {(newNodeType === "condition" || newNodeType === "action" || newNodeType === "ai_action") && (
              <div>
                <Label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5">Configuration</Label>
                <Input
                  value={newConfig}
                  onChange={(e) => setNewConfig(e.target.value)}
                  placeholder={newNodeType === "condition" ? "e.g. lifecycle_stage equals Lead" : newNodeType === "ai_action" ? "e.g. Classify lead, Draft follow-up email" : "e.g. Send Slack notification"}
                  className="bg-[var(--overlay-soft)] border-[var(--border)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] h-8"
                />
              </div>
            )}
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
              onClick={handleAddNode}
              disabled={creating || !newDescription.trim()}
            >
              {creating ? "Adding..." : "Add node"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
