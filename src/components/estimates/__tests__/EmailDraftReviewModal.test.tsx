import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import {
  EmailDraftReviewModal,
  SendEstimateButton,
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
  approval_url: "https://acme.endall.app/approve/tok-abc",
  draft: {
    to: "ops@acme.test",
    subject: "Estimate EST-2026-0001 from Acme Mechanical",
    body: "Hi there,\n\nPlease review and approve...\n",
  },
  pdf_storage_path: "acme/EST-2026-0001.pdf",
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

describe("EmailDraftReviewModal", () => {
  it("hides modal when closed", () => {
    render(
      <EmailDraftReviewModal
        estimateId="est-1"
        open={false}
        onClose={() => {}}
      />,
    );
    expect(screen.queryByTestId("email-draft-modal")).toBeNull();
  });

  it("prepares draft via /send and shows the editable form", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse(validDraft));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <EmailDraftReviewModal
        estimateId="est-1"
        open={true}
        onClose={() => {}}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("email-draft-to")).toHaveValue(
        "ops@acme.test",
      );
    });
    expect(screen.getByTestId("email-draft-subject")).toHaveValue(
      validDraft.draft.subject,
    );
    expect(screen.getByTestId("email-draft-body")).toHaveValue(
      validDraft.draft.body,
    );
    expect(screen.getByTestId("email-draft-attachment")).toHaveTextContent(
      "EST-2026-0001.pdf",
    );

    const prepareCall = fetchMock.mock.calls[0];
    expect(prepareCall[0]).toBe("/api/estimates/est-1/send");
    expect(prepareCall[1]?.method).toBe("POST");
  });

  it("send button posts /send/confirm with edited fields and closes on success", async () => {
    const onClose = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(validDraft))
      .mockResolvedValueOnce(
        jsonResponse({ sent: true, message_id: "msg1", thread_id: "thr1" }),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <EmailDraftReviewModal
        estimateId="est-1"
        open={true}
        onClose={onClose}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("email-draft-send")).toBeEnabled();
    });

    const user = userEvent.setup();
    const subject = screen.getByTestId("email-draft-subject");
    await user.clear(subject);
    await user.type(subject, "Edited subject");

    await user.click(screen.getByTestId("email-draft-send"));

    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith(
        "Estimate sent. Customer will receive it shortly.",
      ),
    );
    expect(onClose).toHaveBeenCalledWith(true);

    const confirmCall = fetchMock.mock.calls[1];
    expect(confirmCall[0]).toBe("/api/estimates/est-1/send/confirm");
    expect(JSON.parse(confirmCall[1]?.body as string)).toMatchObject({
      approval_id: "appr-1",
      to: "ops@acme.test",
      subject: "Edited subject",
    });
  });

  it("409 from /send/confirm shows the already-sent toast and closes", async () => {
    const onClose = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(validDraft))
      .mockResolvedValueOnce(jsonResponse({ detail: "already sent" }, 409));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <EmailDraftReviewModal
        estimateId="est-1"
        open={true}
        onClose={onClose}
      />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("email-draft-send")).toBeEnabled(),
    );

    const user = userEvent.setup();
    await user.click(screen.getByTestId("email-draft-send"));

    await waitFor(() =>
      expect(toastMessage).toHaveBeenCalledWith(
        "This estimate was already sent.",
      ),
    );
    expect(onClose).toHaveBeenCalledWith(true);
  });

  it("409 from /send shows the connect-Gmail error inside the modal", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse(
        { detail: "Connect Gmail in Settings before sending." },
        409,
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <EmailDraftReviewModal
        estimateId="est-1"
        open={true}
        onClose={() => {}}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("email-draft-error")).toHaveTextContent(
        "Connect Gmail",
      );
    });
    expect(screen.queryByTestId("email-draft-to")).toBeNull();
    expect(screen.getByTestId("email-draft-send")).toBeDisabled();
  });

  it("401 from /send/confirm hints the user to reconnect Gmail", async () => {
    const onClose = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(validDraft))
      .mockResolvedValueOnce(jsonResponse({ detail: "reauth required" }, 401));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <EmailDraftReviewModal
        estimateId="est-1"
        open={true}
        onClose={onClose}
      />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("email-draft-send")).toBeEnabled(),
    );
    const user = userEvent.setup();
    await user.click(screen.getByTestId("email-draft-send"));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "Gmail authorization expired. Reconnect Gmail in Settings.",
      ),
    );
    expect(onClose).toHaveBeenCalledWith(false);
  });
});

describe("SendEstimateButton (Gmail gating)", () => {
  it("disables the button when Gmail is not connected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ connected: false, provider: "gmail" }),
      ),
    );

    render(<SendEstimateButton estimateId="est-1" />);

    await waitFor(() => {
      expect(screen.getByTestId("send-estimate")).toBeDisabled();
    });
    expect(screen.getByTestId("send-estimate")).toHaveAttribute(
      "title",
      "Connect Gmail in Settings to send estimates.",
    );
  });

  it("enables the button when Gmail is connected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          connected: true,
          status: "connected",
          provider: "gmail",
          account_email: "x@y.z",
        }),
      ),
    );

    render(<SendEstimateButton estimateId="est-1" />);

    await waitFor(() => {
      expect(screen.getByTestId("send-estimate")).toBeEnabled();
    });
  });

  it("disables the button when Gmail is in reauth_required state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          connected: true,
          status: "reauth_required",
          provider: "gmail",
          account_email: "x@y.z",
        }),
      ),
    );

    render(<SendEstimateButton estimateId="est-1" />);

    await waitFor(() => {
      expect(screen.getByTestId("send-estimate")).toBeDisabled();
    });
  });
});
