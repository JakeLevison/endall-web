import { render, screen, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/command-center",
}));

const mockLogs = [
  {
    agent_id: "fr-001",
    action: "answered incoming call",
    company_name: "Acme HVAC",
    result: "qualified",
    status: "success",
    output_data: null,
    created_at: new Date().toISOString(),
  },
  {
    agent_id: "email-001",
    action: "sent outbound email",
    company_name: "Beta Mechanical",
    result: "delivered",
    status: "success",
    output_data: null,
    created_at: new Date().toISOString(),
  },
];

vi.mock("@/lib/ops-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ops-api")>(
    "@/lib/ops-api"
  );
  return {
    ...actual,
    useAllLogs: () => ({
      data: mockLogs,
      isValidating: false,
      mutate: vi.fn(),
    }),
    useCommandCenterStats: () => ({
      data: {
        total_contacts: 42,
        leads_this_week: 3,
        emails_sent_this_week: 7,
        calls_handled_this_week: 5,
      },
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    }),
  };
});

vi.mock("@/lib/posthog", () => ({
  posthog: { capture: vi.fn() },
}));

beforeEach(() => {
  // IntersectionObserver is not implemented in jsdom
  class IO {
    observe() {}
    disconnect() {}
    unobserve() {}
    takeRecords() {
      return [];
    }
  }
  // @ts-expect-error -- test stub
  globalThis.IntersectionObserver = IO;

  // Stub fetch for /api/chat/files
  globalThis.fetch = vi.fn(async () => ({
    ok: true,
    json: async () => ({ files: [] }),
  })) as unknown as typeof fetch;
});

import CommandCenterPage from "../page";

describe("CommandCenterPage", () => {
  it("renders the page header", () => {
    render(<CommandCenterPage />);
    expect(
      screen.getByRole("heading", { name: /command center/i })
    ).toBeInTheDocument();
  });

  it("renders agent display names, not raw IDs, in the activity feed", () => {
    render(<CommandCenterPage />);
    const feed = screen.getByText("Activity Feed").closest("section")!;
    expect(within(feed).getByText("Front Desk")).toBeInTheDocument();
    expect(within(feed).getByText("Email")).toBeInTheDocument();
    expect(within(feed).queryByText("fr-001")).toBeNull();
    expect(within(feed).queryByText("email-001")).toBeNull();
  });

  it("renders all four pipeline summary cards", () => {
    render(<CommandCenterPage />);
    const section = screen.getByText("Pipeline Summary").closest("section")!;
    expect(within(section).getByText("Total Contacts")).toBeInTheDocument();
    expect(within(section).getByText("Leads This Week")).toBeInTheDocument();
    expect(within(section).getByText("Emails Sent")).toBeInTheDocument();
    expect(within(section).getByText("Calls Handled")).toBeInTheDocument();
  });

  it("renders workflow history empty state without breaking layout", () => {
    render(<CommandCenterPage />);
    const section = screen.getByText("Workflow History").closest("section")!;
    expect(
      within(section).getByText(/no workflow files yet/i)
    ).toBeInTheDocument();
  });

  it("renders the quick actions grid", () => {
    render(<CommandCenterPage />);
    const section = screen.getByText("Quick Actions").closest("section")!;
    expect(
      within(section).getByText(/build a financial model/i)
    ).toBeInTheDocument();
  });
});
