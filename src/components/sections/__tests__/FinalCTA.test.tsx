import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FinalCTA from "../FinalCTA";

const captureMock = vi.fn();
vi.mock("@/lib/posthog", () => ({
  posthog: { capture: (...args: unknown[]) => captureMock(...args) },
}));

// jsdom lacks IntersectionObserver
class IOStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error -- jsdom polyfill
globalThis.IntersectionObserver = IOStub;

describe("FinalCTA — voice agent button", () => {
  beforeEach(() => {
    captureMock.mockClear();
  });

  it("renders the voice agent button pointing at /demo?start=voice", () => {
    render(<FinalCTA />);
    const btn = screen.getByRole("link", { name: /try the voice agent/i });
    expect(btn).toHaveAttribute("href", "/demo?start=voice");
  });

  it("fires posthog voice_agent_cta_clicked with source final_cta on click", () => {
    render(<FinalCTA />);
    const btn = screen.getByRole("link", { name: /try the voice agent/i });
    fireEvent.click(btn);
    expect(captureMock).toHaveBeenCalledWith("voice_agent_cta_clicked", {
      source: "final_cta",
    });
  });
});
