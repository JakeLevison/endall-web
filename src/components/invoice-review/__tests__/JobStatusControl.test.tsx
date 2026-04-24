import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { JobStatusControl, STATUS_OPTIONS } from "../JobStatusControl";

const captureMock = vi.fn();
vi.mock("@/lib/posthog", () => ({
  posthog: { capture: (...args: unknown[]) => captureMock(...args) },
}));

describe("JobStatusControl", () => {
  beforeEach(() => {
    captureMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders all four status options", () => {
    render(
      <JobStatusControl jobId="j-1" status="pending" onStatusChange={() => {}} />
    );
    const select = screen.getByRole("combobox");
    const options = Array.from(select.querySelectorAll("option")).map(
      (o) => o.value
    );
    expect(options).toEqual(STATUS_OPTIONS);
  });

  it("fires PATCH on change, fires posthog, keeps optimistic state on success", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true } as Response));
    vi.stubGlobal("fetch", fetchMock);
    const onChange = vi.fn();

    render(
      <JobStatusControl
        jobId="j-1"
        status="pending"
        onStatusChange={onChange}
      />
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "completed" },
    });

    // Optimistic update applied immediately
    expect(onChange).toHaveBeenCalledWith("completed");

    await waitFor(() => {
      const calls = fetchMock.mock.calls.map((c) => String(c[0]));
      expect(calls.some((u) => u.includes("/api/jobs/j-1/status"))).toBe(true);
    });
    await waitFor(() => {
      expect(captureMock).toHaveBeenCalledWith(
        "job_status_changed",
        expect.objectContaining({
          job_id: "j-1",
          old_status: "pending",
          new_status: "completed",
        })
      );
    });
  });

  it("reverts on error and shows a toast-like inline message", async () => {
    const fetchMock = vi.fn(async () => ({ ok: false, status: 500 } as Response));
    vi.stubGlobal("fetch", fetchMock);
    const onChange = vi.fn();

    render(
      <JobStatusControl
        jobId="j-1"
        status="pending"
        onStatusChange={onChange}
      />
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "completed" },
    });

    // Optimistic first, then revert
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith("completed");
      expect(onChange).toHaveBeenCalledWith("pending");
    });
    const alert = await screen.findByRole("alert");
    expect(alert.textContent || "").toMatch(/could not update status/i);
  });
});
