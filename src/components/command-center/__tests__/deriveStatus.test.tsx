import { describe, it, expect } from "vitest";
import { deriveStatus } from "../AgentCardsGrid";
import type { AgentLog, AgentStatusResponse } from "@/lib/ops-api";

const NOW = new Date("2026-06-02T12:00:00Z").getTime();

function status(partial: Partial<AgentStatusResponse>): AgentStatusResponse {
  return {
    agent_id: "fr-001",
    pending_messages: 0,
    total_actions: 10,
    conversion_rate: 0.5,
    status: "healthy",
    ...partial,
  };
}

function logAt(iso: string): AgentLog {
  return {
    agent_id: "fr-001",
    action: "inbound_call",
    company_name: "Acme",
    result: "qualified",
    status: "completed",
    output_data: null,
    created_at: iso,
  };
}

describe("deriveStatus", () => {
  it("OFFLINE when there is no health response (cannot confirm the agent)", () => {
    expect(deriveStatus(null, [logAt("2026-06-02T11:59:00Z")], NOW).label).toBe(
      "OFFLINE",
    );
  });

  it("ERROR when the bridge reports a non-healthy status string", () => {
    expect(deriveStatus(status({ status: "degraded" }), [], NOW).label).toBe(
      "ERROR",
    );
    expect(deriveStatus(status({ status: "error" }), [], NOW).label).toBe(
      "ERROR",
    );
  });

  it("PROCESSING when healthy with pending messages", () => {
    expect(
      deriveStatus(status({ pending_messages: 2 }), [], NOW).label,
    ).toBe("PROCESSING");
  });

  it("ACTIVE when healthy with activity inside the freshness window", () => {
    expect(
      deriveStatus(status({}), [logAt("2026-06-02T06:00:00Z")], NOW).label,
    ).toBe("ACTIVE");
  });

  it("STALE when healthy but the latest activity is older than the window", () => {
    expect(
      deriveStatus(status({}), [logAt("2026-05-20T12:00:00Z")], NOW).label,
    ).toBe("STALE");
  });

  it("IDLE when healthy with no activity at all", () => {
    expect(deriveStatus(status({}), [], NOW).label).toBe("IDLE");
  });

  it("returns a hex color for every state (so alpha suffixes are valid CSS)", () => {
    const cases = [
      deriveStatus(null, [], NOW),
      deriveStatus(status({ status: "error" }), [], NOW),
      deriveStatus(status({ pending_messages: 1 }), [], NOW),
      deriveStatus(status({}), [logAt("2026-06-02T11:00:00Z")], NOW),
      deriveStatus(status({}), [], NOW),
    ];
    for (const c of cases) expect(c.color).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
