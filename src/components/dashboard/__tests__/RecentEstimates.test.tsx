import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import RecentEstimates from "../RecentEstimates";

// Chainable Supabase stub: from().select().order().limit() resolves to {data}.
let estimatesResult: { data: unknown[] | null };

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        order: () => ({
          limit: () => Promise.resolve(estimatesResult),
        }),
      }),
    }),
  }),
}));

beforeEach(() => {
  estimatesResult = { data: [] };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("RecentEstimates", () => {
  it("renders estimate rows linking to the detail page", async () => {
    estimatesResult = {
      data: [
        {
          id: "est-9",
          estimate_number: "EST-2026-0009",
          customer_name: "Whitfield Commercial Properties",
          project_description: "Service entrance upgrade",
          grand_total: 5295,
          status: "draft",
          created_at: "2026-05-16T12:00:00Z",
        },
      ],
    };

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
    estimatesResult = { data: [] };
    render(<RecentEstimates />);
    expect(
      await screen.findByText(/No estimates yet/i),
    ).toBeInTheDocument();
  });

  it("falls back to empty state if the query returns null data", async () => {
    estimatesResult = { data: null };
    render(<RecentEstimates />);
    await waitFor(() =>
      expect(screen.getByText(/No estimates yet/i)).toBeInTheDocument(),
    );
  });
});
