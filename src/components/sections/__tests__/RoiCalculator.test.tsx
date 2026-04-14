import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RoiCalculator from "../RoiCalculator";

const captureMock = vi.fn();
vi.mock("@/lib/posthog", () => ({
  posthog: { capture: (...args: unknown[]) => captureMock(...args) },
}));

// jsdom lacks IntersectionObserver (used by ScrollReveal)
class IOStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error polyfill
globalThis.IntersectionObserver = IOStub;

describe("RoiCalculator — TLDR table + download", () => {
  beforeEach(() => {
    captureMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a Money TLDR table with two data rows and a total", () => {
    render(<RoiCalculator />);
    expect(screen.getByText(/money tldr/i)).toBeInTheDocument();
    const table = screen.getByTestId("roi-tldr-table");
    expect(table).toHaveTextContent(/current admin cost/i);
    expect(table).toHaveTextContent(/lost revenue from missed calls/i);
    const rows = screen.getAllByTestId("roi-tldr-row");
    expect(rows).toHaveLength(2);
    expect(screen.getByTestId("roi-tldr-total")).toBeInTheDocument();
  });

  it("table headers are sentence case and match spec", () => {
    render(<RoiCalculator />);
    expect(screen.getByText("Line item")).toBeInTheDocument();
    expect(screen.getByText("Monthly savings")).toBeInTheDocument();
    expect(screen.getByText("Annual savings")).toBeInTheDocument();
  });

  it("download button triggers fetch flow and fires posthog event", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/api/roi/generate")) {
        return {
          ok: true,
          json: async () => ({
            download_url: "/download/roi_abc",
            filename: "Endall_ROI_TLDR.xlsx",
          }),
        } as Response;
      }
      if (url.includes("/api/chat/download")) {
        return {
          ok: true,
          blob: async () => new Blob(["x"], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        } as Response;
      }
      throw new Error(`unexpected fetch ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("URL", {
      createObjectURL: () => "blob:xyz",
      revokeObjectURL: () => {},
    });

    render(<RoiCalculator />);
    const btn = screen.getByRole("button", { name: /download the numbers/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(captureMock).toHaveBeenCalledWith(
        "roi_tldr_downloaded",
        expect.objectContaining({
          staff: expect.any(Number),
          monthly_cost: expect.any(Number),
          missed_calls_per_week: expect.any(Number),
          totals_monthly: expect.any(Number),
          totals_annual: expect.any(Number),
        })
      );
    });
    await waitFor(() => {
      const calls = fetchMock.mock.calls.map((c) => String(c[0]));
      expect(calls.some((u) => u.includes("/api/roi/generate"))).toBe(true);
      expect(calls.some((u) => u.includes("/api/chat/download"))).toBe(true);
    });
  });

  it("shows an inline error when the bridge returns non-200", async () => {
    const fetchMock = vi.fn(async () => ({ ok: false, status: 500 } as Response));
    vi.stubGlobal("fetch", fetchMock);

    render(<RoiCalculator />);
    fireEvent.click(screen.getByRole("button", { name: /download the numbers/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("alert", { name: undefined })
      ).toHaveTextContent(/download failed/i);
    });
  });
});
