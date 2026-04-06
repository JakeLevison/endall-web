"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ChevronRight, Mail, Clock, CheckSquare, Plus, Share2, Users, Trash2 } from "lucide-react";
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
import StepAnalytics from "@/components/sequences/StepAnalytics";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("@/components/editor/RichTextEditor"), { ssr: false });

type Sequence = {
  id: string;
  name: string;
  status: "active" | "draft" | "paused" | "archived";
  enrolled: number;
  reply_rate: number;
};

type Step = {
  id: string;
  step_order: number;
  type: "email" | "delay" | "task" | "linkedin_task";
  subject: string;
  body: string;
  delay_days: number;
};

const fallbackSequence: Sequence = {
  id: "1",
  name: "Cold Outreach - SaaS",
  status: "active",
  enrolled: 142,
  reply_rate: 18.3,
};

const fallbackSteps: Step[] = [
  { id: "s1", step_order: 1, type: "email", subject: "Quick intro + how we help teams like yours", body: "Hi {{first_name}},\n\nI noticed your team is scaling fast...", delay_days: 0 },
  { id: "s2", step_order: 2, type: "delay", subject: "", body: "", delay_days: 3 },
  { id: "s3", step_order: 3, type: "email", subject: "Following up — any thoughts?", body: "Hi {{first_name}},\n\nJust bumping this to the top of your inbox...", delay_days: 0 },
  { id: "s4", step_order: 4, type: "delay", subject: "", body: "", delay_days: 5 },
  { id: "s5", step_order: 5, type: "task", subject: "Call if no reply", body: "Review contact activity and attempt phone call", delay_days: 0 },
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

const stepIcon = (type: Step["type"]) => {
  switch (type) {
    case "email": return <Mail className="size-4" />;
    case "delay": return <Clock className="size-4" />;
    case "task": return <CheckSquare className="size-4" />;
    case "linkedin_task": return <Share2 className="size-4" />;
  }
};

const stepIconColor = (type: Step["type"]) => {
  switch (type) {
    case "email": return "bg-blue-500/10 text-blue-400";
    case "delay": return "bg-zinc-500/10 text-[var(--text-tertiary)]";
    case "task": return "bg-purple-500/10 text-purple-400";
    case "linkedin_task": return "bg-sky-500/10 text-sky-400";
  }
};

const MERGE_TAGS = [
  { token: "{{contact.first_name}}", label: "First Name" },
  { token: "{{contact.last_name}}", label: "Last Name" },
  { token: "{{contact.email}}", label: "Email" },
  { token: "{{contact.company.name}}", label: "Company" },
  { token: "{{contact.company.industry}}", label: "Industry" },
  { token: "{{deal.name}}", label: "Deal Name" },
  { token: "{{deal.amount}}", label: "Deal Amount" },
  { token: "{{owner.full_name}}", label: "Sender Name" },
];

const stepDescription = (step: Step) => {
  switch (step.type) {
    case "email": return step.subject;
    case "delay": return `Wait ${step.delay_days} day${step.delay_days !== 1 ? "s" : ""}`;
    case "task": return step.subject;
  }
};

export default function SequenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newType, setNewType] = useState<Step["type"]>("email");
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newDelayDays, setNewDelayDays] = useState("3");
  const [creating, setCreating] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [contacts, setContacts] = useState<{ id: string; first_name: string; last_name: string; email: string }[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    async function fetchData() {
      try {
        const { data: seqData, error: seqError } = await supabase
          .from("sequences")
          .select("*")
          .eq("id", id)
          .single();

        if (seqError) throw seqError;

        setSequence({
          id: seqData.id,
          name: seqData.name || "",
          status: seqData.status || "draft",
          enrolled: seqData.enrolled || 0,
          reply_rate: seqData.reply_rate || 0,
        });

        const { data: stepsData, error: stepsError } = await supabase
          .from("sequence_steps")
          .select("*")
          .eq("sequence_id", id)
          .order("step_order", { ascending: true });

        if (stepsError) throw stepsError;

        if (stepsData && stepsData.length > 0) {
          setSteps(stepsData.map((s: Record<string, unknown>) => ({
            id: s.id as string,
            step_order: (s.step_order as number) || 0,
            type: (s.type as Step["type"]) || "email",
            subject: (s.subject as string) || "",
            body: (s.body as string) || "",
            delay_days: (s.delay_days as number) || 0,
          })));
        } else {
          setSteps([]);
        }
      } catch {
        setSequence(fallbackSequence);
        setSteps(fallbackSteps);
        setUsingFallback(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!sequence) return;
    const newStatus = sequence.status === "active" ? "paused" : "active";
    setSequence({ ...sequence, status: newStatus });

    if (!usingFallback) {
      try {
        const supabase = createClient();
        await supabase
          .from("sequences")
          .update({ status: newStatus })
          .eq("id", id);
      } catch {
        // Silently fail
      }
    }
  };

  const handleAddStep = async () => {
    setCreating(true);
    const nextOrder = steps.length > 0 ? Math.max(...steps.map((s) => s.step_order)) + 1 : 1;

    const newStep: Step = {
      id: String(Date.now()),
      step_order: nextOrder,
      type: newType,
      subject: newType === "delay" ? "" : newSubject.trim(),
      body: newType === "email" ? newBody.trim() : newType === "task" ? newBody.trim() : "",
      delay_days: newType === "delay" ? parseInt(newDelayDays) || 1 : 0,
    };

    if (usingFallback) {
      setSteps((prev) => [...prev, newStep]);
    } else {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("sequence_steps")
          .insert({
            sequence_id: id,
            step_order: nextOrder,
            type: newType,
            subject: newStep.subject,
            body: newStep.body,
            delay_days: newStep.delay_days,
          })
          .select()
          .single();

        if (error) throw error;

        setSteps((prev) => [...prev, {
          id: data.id,
          step_order: data.step_order,
          type: data.type,
          subject: data.subject || "",
          body: data.body || "",
          delay_days: data.delay_days || 0,
        }]);
      } catch {
        setSteps((prev) => [...prev, newStep]);
      }
    }

    setNewType("email");
    setNewSubject("");
    setNewBody("");
    setNewDelayDays("3");
    setDialogOpen(false);
    setCreating(false);
  };

  const handleDeleteStep = async (stepId: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== stepId));
    if (!usingFallback) {
      try {
        const supabase = createClient();
        await supabase.from("sequence_steps").delete().eq("id", stepId);
      } catch { /* silent */ }
    }
  };

  const handleEnroll = async () => {
    if (selectedContacts.size === 0) return;
    setEnrolling(true);
    try {
      const supabase = createClient();
      const enrollments = Array.from(selectedContacts).map((contactId) => ({
        tenant_id: process.env.NEXT_PUBLIC_TENANT_ID,
        sequence_id: id,
        contact_id: contactId,
        status: "active",
        current_step: 1,
      }));
      await supabase.from("sequence_enrollments").insert(enrollments);
      setSequence((prev) => prev ? { ...prev, enrolled: prev.enrolled + selectedContacts.size } : prev);
    } catch { /* silent */ }
    setSelectedContacts(new Set());
    setEnrollDialogOpen(false);
    setEnrolling(false);
  };

  const fetchContacts = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, email")
        .is("merged_into", null)
        .order("first_name")
        .limit(100);
      setContacts(data || []);
    } catch { /* silent */ }
  };

  const insertMergeTag = (tag: string) => {
    setNewBody((prev) => prev + tag);
  };

  if (loading || !sequence) {
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
          <Link href="/sequences" className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            Sequences
          </Link>
          <ChevronRight className="size-3 text-[var(--text-faint)]" />
          <span className="text-[var(--text-primary)]">{sequence.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`text-[11px] font-normal capitalize ${statusColor(sequence.status)}`}>
            {sequence.status}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[13px] text-[var(--text-tertiary)] border-[var(--border)] bg-[var(--overlay-weak)]"
            onClick={handleToggleStatus}
          >
            {sequence.status === "active" ? "Pause" : "Activate"}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main — Steps timeline */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[15px] font-medium text-[var(--text-primary)]">Steps</h2>
            <Button
              className="bg-[var(--surface-inverse)] text-[var(--text-inverse)] hover:opacity-90 text-[13px] h-8 px-3"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="size-4 mr-1" />
              Add step
            </Button>
          </div>

          {steps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-[13px] text-[var(--text-muted)]">No steps yet. Add your first step to build this sequence.</p>
            </div>
          ) : (
            <div className="relative">
              {steps.map((step, idx) => (
                <div key={step.id} className="relative flex gap-4">
                  {/* Timeline connector */}
                  <div className="flex flex-col items-center">
                    <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${stepIconColor(step.type)}`}>
                      {stepIcon(step.type)}
                    </div>
                    {idx < steps.length - 1 && (
                      <div className="w-px flex-1 bg-[var(--overlay-medium)] my-1" />
                    )}
                  </div>

                  {/* Step card */}
                  <div className="flex-1 mb-3 pb-3">
                    <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--overlay-weak)] hover:bg-[var(--overlay-weak)] transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] text-[var(--text-muted)]">Step {step.step_order}</span>
                        <span className="text-[11px] text-[var(--text-faint)] capitalize">{step.type}</span>
                      </div>
                      <p className="text-[13px] text-[var(--text-primary)]">{stepDescription(step)}</p>
                      {step.type === "email" && step.body && (
                        <p className="text-[13px] text-[var(--text-muted)] mt-1 line-clamp-2">{step.body}</p>
                      )}
                      {step.type === "task" && step.body && (
                        <p className="text-[13px] text-[var(--text-muted)] mt-1">{step.body}</p>
                      )}
                      <StepAnalytics sequenceId={id} stepId={step.id} stepType={step.type} />
                    </div>
                  </div>
                </div>
              ))}

              {/* Add step button at bottom */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => setDialogOpen(true)}
                    className="size-8 rounded-lg border border-dashed border-[var(--border)] flex items-center justify-center hover:border-[var(--overlay-strong)] hover:bg-[var(--overlay-weak)] transition-colors"
                  >
                    <Plus className="size-4 text-[var(--text-muted)]" />
                  </button>
                </div>
                <div className="flex items-center">
                  <p className="text-[13px] text-[var(--text-muted)]">Add step</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar — Stats */}
        <div className="w-72 shrink-0 border-l border-[var(--border)] overflow-y-auto p-5 hidden lg:block">
          <div className="mb-6">
            <h3 className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-3">Enrollment</h3>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] text-[var(--text-muted)] mb-0.5">Enrolled</p>
                <p className="text-[15px] font-medium text-[var(--text-primary)]">{sequence.enrolled}</p>
              </div>
              <div>
                <p className="text-[11px] text-[var(--text-muted)] mb-0.5">Reply Rate</p>
                <p className="text-[15px] font-medium text-[var(--text-primary)]">{sequence.reply_rate}%</p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full text-[13px] h-8 text-[var(--text-tertiary)] border-[var(--border)] bg-[var(--overlay-weak)]"
            onClick={() => { fetchContacts(); setEnrollDialogOpen(true); }}
          >
            <Users className="size-3.5 mr-1.5" />
            Enroll contacts
          </Button>
        </div>
      </div>

      {/* Add step dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[var(--surface)] border-[var(--border)]">
          <DialogHeader>
            <DialogTitle className="text-[15px] text-[var(--text-primary)]">Add step</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5">Step type</Label>
              <Select value={newType} onValueChange={(v) => setNewType(v as Step["type"])}>
                <SelectTrigger className="bg-[var(--overlay-soft)] border-[var(--border)] text-[13px] text-[var(--text-primary)] h-8 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--surface)] border-[var(--border)]">
                  <SelectItem value="email" className="text-[13px] text-[var(--text-secondary)]">Email</SelectItem>
                  <SelectItem value="delay" className="text-[13px] text-[var(--text-secondary)]">Delay</SelectItem>
                  <SelectItem value="task" className="text-[13px] text-[var(--text-secondary)]">Task</SelectItem>
                  <SelectItem value="linkedin_task" className="text-[13px] text-[var(--text-secondary)]">LinkedIn Task</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newType !== "delay" && (
              <div>
                <Label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5">Subject</Label>
                <Input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder={newType === "email" ? "Email subject line" : "Task description"}
                  className="bg-[var(--overlay-soft)] border-[var(--border)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] h-8"
                />
              </div>
            )}

            {newType === "email" && (
              <div>
                <Label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5">Body</Label>
                <RichTextEditor
                  content={newBody}
                  onChange={setNewBody}
                  placeholder="Write your email..."
                />
              </div>
            )}

            {newType === "task" && (
              <div>
                <Label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5">Details</Label>
                <Textarea
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Task details..."
                  className="bg-[var(--overlay-soft)] border-[var(--border)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] min-h-[60px]"
                />
              </div>
            )}

            {newType === "delay" && (
              <div>
                <Label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5">Delay (days)</Label>
                <Input
                  type="number"
                  min="1"
                  value={newDelayDays}
                  onChange={(e) => setNewDelayDays(e.target.value)}
                  className="bg-[var(--overlay-soft)] border-[var(--border)] text-[13px] text-[var(--text-primary)] h-8 w-24"
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
              onClick={handleAddStep}
              disabled={creating || (newType !== "delay" && !newSubject.trim())}
            >
              {creating ? "Adding..." : "Add step"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enroll contacts dialog */}
      <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
        <DialogContent className="bg-[var(--surface)] border-[var(--border)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px] text-[var(--text-primary)]">Enroll contacts</DialogTitle>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {contacts.length === 0 ? (
              <p className="text-[13px] text-[var(--text-muted)] py-4 text-center">No contacts found</p>
            ) : (
              contacts.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-[var(--overlay-weak)] cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedContacts.has(c.id)}
                    onChange={() => {
                      setSelectedContacts((prev) => {
                        const next = new Set(prev);
                        if (next.has(c.id)) next.delete(c.id);
                        else next.add(c.id);
                        return next;
                      });
                    }}
                    className="rounded border-[var(--border)]"
                  />
                  <div>
                    <p className="text-[13px] text-[var(--text-primary)]">{c.first_name} {c.last_name}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{c.email}</p>
                  </div>
                </label>
              ))
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="text-[13px] h-8 text-[var(--text-tertiary)] border-[var(--border)] bg-[var(--overlay-weak)]"
              onClick={() => setEnrollDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[var(--surface-inverse)] text-[var(--text-inverse)] hover:opacity-90 text-[13px] h-8"
              onClick={handleEnroll}
              disabled={selectedContacts.size === 0 || enrolling}
            >
              {enrolling ? "Enrolling..." : `Enroll ${selectedContacts.size} contact${selectedContacts.size !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
