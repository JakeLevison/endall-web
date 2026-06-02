import { render, screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import AgentCardsGrid from "../AgentCardsGrid";
import type { AgentLog } from "@/lib/ops-api";

function log(partial: Partial<AgentLog>): AgentLog {
  return {
    agent_id: "fr-001",
    action: "inbound_call",
    company_name: "Acme",
    result: "qualified",
    status: "completed",
    output_data: null,
    created_at: new Date().toISOString(),
    ...partial,
  };
}

describe("AgentCardsGrid card links + last activity", () => {
  it("links each card to its detail route", () => {
    render(<AgentCardsGrid logs={[]} performance={{}} statuses={{}} />);
    expect(screen.getByTestId("agent-card-front_desk")).toHaveAttribute(
      "href",
      "/command-center/agents/front_desk",
    );
    expect(screen.getByTestId("agent-card-estimator")).toHaveAttribute(
      "href",
      "/command-center/agents/estimator",
    );
    expect(
      screen.getByTestId("agent-card-competitive_intel"),
    ).toHaveAttribute("href", "/command-center/agents/competitive_intel");
  });

  it("surfaces last activity time + last result on a health card", () => {
    render(
      <AgentCardsGrid
        logs={[log({ agent_id: "fr-001", result: "qualified" })]}
        performance={{}}
        statuses={{}}
      />,
    );
    const card = screen.getByTestId("agent-card-front_desk");
    const summary = within(card).getByText(/last activity/i);
    expect(summary).toBeInTheDocument();
    expect(summary.textContent).toMatch(/qualified for proposal/i);
  });

  it("omits the last-activity summary when a health agent has no logs", () => {
    render(<AgentCardsGrid logs={[]} performance={{}} statuses={{}} />);
    const card = screen.getByTestId("agent-card-sdr");
    expect(within(card).queryByText(/last activity/i)).toBeNull();
  });
});
