"use client";

import { useState } from "react";
import type { AgentLog } from "@/lib/ops-api";

// ── Types ───────────────────────────────────────────────────────────

interface WarmLead {
  company: string;
  industry: string;
  state: string;
  status: "WARM" | "HOT";
  value: number;
  date: string;
}

type SortKey = "company" | "state" | "status" | "value" | "date";

// ── Extract leads from logs ─────────────────────────────────────────

function extractLeads(logs: AgentLog[]): WarmLead[] {
  const seen = new Set<string>();
  const leads: WarmLead[] = [];

  for (const log of logs) {
    if (log.result !== "warm" && log.result !== "hot") continue;
    const key = log.company_name || log.created_at;
    if (seen.has(key)) continue;
    seen.add(key);

    const od = (log.output_data ?? {}) as Record<string, unknown>;
    leads.push({
      company: log.company_name || "Unknown",
      industry: (od.industry as string) || (od.service_type as string) || "MEP",
      state: (od.state as string) || "—",
      status: log.result === "hot" ? "HOT" : "WARM",
      value: typeof od.estimated_value === "number" ? od.estimated_value : 0,
      date: log.created_at,
    });
  }

  return leads;
}

// ── Helpers ─────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function fmtMoney(n: number): string {
  if (n === 0) return "—";
  return "$" + n.toLocaleString("en-US");
}

// ── Main ────────────────────────────────────────────────────────────

interface Props {
  logs: AgentLog[];
}

export default function WarmLeadsTable({ logs }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);

  const leads = extractLeads(logs);

  const sorted = [...leads].sort((a, b) => {
    const dir = sortAsc ? 1 : -1;
    switch (sortKey) {
      case "company":
        return dir * a.company.localeCompare(b.company);
      case "state":
        return dir * a.state.localeCompare(b.state);
      case "status":
        return dir * a.status.localeCompare(b.status);
      case "value":
        return dir * (a.value - b.value);
      case "date":
        return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
      default:
        return 0;
    }
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const thStyle = {
    textAlign: "left" as const,
    fontSize: 11,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: "var(--text-muted)",
    paddingBottom: 10,
    paddingRight: 16,
    cursor: "pointer" as const,
    userSelect: "none" as const,
    fontWeight: 500 as const,
  };

  const arrow = (key: SortKey) =>
    sortKey === key ? (sortAsc ? " ↑" : " ↓") : "";

  return (
    <div
      style={{
        background: "var(--overlay-weak)",
        border: "1px solid var(--overlay-soft)",
        borderRadius: 12,
        padding: "20px 24px",
      }}
    >
      <h3
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: 16,
        }}
      >
        Warm Leads
      </h3>

      {sorted.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Your ops team is standing by. Leads will appear here as they come in.
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--overlay-soft)" }}>
                <th style={thStyle} onClick={() => toggleSort("company")}>
                  Company{arrow("company")}
                </th>
                <th style={{ ...thStyle, display: "none" }} className="hidden sm:table-cell">
                  Industry
                </th>
                <th style={thStyle} onClick={() => toggleSort("state")}>
                  State{arrow("state")}
                </th>
                <th style={thStyle} onClick={() => toggleSort("status")}>
                  Status{arrow("status")}
                </th>
                <th style={thStyle} onClick={() => toggleSort("value")}>
                  Est. Value{arrow("value")}
                </th>
                <th style={thStyle} onClick={() => toggleSort("date")}>
                  Date{arrow("date")}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 15).map((lead, i) => (
                <tr
                  key={`${lead.company}-${i}`}
                  style={{
                    borderBottom: "1px solid var(--overlay-soft)",
                  }}
                >
                  <td
                    style={{
                      padding: "10px 16px 10px 0",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--text-primary)",
                    }}
                  >
                    {lead.company}
                  </td>
                  <td
                    className="hidden sm:table-cell"
                    style={{
                      padding: "10px 16px 10px 0",
                      fontSize: 13,
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {lead.industry}
                  </td>
                  <td
                    style={{
                      padding: "10px 16px 10px 0",
                      fontSize: 13,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {lead.state}
                  </td>
                  <td style={{ padding: "10px 16px 10px 0" }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        padding: "3px 8px",
                        borderRadius: 6,
                        color: lead.status === "HOT" ? "#ef4444" : "#f97316",
                        background:
                          lead.status === "HOT"
                            ? "rgba(239,68,68,0.12)"
                            : "rgba(249,115,22,0.12)",
                      }}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "10px 16px 10px 0",
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {fmtMoney(lead.value)}
                  </td>
                  <td
                    style={{
                      padding: "10px 0",
                      fontSize: 13,
                      color: "var(--text-muted)",
                    }}
                  >
                    {fmtDate(lead.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
