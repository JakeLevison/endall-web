import { Suspense } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import EstimateDetailPage from "../page";

// React 19's use() reads .status and .value off the promise to skip
// suspension when the value is already known. jsdom's microtask flushing
// inside Suspense boundaries is fragile in tests, so we hand React the
// resolved-tracked shape directly: no suspend, no resume race.
function trackedParams(id: string): Promise<{ id: string }> {
  const value = { id };
  const p = Promise.resolve(value) as Promise<{ id: string }> & {
    status: "fulfilled";
    value: { id: string };
  };
  p.status = "fulfilled";
  p.value = value;
  return p;
}

function renderPage(id: string) {
  return render(
    <Suspense fallback={<div data-testid="suspense-fallback" />}>
      <EstimateDetailPage params={trackedParams(id)} />
    </Suspense>,
  );
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function emptyResponse(status: number): Response {
  return new Response("", { status });
}

const fixtureEstimate = {
  id: "est-1",
  tenant_id: "tenant-1",
  estimate_number: "EST-2026-0001",
  status: "draft",
  customer_name: "Whitfield Commercial Properties",
  customer_email: "ops@whitfield.test",
  customer_phone: null,
  project_address: "100 Market St",
  project_description: "Service entrance upgrade",
  payment_terms: "net_30",
  timeline_weeks: 4,
  valid_until: null,
  grand_total: 5295,
  line_items: [
    {
      id: "li-1",
      estimate_id: "est-1",
      order_index: 0,
      category: "labor",
      name: "Journeyman labor",
      description: null,
      quantity: 8,
      unit: "hour",
      unit_price: 95,
      trade: null,
      tier: null,
      extended: 760,
    },
  ],
};

// SendEstimateButton fires its own fetch to /api/oauth/gmail/status on mount.
// The page test routes both URLs through one fetch mock so the page render
// path and the button's gating are both exercised in the same test.
function fetchMock(estimateResponse: Response, gmailConnected = false) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/api/oauth/gmail/status")) {
      return jsonResponse({ connected: gmailConnected, provider: "gmail" });
    }
    if (url.includes("/api/estimates/")) {
      return estimateResponse.clone();
    }
    return jsonResponse({ error: "unexpected fetch" }, 500);
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("EstimateDetailPage", () => {
  it("renders estimate header, line items, and Send button when API returns data", async () => {
    vi.stubGlobal("fetch", fetchMock(jsonResponse(fixtureEstimate)));

    renderPage("est-1");

    expect(
      await screen.findByText(/Estimate EST-2026-0001/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Whitfield Commercial Properties/),
    ).toBeInTheDocument();
    expect(screen.getByText(/100 Market St/)).toBeInTheDocument();
    expect(screen.getByTestId("estimate-status")).toHaveTextContent(/draft/i);
    expect(screen.getByTestId("line-items-table")).toBeInTheDocument();
    expect(screen.getByText(/Journeyman labor/)).toBeInTheDocument();
    expect(screen.getByTestId("grand-total")).toHaveTextContent("$5,295");

    // SendEstimateButton mounts; the gmail-status fetch resolves to
    // connected=false, so the button is present but disabled. We assert
    // presence here, not enabled state. Send-flow behavior is covered
    // by EmailDraftReviewModal.test.tsx.
    await waitFor(() => {
      expect(screen.getByTestId("send-estimate")).toBeInTheDocument();
    });
  });

  it("renders not-found state when API returns 404", async () => {
    vi.stubGlobal(
      "fetch",
      fetchMock(jsonResponse({ detail: "estimate not found" }, 404)),
    );

    renderPage("missing");

    expect(
      await screen.findByTestId("estimate-not-found"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("send-estimate")).not.toBeInTheDocument();
  });

  it("renders error state when API returns 500", async () => {
    vi.stubGlobal("fetch", fetchMock(emptyResponse(500)));

    renderPage("est-1");

    expect(
      await screen.findByTestId("estimate-error"),
    ).toBeInTheDocument();
  });
});
