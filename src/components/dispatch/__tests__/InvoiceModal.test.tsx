import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { InvoiceModal, type InvoiceJobSummary } from "../InvoiceModal";

const captureMock = vi.fn();
vi.mock("@/lib/posthog", () => ({
  posthog: { capture: (...args: unknown[]) => captureMock(...args) },
}));

const JOB: InvoiceJobSummary = {
  job_id: "job-123",
  caller_name: "Jane Doe",
  job_type: "AC repair",
  preferred_date: "2026-04-15",
};

describe("InvoiceModal", () => {
  beforeEach(() => {
    captureMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders job summary + amount field + cancel/generate buttons", () => {
    render(<InvoiceModal job={JOB} open={true} onClose={() => {}} />);
    expect(
      screen.getByRole("heading", { name: /generate invoice/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
    expect(screen.getByText(/AC repair/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /generate invoice/i })
    ).toBeInTheDocument();
  });

  it("disables submit until amount > 0 is entered", () => {
    render(<InvoiceModal job={JOB} open={true} onClose={() => {}} />);
    const submit = screen.getByRole("button", { name: /generate invoice/i });
    expect(submit).toBeDisabled();
    const amountInput = screen.getByLabelText(/amount/i);
    fireEvent.change(amountInput, { target: { value: "450" } });
    expect(submit).not.toBeDisabled();
  });

  it("submits POST to /api/invoices/generate, triggers download, fires posthog, closes", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        download_url: "/download/invoice_abc",
        filename: "Mercer_Invoice_INV-1111-20260414-001.xlsx",
        invoice_number: "INV-1111-20260414-001",
        invoice_id: "inv-1",
      }),
    } as Response));
    vi.stubGlobal("fetch", fetchMock);
    const onClose = vi.fn();

    render(<InvoiceModal job={JOB} open={true} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "450.50" },
    });
    fireEvent.click(screen.getByRole("button", { name: /generate invoice/i }));

    await waitFor(() => {
      const calls = fetchMock.mock.calls.map((c) => String(c[0]));
      expect(calls.some((u) => u.includes("/api/invoices/generate"))).toBe(true);
    });
    await waitFor(() => {
      expect(captureMock).toHaveBeenCalledWith(
        "invoice_generated",
        expect.objectContaining({
          job_id: "job-123",
          amount: 450.5,
          due_days: 30,
        })
      );
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("shows inline error when bridge returns non-200 and no em dash", async () => {
    const fetchMock = vi.fn(async () => ({ ok: false, status: 502 } as Response));
    vi.stubGlobal("fetch", fetchMock);

    render(<InvoiceModal job={JOB} open={true} onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: /generate invoice/i }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent || "").toMatch(/could not generate invoice/i);
    expect(alert.textContent || "").not.toContain("\u2014"); // no em dash
  });
});
