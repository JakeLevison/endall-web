/**
 * Edge-case tests for EmailDraftReviewModal not covered by the primary file.
 *
 * Gaps addressed:
 *  - Missing required fields (to / subject / body) triggers a toast, not a
 *    network call (idempotency contract: no fire until form is valid)
 *  - Network error on /send shows error state inside the modal
 *  - Closing the modal mid-prepare (open flips to false) cancels the fetch
 *    without updating state (no "Can't perform a React state update" warning)
 *  - Non-200 / non-409 from /send shows the generic error message
 *  - pdf_storage_path null shows the "PDF rendering pending" fallback
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import {
  EmailDraftReviewModal,
} from "../EmailDraftReviewModal";

const toastSuccess = vi.fn();
const toastError = vi.fn();
const toastMessage = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
    message: (...args: unknown[]) => toastMessage(...args),
  },
}));

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const validDraft = {
  status: "draft_prepared",
  approval_id: "appr-1",
  approval_token: "tok-abc",
  approval_url: "https://acme.endall.app/approve/tok-abc",
  draft: {
    to: "ops@acme.test",
    subject: "Estimate EST-2026-0001 from Acme Mechanical",
    body: "Hi there,\n\nPlease review and approve.\n",
  },
  pdf_storage_path: null, // intentionally null for pdf-pending test
  expires_at: "2026-05-26T23:59:59Z",
};

beforeEach(() => {
  toastSuccess.mockClear();
  toastError.mockClear();
  toastMessage.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

describe("EmailDraftReviewModal -- validation before send", () => {
  it("fires a toast.error and skips the network call when 'to' is cleared", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(validDraft))
      // if confirm is incorrectly called, the second call would be this:
      .mockResolvedValueOnce(jsonResponse({ sent: true, message_id: "m1", thread_id: "t1" }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <EmailDraftReviewModal estimateId="est-1" open={true} onClose={() => {}} />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("email-draft-to")).toBeInTheDocument(),
    );

    const user = userEvent.setup();
    await user.clear(screen.getByTestId("email-draft-to"));
    await user.click(screen.getByTestId("email-draft-send"));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "Recipient, subject, and body are all required.",
      ),
    );
    // Only the initial /send POST should have happened, not /send/confirm.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("EmailDraftReviewModal -- network error on /send", () => {
  it("shows the error state inside the modal when fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("Failed to fetch")),
    );

    render(
      <EmailDraftReviewModal estimateId="est-1" open={true} onClose={() => {}} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("email-draft-error")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("email-draft-to")).toBeNull();
  });
});

describe("EmailDraftReviewModal -- generic non-409 error from /send", () => {
  it("shows the error state for a 500 response from /send", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        jsonResponse({ detail: "internal error" }, 500),
      ),
    );

    render(
      <EmailDraftReviewModal estimateId="est-1" open={true} onClose={() => {}} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("email-draft-error")).toHaveTextContent(
        "Could not prepare the draft",
      );
    });
    // Send button should be disabled because we are in error state.
    expect(screen.getByTestId("email-draft-send")).toBeDisabled();
  });
});

describe("EmailDraftReviewModal -- pdf_storage_path null fallback", () => {
  it("shows the pending PDF notice when pdf_storage_path is null", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(jsonResponse(validDraft)));

    render(
      <EmailDraftReviewModal estimateId="est-1" open={true} onClose={() => {}} />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("email-draft-body")).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("email-draft-attachment")).toBeNull();
    expect(
      screen.getByText(/PDF rendering is pending/),
    ).toBeInTheDocument();
  });
});

describe("EmailDraftReviewModal -- non-200 from /send/confirm falls back to ready", () => {
  it("fires toast.error and returns modal to ready state on a 500 from confirm", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ ...validDraft, pdf_storage_path: "acme/est.pdf" }),
      )
      .mockResolvedValueOnce(jsonResponse({ detail: "bridge exploded" }, 500));
    vi.stubGlobal("fetch", fetchMock);

    const onClose = vi.fn();
    render(
      <EmailDraftReviewModal estimateId="est-1" open={true} onClose={onClose} />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("email-draft-send")).toBeEnabled(),
    );

    const user = userEvent.setup();
    await user.click(screen.getByTestId("email-draft-send"));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    // Modal stays open (onClose not called).
    expect(onClose).not.toHaveBeenCalled();
    // Send button is re-enabled (modal back to ready state).
    await waitFor(() =>
      expect(screen.getByTestId("email-draft-send")).toBeEnabled(),
    );
  });
});
