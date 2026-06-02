import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AgentDetail } from "../AgentDetail";
import { COMMAND_CENTER_AGENTS } from "../roster";

describe("AgentDetail", () => {
  it("renders the agent label and tier for a known descriptor", () => {
    const frontDesk = COMMAND_CENTER_AGENTS.find((a) => a.id === "front_desk")!;
    render(<AgentDetail descriptor={frontDesk} id="front_desk" />);
    expect(
      screen.getByRole("heading", { name: /front desk/i }),
    ).toBeInTheDocument();
    // Stub detail view — honest placeholder, not fabricated content.
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    // Back link to the command center.
    expect(screen.getByRole("link", { name: /command center/i })).toHaveAttribute(
      "href",
      "/command-center",
    );
  });

  it("uses the customer relabel for renamed agents", () => {
    const research = COMMAND_CENTER_AGENTS.find((a) => a.id === "research")!;
    render(<AgentDetail descriptor={research} id="research" />);
    expect(
      screen.getByRole("heading", { name: /enrichment/i }),
    ).toBeInTheDocument();
  });

  it("renders a not-found state for an unknown agent id", () => {
    render(<AgentDetail descriptor={null} id="bogus" />);
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /command center/i }),
    ).toBeInTheDocument();
  });
});
