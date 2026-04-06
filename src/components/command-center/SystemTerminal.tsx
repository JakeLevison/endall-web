"use client";

import { useState, useEffect, useRef } from "react";
import { Terminal } from "lucide-react";
import type { AgentLog } from "@/lib/ops-api";

// ── Format log line ─────────────────────────────────────────────────

function fmtLogLine(log: AgentLog): string {
  const ts = new Date(log.created_at).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const agent = (log.agent_id || "???").toUpperCase().slice(0, 6).padEnd(6);
  const action = log.action || "unknown";
  const result = log.result ? ` — ${log.result}` : "";
  const company = log.company_name ? ` (${log.company_name})` : "";
  return `[${ts}] ${agent} ${action}${result}${company}`;
}

// ── Main ────────────────────────────────────────────────────────────

interface Props {
  logs: AgentLog[];
  isAdmin?: boolean;
}

export default function SystemTerminal({ logs, isAdmin = false }: Props) {
  const [visible, setVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Cmd+Shift+T toggle
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "T") {
        e.preventDefault();
        setVisible((v) => !v);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (visible && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, visible]);

  // Only render toggle for admins
  if (!isAdmin) return null;

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setVisible((v) => !v)}
        style={{
          position: "fixed",
          bottom: 16,
          left: 16,
          zIndex: 50,
          width: 36,
          height: 36,
          borderRadius: 8,
          background: visible ? "var(--overlay-medium)" : "var(--overlay-weak)",
          border: "1px solid var(--overlay-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "background 0.15s",
        }}
        title="System Terminal (⌘⇧T)"
      >
        <Terminal size={16} style={{ color: "var(--text-muted)" }} />
      </button>

      {/* Terminal panel */}
      {visible && (
        <div
          style={{
            background: "#0c0c0c",
            border: "1px solid var(--overlay-medium)",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          {/* Terminal header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 14px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Terminal size={13} style={{ color: "#22c55e" }} />
              <span
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 11,
                  color: "#22c55e",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                System Terminal
              </span>
            </div>
            <button
              onClick={() => setVisible(false)}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.3)",
                cursor: "pointer",
                fontSize: 14,
                padding: "2px 6px",
              }}
            >
              &times;
            </button>
          </div>

          {/* Log output */}
          <div
            ref={scrollRef}
            style={{
              maxHeight: 240,
              overflowY: "auto",
              padding: "10px 14px",
              fontFamily: "var(--font-mono), monospace",
              fontSize: 12,
              lineHeight: 1.7,
            }}
          >
            {logs.length === 0 ? (
              <span style={{ color: "#eab308" }}>
                Waiting for agent activity...
              </span>
            ) : (
              logs.map((log, i) => {
                const isError = log.status === "error";
                return (
                  <div
                    key={`${log.created_at}-${i}`}
                    style={{
                      color: isError ? "#ef4444" : "#22c55e",
                      whiteSpace: "pre",
                    }}
                  >
                    {fmtLogLine(log)}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
}
