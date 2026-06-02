import { render, screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import AgentCardsGrid from "../AgentCardsGrid";
import { normalizeAgentId, type AgentLog } from "@/lib/ops-api";

describe("normalizeAgentId", () => {
  it("maps dash-form bridge ids to canonical AGENTS ids", () => {
    expect(normalizeAgentId("fr-001")).toBe("front_desk");
    expect(normalizeAgentId("sdr-001")).toBe("sdr");
    expect(normalizeAgentId("research-001")).toBe("research");
    expect(normalizeAgentId("email-001")).toBe("email");
  });

  it("passes through canonical ids and trims/lowercases", () => {
    expect(normalizeAgentId("front_desk")).toBe("front_desk");
    expect(normalizeAgentId("  FR-001 ")).toBe("front_desk");
  });

  it("returns empty string for null/undefined and passes unknown ids", () => {
    expect(normalizeAgentId(null)).toBe("");
    expect(normalizeAgentId(undefined)).toBe("");
    expect(normalizeAgentId("mystery-009")).toBe("mystery-009");
  });
});

// The bridge's /api/agent-logs returns agent_id in dash form (fr-001),
// while AGENTS / status / performance use the underscore canonical id
// (front_desk). The grid must reconcile the two or every card renders
// empty despite real activity.

function log(partial: Partial<AgentLog>): AgentLog {
  return {
    agent_id: "fr-001",
    action: "inbound_call",
    company_name: "Acme Mechanical",
    result: "qualified",
    status: "completed",
    output_data: null,
    created_at: new Date().toISOString(),
    ...partial,
  };
}

describe("AgentCardsGrid agent_id reconciliation", () => {
  it("routes dash-form (fr-001) logs to the Front Desk card", () => {
    render(
      <AgentCardsGrid
        logs={[log({ agent_id: "fr-001" })]}
        performance={{}}
        statuses={{}}
      />,
    );

    const card = screen.getByTestId("agent-card-front_desk");
    // The fr-001 log's outcome language should render on the Front Desk card.
    expect(
      within(card).getByText(/qualified for proposal/i),
    ).toBeInTheDocument();
    // ...and an agent WITHOUT logs should still show the idle placeholder.
    const sdrCard = screen.getByTestId("agent-card-sdr");
    expect(within(sdrCard).getByText(/standing by/i)).toBeInTheDocument();
  });

  it("routes each agent's dash-form logs to its own card", () => {
    render(
      <AgentCardsGrid
        logs={[
          log({ agent_id: "sdr-001", company_name: "Beta Co", result: "sent" }),
          log({
            agent_id: "research-001",
            company_name: "Gamma Co",
            result: "researched",
          }),
        ]}
        performance={{}}
        statuses={{}}
      />,
    );

    expect(
      within(screen.getByTestId("agent-card-sdr")).getByText(/Beta Co/),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("agent-card-research")).getByText(/Gamma Co/),
    ).toBeInTheDocument();
    // Front Desk had no logs → idle.
    expect(
      within(screen.getByTestId("agent-card-front_desk")).getByText(
        /standing by/i,
      ),
    ).toBeInTheDocument();
  });
});
