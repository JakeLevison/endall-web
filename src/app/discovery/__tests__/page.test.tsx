import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import DiscoveryPage from "../page";

const captureMock = vi.fn();
vi.mock("@/lib/posthog", () => ({
  posthog: { capture: (...args: unknown[]) => captureMock(...args) },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/discovery",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// jsdom polyfills
class IOStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error polyfill
globalThis.IntersectionObserver = IOStub;

describe("Discovery page", () => {
  beforeEach(() => {
    captureMock.mockClear();
  });

  it("renders Jake's exact headline", () => {
    render(<DiscoveryPage />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /if you had an ai, what would you ask it\?/i,
      })
    ).toBeInTheDocument();
  });

  it("renders 5–8 example questions", () => {
    render(<DiscoveryPage />);
    const list = screen.getByTestId("discovery-questions");
    const items = list.querySelectorAll("li");
    expect(items.length).toBeGreaterThanOrEqual(5);
    expect(items.length).toBeLessThanOrEqual(8);
  });

  it("CTA routes to the canonical booking destination", () => {
    render(<DiscoveryPage />);
    const cta = screen.getByRole("link", { name: /book a discovery call/i });
    expect(cta).toHaveAttribute("href", "/contact?intent=book_demo");
  });

  it("fires discovery_page_viewed on mount", () => {
    render(<DiscoveryPage />);
    expect(captureMock).toHaveBeenCalledWith("discovery_page_viewed");
  });
});
