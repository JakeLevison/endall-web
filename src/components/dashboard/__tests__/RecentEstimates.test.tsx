import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import RecentEstimates from "../RecentEstimates";

// RecentEstimates now fetches GET /api/estimates (bridge proxy) instead of
// querying Supabase directly. The route returns a bare array; the component
// tolerates a non-array body by falling back to the empty state.
let fetchBody: unknown;
let fetchOk: boolean;

beforeEach(() => {
  fetchBody = [];
  fetchOk = true;
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: fetchOk,
        status: fetchOk ? 200 : 502,
        json: () => Promise.resolve(fetchBody),
      } as Response),
    ),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("RecentEstimates", () => {
  it("renders estimate rows linking to the detail page", async () => {
    fetchBody = [
      {
        id: "est-9",
        estimate_number: "EST-2026-0009",
        customer_name: "Whitfield Commercial Properties",
        project_description: "Service entrance upgrade",
        grand_total: 5295,
        status: "draft",
        created_at: "2026-05-16T12:00:00Z",
      },
    ];

    render(<RecentEstimates />);

    const link = await screen.findByRole("link", {
      name: /Whitfield Commercial Properties/,
    });
    expect(link).toHaveAttribute("href", "/estimates/est-9");
    expect(screen.getByText(/Service entrance upgrade/)).toBeInTheDocument();
    expect(screen.getByText("$5,295")).toBeInTheDocument();
    expect(screen.getByText(/draft/i)).toBeInTheDocument();
  });

  it("shows a graceful empty state when there are no estimates", async () => {
    fetchBody = [];
    render(<RecentEstimates />);
    expect(
      await screen.findByText(/No estimates yet/i),
    ).toBeInTheDocument();
  });

  it("falls back to empty state if the response body is not an array", async () => {
    fetchBody = null;
    render(<RecentEstimates />);
    await waitFor(() =>
      expect(screen.getByText(/No estimates yet/i)).toBeInTheDocument(),
    );
  });

  it("shows the empty state if the proxy responds non-OK", async () => {
    fetchOk = false;
    render(<RecentEstimates />);
    await waitFor(() =>
      expect(screen.getByText(/No estimates yet/i)).toBeInTheDocument(),
    );
  });
});
