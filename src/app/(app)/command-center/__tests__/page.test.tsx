import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    input_data: null,
    output_data: null,
    created_at: new Date().toISOString(),
  },
  {
    agent_id: "email-001",
    action: "sent outbound email",
    company_name: "Beta Mechanical",
    result: "delivered",
    status: "success",
    input_data: null,
    output_data: null,
    created_at: new Date().toISOString(),
  },
];

// Inbound calls the bridge couldn't attribute to a company: company_name is
// the literal "Unknown", but the caller phone/name lives in input_data.
const unknownCompanyLog = {
  agent_id: "fr-001",
  action: "inbound_call",
  company_name: "Unknown",
  result: "qualified",
  status: "completed",
  input_data: { contact: { name: "", phone: "+12036109399" } },
  output_data: null,
  created_at: new Date().toISOString(),
};

const manyLogs = Array.from({ length: 9 }, (_, i) => ({
  agent_id: "fr-001",
  action: `inbound_call ${i}`,
  company_name: `Company ${i}`,
  result: "qualified",
  status: "success",
  input_data: null,
  output_data: null,
  created_at: new Date(Date.now() - i * 60_000).toISOString(),
}));

// Mutable so individual tests can swap the log set the page receives.
let activeLogs: unknown[] = mockLogs;

vi.mock("@/lib/ops-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ops-api")>(
    "@/lib/ops-api"
  );
  return {
    ...actual,
    useAllLogs: () => ({
      data: activeLogs,
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
  activeLogs = mockLogs;
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

  it("collapses the activity feed to 5 events with a view-all control", async () => {
    activeLogs = manyLogs; // 9 logs
    render(<CommandCenterPage />);
    const feed = screen.getByText("Activity Feed").closest("section")!;
    // Only the first 5 are shown by default.
    expect(within(feed).getByText(/inbound_call 0/)).toBeInTheDocument();
    expect(within(feed).getByText(/inbound_call 4/)).toBeInTheDocument();
    expect(within(feed).queryByText(/inbound_call 5/)).toBeNull();

    const toggle = within(feed).getByRole("button", { name: /view all 9/i });
    await userEvent.click(toggle);
    expect(within(feed).getByText(/inbound_call 8/)).toBeInTheDocument();
    expect(
      within(feed).getByRole("button", { name: /show less/i })
    ).toBeInTheDocument();
  });

  it("labels unattributed inbound calls by caller, never literal 'Unknown'", () => {
    activeLogs = [unknownCompanyLog];
    render(<CommandCenterPage />);
    const feed = screen.getByText("Activity Feed").closest("section")!;
    expect(within(feed).getByText(/\+1 203-610-9399/)).toBeInTheDocument();
    expect(within(feed).queryByText(/— Unknown/)).toBeNull();
  });

  it("renders all four pipeline summary cards", () => {
    render(<CommandCenterPage />);
    const section = screen.getByText("Pipeline Summary").closest("section")!;
    expect(within(section).getByText("Total Contacts")).toBeInTheDocument();
    expect(within(section).getByText("Leads This Week")).toBeInTheDocument();
    expect(within(section).getByText("Emails Sent")).toBeInTheDocument();
    expect(within(section).getByText("Calls Handled")).toBeInTheDocument();
  });

  it("renders workflow history empty state without breaking layout", async () => {
    render(<CommandCenterPage />);
    const section = screen.getByText("Workflow History").closest("section")!;
    expect(
      await within(section).findByText(/no workflow files yet/i)
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
