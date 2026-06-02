import { render, screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import AgentCardsGrid from "../AgentCardsGrid";

// Step 3: the grid renders three card tiers. Health agents keep the
// status-driven AgentCard; Estimator renders an honest metrics-only card
// (no health badge); Competitive/Market Intel render freshness cards.

describe("AgentCardsGrid tiered card model", () => {
  it("renders an honest metrics-only card for Estimator", () => {
    render(
      <AgentCardsGrid
        logs={[]}
        performance={{}}
        statuses={{}}
        metrics={{
          estimator: {
            kpis: [
              { label: "Estimates", value: "12" },
              { label: "Approval", value: "68%" },
            ],
          },
        }}
      />,
    );
    const card = screen.getByTestId("agent-card-estimator");
    expect(within(card).getByText("Estimator")).toBeInTheDocument();
    expect(within(card).getByText("12")).toBeInTheDocument();
    expect(within(card).getByText("68%")).toBeInTheDocument();
    // Honest about the absence of a live health signal — no green ACTIVE badge.
    expect(within(card).getByText(/metrics only/i)).toBeInTheDocument();
    expect(within(card).queryByText(/^ACTIVE$/)).toBeNull();
  });

  it("renders a freshness card for Competitive Intel", () => {
    render(
      <AgentCardsGrid
        logs={[]}
        performance={{}}
        statuses={{}}
        freshness={{
          competitive_intel: {
            lastUpdated: "2026-06-01T09:10:00Z",
            count: 8,
            countLabel: "competitors tracked",
          },
        }}
      />,
    );
    const card = screen.getByTestId("agent-card-competitive_intel");
    expect(within(card).getByText("Competitive Intel")).toBeInTheDocument();
    expect(within(card).getByText(/last synced/i)).toBeInTheDocument();
    expect(within(card).getByText(/8\s+competitors tracked/i)).toBeInTheDocument();
  });

  it("shows a no-data state when metrics/freshness data is absent", () => {
    render(<AgentCardsGrid logs={[]} performance={{}} statuses={{}} />);
    expect(
      within(screen.getByTestId("agent-card-estimator")).getByText(/no data/i),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("agent-card-market_intel")).getByText(
        /no data/i,
      ),
    ).toBeInTheDocument();
  });

  it("still renders health cards (Front Desk relabeled agents) with status", () => {
    render(<AgentCardsGrid logs={[]} performance={{}} statuses={{}} />);
    expect(screen.getByTestId("agent-card-front_desk")).toBeInTheDocument();
    // Customer relabels: research -> Enrichment, email -> Outreach.
    expect(
      within(screen.getByTestId("agent-card-research")).getByText("Enrichment"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("agent-card-email")).getByText("Outreach"),
    ).toBeInTheDocument();
  });
});
