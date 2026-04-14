import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import InlineCTA from "../InlineCTA";

const captureMock = vi.fn();
vi.mock("@/lib/posthog", () => ({
  posthog: { capture: (...args: unknown[]) => captureMock(...args) },
}));

describe("InlineCTA — voice agent variant", () => {
  beforeEach(() => {
    captureMock.mockClear();
  });

  it("omits voice CTA by default", () => {
    render(<InlineCTA lead="Want to see this?" cta="Book a demo" href="/contact" />);
    expect(screen.queryByText(/try the voice agent/i)).toBeNull();
  });

  it("renders voice CTA link when showVoiceCta is set", () => {
    render(
      <InlineCTA
        lead="Want to see this?"
        cta="Book a demo"
        href="/contact"
        showVoiceCta
      />
    );
    const link = screen.getByRole("link", { name: /try the voice agent/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/demo?start=voice");
  });

  it("fires posthog voice_agent_cta_clicked with source inline_cta on click", () => {
    render(
      <InlineCTA lead="x" cta="y" href="/z" showVoiceCta />
    );
    const link = screen.getByRole("link", { name: /try the voice agent/i });
    fireEvent.click(link);
    expect(captureMock).toHaveBeenCalledWith("voice_agent_cta_clicked", {
      source: "inline_cta",
    });
  });
});
