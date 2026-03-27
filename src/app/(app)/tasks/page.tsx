"use client";

import { useState, useEffect, useRef, useCallback, DragEvent, TouchEvent as ReactTouchEvent } from "react";
import { Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import type { Task as DBTask } from "@/lib/types";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignee: string | null;
  project: string | null;
  due_date: string | null;
  contact_name: string | null;
};

const statuses = ["Backlog", "Todo", "In Progress", "Done"];

const priorityOptions = ["urgent", "high", "medium", "low", "none"];

const priorityColor = (priority: string) => {
  switch (priority) {
    case "urgent": return "bg-red-500/10 text-red-400 border-red-500/20";
    case "high": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    case "medium": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    case "low": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  }
};

const statusColor = (status: string) => {
  switch (status) {
    case "Done": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "In Progress": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "Todo": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  }
};

function KanbanBoard({ tasks, onMove }: { tasks: Task[]; onMove: (taskId: string, newStatus: string) => void }) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  const handleDragStart = (e: DragEvent, taskId: string) => {
    setDraggedId(taskId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDragOver = (e: DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStatus(status);
  };

  const handleDragLeave = () => {
    setDragOverStatus(null);
  };

  const handleDrop = (e: DragEvent, status: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      onMove(taskId, status);
    }
    setDraggedId(null);
    setDragOverStatus(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverStatus(null);
  };

  // Touch drag support
  const touchIdRef = useRef<string | null>(null);

  const handleTouchStart = useCallback((taskId: string) => (e: ReactTouchEvent) => {
    touchIdRef.current = taskId;
    setDraggedId(taskId);
  }, []);

  const handleTouchMove = useCallback((e: ReactTouchEvent) => {
    if (!touchIdRef.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const col = el?.closest<HTMLElement>("[data-status]");
    setDragOverStatus(col?.dataset.status ?? null);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchIdRef.current && dragOverStatus) {
      onMove(touchIdRef.current, dragOverStatus);
    }
    touchIdRef.current = null;
    setDraggedId(null);
    setDragOverStatus(null);
  }, [dragOverStatus, onMove]);

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {statuses.map((status) => {
        const statusTasks = tasks.filter((t) => t.status === status);
        const isOver = dragOverStatus === status;
        return (
          <div
            key={status}
            data-status={status}
            className={`min-w-[220px] w-[220px] shrink-0 rounded-lg transition-colors ${
              isOver ? "bg-white/[0.03]" : ""
            }`}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-[11px] uppercase tracking-wide text-zinc-600">{status}</h3>
              <span className="text-[11px] text-zinc-700">{statusTasks.length}</span>
            </div>
            <div className="space-y-2 min-h-[80px]">
              {statusTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={handleDragEnd}
                  onTouchStart={handleTouchStart(task.id)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className={`p-3 rounded-lg border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] transition-all cursor-grab active:cursor-grabbing select-none ${
                    draggedId === task.id ? "opacity-40 scale-95" : ""
                  }`}
                >
                  <p className="text-[13px] text-white mb-1.5">{task.title}</p>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Badge variant="outline" className={`text-[10px] font-normal px-1.5 py-0 ${priorityColor(task.priority)}`}>
                      {task.priority}
                    </Badge>
                  </div>
                  {task.due_date && (
                    <div className="flex items-center gap-1 mb-1">
                      <Calendar className="size-3 text-zinc-600" />
                      <span className="text-[11px] text-zinc-500">{task.due_date}</span>
                    </div>
                  )}
                  {task.contact_name && (
                    <p className="text-[11px] text-zinc-600">{task.contact_name}</p>
                  )}
                </div>
              ))}
              {statusTasks.length === 0 && (
                <div className={`p-3 rounded-lg border border-dashed text-center transition-colors ${
                  isOver ? "border-white/[0.12] bg-white/[0.02]" : "border-white/[0.04]"
                }`}>
                  <p className="text-[11px] text-zinc-700">
                    {isOver ? "Drop here" : "No tasks"}
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

function TaskTableView({ tasks }: { tasks: Task[] }) {
  return (
    <div className="border border-white/[0.04] rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-white/[0.04] hover:bg-transparent">
            <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600">Title</TableHead>
            <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600">Status</TableHead>
            <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600">Priority</TableHead>
            <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600 hidden md:table-cell">Due Date</TableHead>
            <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600 hidden md:table-cell">Assignee</TableHead>
            <TableHead className="h-9 text-[11px] uppercase tracking-wide text-zinc-600 hidden lg:table-cell">Project</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id} className="border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors">
              <TableCell className="text-[13px] text-white font-medium py-2.5">{task.title}</TableCell>
              <TableCell className="py-2.5">
                <Badge variant="outline" className={`text-[11px] font-normal ${statusColor(task.status)}`}>
                  {task.status}
                </Badge>
              </TableCell>
              <TableCell className="py-2.5">
                <Badge variant="outline" className={`text-[11px] font-normal ${priorityColor(task.priority)}`}>
                  {task.priority}
                </Badge>
              </TableCell>
              <TableCell className="text-[13px] text-zinc-500 py-2.5 hidden md:table-cell">{task.due_date || "---"}</TableCell>
              <TableCell className="text-[13px] text-zinc-500 py-2.5 hidden md:table-cell">{task.assignee || "---"}</TableCell>
              <TableCell className="text-[13px] text-zinc-500 py-2.5 hidden lg:table-cell">{task.project || "---"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function CreateTaskDialog({ onCreated }: { onCreated: (task: Task) => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Todo");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [project, setProject] = useState("");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("Todo");
    setPriority("medium");
    setDueDate("");
    setProject("");
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);

    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim() || null,
      status,
      priority,
      assignee: null,
      project: project.trim() || null,
      due_date: dueDate || null,
      contact_name: null,
    };

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          title: newTask.title,
          description: newTask.description,
          status: newTask.status,
          priority: newTask.priority,
          project: newTask.project,
          due_date: newTask.due_date,
          tenant_id: tenantId,
        })
        .select()
        .single();

      if (error) throw error;

      onCreated({
        ...newTask,
        id: data.id,
      });
    } catch {
      // Supabase insert failed — still add to UI with generated ID
      onCreated(newTask);
    } finally {
      setSaving(false);
      setOpen(false);
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-white text-zinc-900 hover:bg-zinc-100 text-[13px] h-8 px-3">
          <Plus className="size-4 mr-1" />
          Add task
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-white/[0.06] text-white sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-medium text-white">New Task</DialogTitle>
          <DialogDescription className="text-[13px] text-zinc-500">
            Create a new task to track work.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-[13px] text-zinc-400">Title</Label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
              className="h-9 rounded-md border border-white/[0.06] bg-white/[0.02] px-3 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/[0.12]"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description" className="text-[13px] text-zinc-400">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
              className="rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/[0.12] resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label className="text-[13px] text-zinc-400">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 border-white/[0.06] bg-white/[0.02] text-[13px] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-white/[0.06]">
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s} className="text-[13px] text-zinc-300">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-[13px] text-zinc-400">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-9 border-white/[0.06] bg-white/[0.02] text-[13px] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-white/[0.06]">
                  {priorityOptions.map((p) => (
                    <SelectItem key={p} value={p} className="text-[13px] text-zinc-300 capitalize">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="due_date" className="text-[13px] text-zinc-400">Due Date</Label>
              <input
                id="due_date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-9 rounded-md border border-white/[0.06] bg-white/[0.02] px-3 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-white/[0.12] [color-scheme:dark]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project" className="text-[13px] text-zinc-400">Project</Label>
              <input
                id="project"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="e.g. CRM, Billing..."
                className="h-9 rounded-md border border-white/[0.06] bg-white/[0.02] px-3 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/[0.12]"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => { setOpen(false); resetForm(); }}
            className="text-[13px] text-zinc-400 hover:text-white hover:bg-white/[0.04] h-8"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || saving}
            className="bg-white text-zinc-900 hover:bg-zinc-100 text-[13px] h-8 px-4 disabled:opacity-40"
          >
            {saving ? "Creating..." : "Create task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TasksPage() {
  const [view, setView] = useState("board");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function fetchTasks() {
      try {
        const { data, error } = await supabase
          .from("tasks")
          .select("*, contacts(first_name, last_name)")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          const mapped: Task[] = (data as (DBTask & { contacts?: { first_name: string; last_name: string } | null })[]).map((t) => ({
            id: t.id,
            title: t.title || "",
            description: t.description,
            status: t.status || "Backlog",
            priority: t.priority || "none",
            assignee: t.assignee,
            project: t.project,
            due_date: t.due_date ? t.due_date.split("T")[0] : null,
            contact_name: t.contacts ? `${t.contacts.first_name} ${t.contacts.last_name}` : null,
          }));
          setTasks(mapped);
        } else {
          setTasks([]);
        }
      } catch {
        // Supabase query failed — show empty state
        setTasks([]);
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, []);

  const handleMoveTask = async (taskId: string, newStatus: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    // Persist to Supabase
    try {
      const supabase = createClient();
      await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);
    } catch {
      // Silently fail — optimistic update stays in place
    }
  };

  const handleTaskCreated = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
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
        <h1 className="text-[15px] font-medium text-white">Tasks</h1>
        <CreateTaskDialog onCreated={handleTaskCreated} />
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
            List
          </TabsTrigger>
        </TabsList>
        <TabsContent value="board" className="mt-4">
          {tasks.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[13px] text-zinc-600">No tasks yet. Create your first task.</p>
            </div>
          ) : (
            <KanbanBoard tasks={tasks} onMove={handleMoveTask} />
          )}
        </TabsContent>
        <TabsContent value="table" className="mt-4">
          {tasks.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[13px] text-zinc-600">No tasks yet. Create your first task.</p>
            </div>
          ) : (
            <TaskTableView tasks={tasks} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
