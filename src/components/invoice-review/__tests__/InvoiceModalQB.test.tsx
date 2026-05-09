import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { InvoiceModal, type InvoiceJobSummary } from "../InvoiceModal";

vi.mock("@/lib/posthog", () => ({
  posthog: { capture: vi.fn() },
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

const JOB: InvoiceJobSummary = {
  job_id: "job-xyz",
  caller_name: "Acme Plumbing",
  job_type: "Install",
  preferred_date: "2026-04-15",
};

type Route =
  | { url: string | RegExp; handler: (init?: RequestInit) => Response | Promise<Response> };

function makeFetchRouter(routes: Route[]) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    for (const r of routes) {
      if (typeof r.url === "string" ? url === r.url : r.url.test(url)) {
        return r.handler(init);
      }
    }
    return {
      ok: false,
      status: 404,
      json: async () => ({ error: `no mock for ${url}` }),
      text: async () => `no mock for ${url}`,
    } as unknown as Response;
  });
}

function jsonOk(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

async function generateInvoice() {
  fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "500" } });
  fireEvent.click(screen.getByRole("button", { name: /generate invoice/i }));
  await waitFor(() => {
    expect(
      screen.getByRole("heading", { name: /invoice generated/i })
    ).toBeInTheDocument();
  });
}

describe("InvoiceModal QB post-generation view", () => {
  beforeEach(() => {
    // jsdom anchor.click() is a no-op, which is fine — the test just needs
    // the modal to transition past generation. No mocks required.
    toastSuccess.mockClear();
    toastError.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the green header badge + fires success toast after auto-push completes", async () => {
    const fetchMock = makeFetchRouter([
      {
        url: "/api/invoices/generate",
        handler: () =>
          jsonOk({
            download_url: "/download/x",
            filename: "x.xlsx",
            invoice_number: "INV-2026-04-14-001",
            invoice_id: "inv-1",
          }),
      },
      {
        url: "/api/quickbooks/status",
        handler: () => jsonOk({ connected: true, auto_push_enabled: true }),
      },
      {
        url: /\/api\/quickbooks\/invoices\/inv-1\/status/,
        handler: () =>
          jsonOk({
            invoice_id: "inv-1",
            qb_invoice_id: "qb-777",
            qb_pushed_at: "2026-04-14T12:34:56Z",
            qb_push_error: null,
          }),
      },
    ]);
    vi.stubGlobal("fetch", fetchMock);

    render(<InvoiceModal job={JOB} open={true} onClose={() => {}} />);
    await generateInvoice();

    await waitFor(() => {
      expect(screen.getByTestId("qb-header-pushed-badge")).toHaveTextContent(
        "qb-777",
      );
    });
    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith(
        "Pushed to QuickBooks, invoice qb-777",
      );
    });
    expect(screen.queryByTestId("qb-push-error-banner")).not.toBeInTheDocument();
  });

  it("shows red failure banner + fires error toast + retry triggers manual push", async () => {
    let pollCount = 0;
    let retryCalled = false;
    const fetchMock = makeFetchRouter([
      {
        url: "/api/invoices/generate",
        handler: () =>
          jsonOk({
            download_url: "/download/x",
            filename: "x.xlsx",
            invoice_number: "INV-2026-04-14-002",
            invoice_id: "inv-2",
          }),
      },
      {
        url: "/api/quickbooks/status",
        handler: () => jsonOk({ connected: true, auto_push_enabled: true }),
      },
      {
        url: /\/api\/quickbooks\/invoices\/inv-2\/status/,
        handler: () => {
          pollCount += 1;
          return jsonOk({
            invoice_id: "inv-2",
            qb_invoice_id: null,
            qb_pushed_at: null,
            qb_push_error: "502: intuit boom",
          });
        },
      },
      {
        url: /\/api\/quickbooks\/invoices\/inv-2\/push/,
        handler: () => {
          retryCalled = true;
          return jsonOk({ status: "pushed", qb_invoice_id: "qb-retry" });
        },
      },
    ]);
    vi.stubGlobal("fetch", fetchMock);

    render(<InvoiceModal job={JOB} open={true} onClose={() => {}} />);
    await generateInvoice();

    await waitFor(() => {
      const banner = screen.getByTestId("qb-push-error-banner");
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveTextContent(/QuickBooks push failed/i);
      expect(banner).toHaveTextContent(/502: intuit boom/);
    });
    expect(pollCount).toBeGreaterThanOrEqual(1);
    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        "QuickBooks push failed: 502: intuit boom",
      );
    });

    fireEvent.click(screen.getByTestId("qb-retry-button"));

    await waitFor(() => {
      expect(retryCalled).toBe(true);
    });
    await waitFor(() => {
      expect(screen.getByTestId("qb-header-pushed-badge")).toHaveTextContent(
        "qb-retry",
      );
    });
    // Banner clears once the retry persists a qb_invoice_id.
    expect(screen.queryByTestId("qb-push-error-banner")).not.toBeInTheDocument();
  });

  it("exposes a manual Push button when auto-push is disabled + connected", async () => {
    let pushCalled = false;
    const fetchMock = makeFetchRouter([
      {
        url: "/api/invoices/generate",
        handler: () =>
          jsonOk({
            download_url: "/download/x",
            filename: "x.xlsx",
            invoice_number: "INV-2026-04-14-003",
            invoice_id: "inv-3",
          }),
      },
      {
        url: "/api/quickbooks/status",
        handler: () => jsonOk({ connected: true, auto_push_enabled: false }),
      },
      {
        url: /\/api\/quickbooks\/invoices\/inv-3\/status/,
        handler: () =>
          jsonOk({
            invoice_id: "inv-3",
            qb_invoice_id: null,
            qb_pushed_at: null,
            qb_push_error: null,
          }),
      },
      {
        url: /\/api\/quickbooks\/invoices\/inv-3\/push/,
        handler: () => {
          pushCalled = true;
          return jsonOk({ status: "pushed", qb_invoice_id: "qb-manual" });
        },
      },
    ]);
    vi.stubGlobal("fetch", fetchMock);

    render(<InvoiceModal job={JOB} open={true} onClose={() => {}} />);
    await generateInvoice();

    const btn = await screen.findByTestId("qb-push-button");
    fireEvent.click(btn);

    await waitFor(() => {
      expect(pushCalled).toBe(true);
    });
    await waitFor(() => {
      expect(screen.getByTestId("qb-header-pushed-badge")).toHaveTextContent(
        "qb-manual",
      );
    });
  });

  it("shows a muted 'not connected' message with link to Settings", async () => {
    const fetchMock = makeFetchRouter([
      {
        url: "/api/invoices/generate",
        handler: () =>
          jsonOk({
            download_url: "/download/x",
            filename: "x.xlsx",
            invoice_number: "INV-2026-04-14-004",
            invoice_id: "inv-4",
          }),
      },
      {
        url: "/api/quickbooks/status",
        handler: () => jsonOk({ connected: false }),
      },
      {
        url: /\/api\/quickbooks\/invoices\/inv-4\/status/,
        handler: () =>
          jsonOk({
            invoice_id: "inv-4",
            qb_invoice_id: null,
            qb_pushed_at: null,
            qb_push_error: null,
          }),
      },
    ]);
    vi.stubGlobal("fetch", fetchMock);

    render(<InvoiceModal job={JOB} open={true} onClose={() => {}} />);
    await generateInvoice();

    const msg = await screen.findByTestId("qb-not-connected");
    expect(msg.textContent).toMatch(/connect quickbooks/i);
    const link = msg.querySelector("a");
    expect(link?.getAttribute("href")).toBe("/settings/integrations");
    // No-push-attempted state: neither the success badge nor the failure
    // banner is rendered, and no toast fires.
    expect(
      screen.queryByTestId("qb-header-pushed-badge"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("qb-push-error-banner"),
    ).not.toBeInTheDocument();
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();
  });
});
