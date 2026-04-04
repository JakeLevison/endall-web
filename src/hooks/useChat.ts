"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FileAttachment = {
  file_id: string;
  filename: string;
  download_url: string;
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string; // ISO string for serialization
  files?: FileAttachment[];
  previewHtml?: string;
};

export type ConversationSummary = {
  id: string;
  title: string;
  workflow: string;
  created_at: string;
  updated_at: string;
};

export type SavedFile = {
  id: string;
  file_name: string;
  file_type: string;
  description: string;
  file_path: string;
  workflow: string;
  created_at: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SKILLS_ACTIONS = new Set([
  "financial_model", "generate_budget", "capabilities_doc", "npv_analysis",
  "project_estimate", "proposal", "competitive_analysis", "review_financials",
  "swot_analysis",
]);

export const QUICK_ACTIONS = [
  { id: "financial_model", label: "Build a financial model", description: "P&L, cash flow, job margins, KPI dashboard", icon: "BarChart3" },
  { id: "generate_budget", label: "Generate a budget", description: "Monthly budget with targets and tracking", icon: "Wallet" },
  { id: "capabilities_doc", label: "Create a capabilities doc", description: "Professional deck from your company profile", icon: "FileText" },
  { id: "npv_analysis", label: "Analyze project returns", description: "NPV, IRR, sensitivity analysis on a specific bid", icon: "TrendingUp" },
  { id: "project_estimate", label: "Estimate a project", description: "Labor, materials, subs, timeline, margins", icon: "Wrench" },
  { id: "proposal", label: "Draft a proposal", description: "Scoped SOW with pricing for a specific job", icon: "FileEdit" },
  { id: "competitive_analysis", label: "Research competitors", description: "Report on competitors in your market", icon: "Search" },
  { id: "review_financials", label: "Review my financials", description: "Monthly financial review with action items", icon: "CheckCircle" },
];

// Short titles for sidebar conversation naming
const ACTION_TITLES: Record<string, string> = {
  financial_model: "Financial Model",
  generate_budget: "Budget",
  capabilities_doc: "Capabilities Doc",
  npv_analysis: "NPV Analysis",
  project_estimate: "Project Estimate",
  proposal: "Proposal",
  competitive_analysis: "Competitive Analysis",
  review_financials: "Review Financials",
};

export function generateConversationTitle(action: string | undefined, text: string): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (action && ACTION_TITLES[action]) {
    return `${ACTION_TITLES[action]} — ${dateStr}`;
  }

  if (text.trim()) {
    return text.trim().slice(0, 40);
  }

  return `Chat — ${dateStr}`;
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

const LS_ACTIVE_KEY = "endall-chat-active";
const LS_LIST_KEY = "endall-chat-list";
const lsMessages = (id: string) => `endall-chat-${id}`;

function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage full — older conversations will be lost but app continues
  }
}

function lsRemove(key: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch { /* ignore */ }
}

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseChatOptions {
  recordType?: "contact" | "company" | "deal";
  recordId?: string;
}

export function useChat(options: UseChatOptions = {}) {
  const { recordType, recordId } = options;

  // Core state
  const [conversationId, setConversationId] = useState<string>(() => {
    return lsGet(LS_ACTIVE_KEY, "") || generateId();
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState("");
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "files">("chat");
  const [savedFiles, setSavedFiles] = useState<SavedFile[]>([]);
  const initialized = useRef(false);

  // ── Hydrate on mount ──
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    let activeId = lsGet<string>(LS_ACTIVE_KEY, "");
    if (!activeId) {
      activeId = generateId();
      lsSet(LS_ACTIVE_KEY, activeId);
    }
    setConversationId(activeId);

    const stored = lsGet<Message[]>(lsMessages(activeId), []);
    if (stored.length > 0) {
      setMessages(stored);
    }

    // Load conversation list
    loadConversationList();
  }, []);

  // ── Persist messages to localStorage on every change ──
  useEffect(() => {
    if (!conversationId || !initialized.current) return;
    lsSet(lsMessages(conversationId), messages);
    lsSet(LS_ACTIVE_KEY, conversationId);
  }, [messages, conversationId]);

  // ── Load files ──
  const refreshFiles = useCallback(() => {
    fetch("/api/chat/files")
      .then((r) => r.json())
      .then((d) => setSavedFiles(d.files || []))
      .catch(() => setSavedFiles([]));
  }, []);

  // Fetch when Files tab is opened
  useEffect(() => {
    if (activeTab === "files") {
      refreshFiles();
    }
  }, [activeTab, refreshFiles]);

  // ── Supabase sync (non-blocking, after AI response) ──
  const syncToSupabase = useCallback(
    async (convId: string, msgs: Message[], title?: string) => {
      try {
        // Ensure conversation exists
        await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: convId,
            title: title || msgs[0]?.content?.slice(0, 50) || "New conversation",
          }),
        });

        // Sync messages
        await fetch(`/api/conversations/${convId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: msgs.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              files: m.files || [],
              preview_html: m.previewHtml || "",
              created_at: m.timestamp,
            })),
          }),
        });
      } catch {
        // Supabase sync is best-effort — localStorage is primary
      }
    },
    []
  );

  // ── Load conversation list ──
  const loadConversationList = useCallback(async () => {
    try {
      const resp = await fetch("/api/conversations");
      const data = await resp.json();
      const list = data.conversations || [];
      setConversations(list);
      lsSet(LS_LIST_KEY, list);
    } catch {
      // Fall back to cached list
      setConversations(lsGet(LS_LIST_KEY, []));
    }
  }, []);

  // ── Load a specific conversation ──
  const loadConversation = useCallback(
    async (id: string) => {
      setConversationId(id);
      lsSet(LS_ACTIVE_KEY, id);
      setActiveWorkflow(null);

      // Try localStorage first
      const stored = lsGet<Message[]>(lsMessages(id), []);
      if (stored.length > 0) {
        setMessages(stored);
        return;
      }

      // Fall back to Supabase
      try {
        const resp = await fetch(`/api/conversations/${id}`);
        const data = await resp.json();
        const msgs: Message[] = (data.messages || []).map(
          (m: Record<string, unknown>) => ({
            id: m.id as string,
            role: m.role as "user" | "assistant",
            content: m.content as string,
            timestamp: m.created_at as string,
            files: (m.files as FileAttachment[]) || undefined,
            previewHtml: (m.preview_html as string) || undefined,
          })
        );
        setMessages(msgs);
        lsSet(lsMessages(id), msgs);
      } catch {
        setMessages([]);
      }
    },
    []
  );

  // ── New chat ──
  const resetChat = useCallback(() => {
    const newId = generateId();
    setConversationId(newId);
    setMessages([]);
    setActiveWorkflow(null);
    lsSet(LS_ACTIVE_KEY, newId);
    // Refresh conversation list after a short delay
    setTimeout(loadConversationList, 500);
  }, [loadConversationList]);

  // ── Delete a conversation ──
  const deleteConversation = useCallback(
    async (id: string) => {
      lsRemove(lsMessages(id));
      try {
        await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      } catch { /* best effort */ }

      // If we deleted the active conversation, start a new one
      if (id === conversationId) {
        resetChat();
      }
      await loadConversationList();
    },
    [conversationId, resetChat, loadConversationList]
  );

  // ── Send message ──
  const sendMessage = useCallback(
    async (text: string, action?: string) => {
      if (!text.trim() && !action) return;

      const userMsg: Message = {
        id: generateId(),
        role: "user",
        content: action
          ? `[${QUICK_ACTIONS.find((a) => a.id === action)?.label}] ${text || ""}`
          : text,
        timestamp: new Date().toISOString(),
      };

      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setLoading(true);

      const currentWorkflow = action || activeWorkflow;
      if (action) setActiveWorkflow(action);

      const isSkillsWorkflow = !!(
        (action && SKILLS_ACTIONS.has(action)) ||
        (currentWorkflow && SKILLS_ACTIONS.has(currentWorkflow))
      );

      // Progress phases for file generation
      const phases = [
        { delay: 0, msg: "Building your document..." },
        { delay: 10000, msg: "Running calculations..." },
        { delay: 25000, msg: "Formatting workbook and applying conditional formatting..." },
        { delay: 45000, msg: "Finalizing and preparing download..." },
        { delay: 90000, msg: "This is taking longer than usual. Still working - complex models can take up to 2 minutes." },
      ];
      const phaseTimers: ReturnType<typeof setTimeout>[] = [];

      if (isSkillsWorkflow) {
        for (const phase of phases) {
          phaseTimers.push(setTimeout(() => setLoadingPhase(phase.msg), phase.delay));
        }
      }

      try {
        let data: { reply?: string; error?: string; files?: FileAttachment[]; previewHtml?: string };

        // All requests go through the Next.js /api/chat proxy which:
        // - Routes skills actions to the Python bridge (server-to-server, no CORS)
        // - Rewrites download URLs to same-origin /api/chat/download proxy
        // - Handles standard chat via Claude API directly
        const resp = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            action: action || (isSkillsWorkflow ? currentWorkflow : undefined),
            activeWorkflow: currentWorkflow,
            session_id: conversationId,
            recordType,
            recordId,
            history: messages.map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        if (!resp.ok) {
          const errBody = await resp.json().catch(() => ({}));
          const detail = errBody.error || "";

          let userMessage = "Something went wrong generating your file. Try again or ask me to simplify the request.";
          if (resp.status === 429 || detail.includes("rate_limit")) {
            userMessage = "We've hit a temporary limit. Please wait 30 seconds and try again.";
          } else if (detail.includes("timeout") || resp.status === 504) {
            userMessage = "Your request is taking longer than expected. Try refreshing in 30 seconds, or try again.";
          } else if (resp.status === 502) {
            userMessage = isSkillsWorkflow
              ? "File generation service is temporarily unavailable. Please try again in a moment."
              : "AI service is temporarily unavailable. Please try again.";
          }
          throw new Error(userMessage);
        }

        data = await resp.json();

        const aiMsg: Message = {
          id: generateId(),
          role: "assistant",
          content: data.reply || data.error || "Something went wrong.",
          timestamp: new Date().toISOString(),
          files: data.files || undefined,
          previewHtml: data.previewHtml || undefined,
        };

        const allMessages = [...newMessages, aiMsg];
        setMessages(allMessages);

        // Dispatch toast event for file generation + refresh My Files
        if (data.files && data.files.length > 0) {
          for (const f of data.files) {
            window.dispatchEvent(
              new CustomEvent("endall-file-ready", {
                detail: { filename: f.filename, downloadUrl: f.download_url },
              })
            );
          }
          // Refresh My Files list so newly generated file appears
          setTimeout(refreshFiles, 1000);
        }

        // Non-blocking Supabase sync
        const title = generateConversationTitle(action || currentWorkflow || undefined, text);
        syncToSupabase(conversationId, allMessages, title);
      } catch (err) {
        const errorMsg =
          err instanceof Error && err.message !== "Failed to fetch"
            ? err.message
            : isSkillsWorkflow
              ? "We're having trouble reaching our AI service. This usually resolves in a few minutes."
              : "Failed to connect to AI service. Please try again.";

        const errMessages = [
          ...newMessages,
          {
            id: generateId(),
            role: "assistant" as const,
            content: errorMsg,
            timestamp: new Date().toISOString(),
          },
        ];
        setMessages(errMessages);
      } finally {
        phaseTimers.forEach(clearTimeout);
        setLoadingPhase("");
        setLoading(false);
      }
    },
    [messages, activeWorkflow, recordType, recordId, conversationId, syncToSupabase, refreshFiles]
  );

  return {
    // State
    conversationId,
    messages,
    conversations,
    loading,
    loadingPhase,
    activeWorkflow,
    activeTab,
    savedFiles,

    // Setters (for UI control)
    setActiveTab,
    setInput: undefined, // input is managed by the component, not the hook

    // Actions
    sendMessage,
    resetChat,
    loadConversation,
    loadConversationList,
    deleteConversation,
  };
}
