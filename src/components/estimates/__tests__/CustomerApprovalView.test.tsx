import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import {
  CustomerApprovalView,
  type PublicEstimate,
} from "../CustomerApprovalView";

vi.mock("react-signature-canvas", () => ({
  default: function MockSignaturePad(props: {
    ref?: (instance: unknown) => void;
    canvasProps?: { "data-testid"?: string; className?: string };
  }) {
    const fakeCanvas = {
      toDataURL: () => "data:image/png;base64,FAKE",
    } as unknown as HTMLCanvasElement;
    const fakePad = {
      isEmpty: () => mockSignaturePadEmpty,
      clear: () => {
        mockSignaturePadEmpty = true;
      },
      getCanvas: () => fakeCanvas,
    };
    if (props.ref) props.ref(fakePad);
    return (
      <div
        data-testid={props.canvasProps?.["data-testid"] || "signature-pad"}
        className={props.canvasProps?.className}
      />
    );
  },
}));

let mockSignaturePadEmpty = false;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function pristineEstimate(): PublicEstimate {
  return {
    estimate_id: "est-1",
    estimate_number: "EST-2026-0001",
    status: "sent",
    customer_name: "Acme Co.",
    customer_email: "ops@acme.test",
    project_address: "123 Main St",
    project_description: "Replace rooftop unit and rebalance ducts.",
    payment_terms: "net_30",
    timeline_weeks: 6,
    valid_until: "2026-05-30",
    grand_total: 12450,
    line_items: [
      {
        id: "li-1",
        order_index: 1,
        category: "labor",
        name: "Mechanical labor",
        description: null,
        quantity: 40,
        unit: "hour",
        unit_price: 150,
        extended: 6000,
      },
      {
        id: "li-2",
        order_index: 2,
        category: "materials",
        name: "Carrier 5-ton RTU",
        description: "Daikin equivalent acceptable.",
        quantity: 1,
        unit: "each",
        unit_price: 6450,
        extended: 6450,
      },
    ],
    pdf_storage_path: "acme/EST-2026-0001.pdf",
    decision: null,
  };
}

beforeEach(() => {
  mockSignaturePadEmpty = false;
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});

describe("CustomerApprovalView (pristine token)", () => {
  it("renders line items, total, and approve / reject controls", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ comments: [] })),
    );

    render(
      <CustomerApprovalView
        token={"a".repeat(40)}
        initial={pristineEstimate()}
        tenantLabel="Acme Mechanical"
      />,
    );

    expect(screen.getByText("Estimate EST-2026-0001")).toBeInTheDocument();
    expect(screen.getByTestId("grand-total")).toHaveTextContent("$12,450");
    expect(screen.getByText("For Acme Co.")).toBeInTheDocument();
    expect(screen.getByText("Mechanical labor")).toBeInTheDocument();
    expect(screen.getByText("Carrier 5-ton RTU")).toBeInTheDocument();
    expect(screen.getByTestId("approve-button")).toBeEnabled();
    expect(screen.getByTestId("reject-open")).toBeEnabled();
    expect(screen.getByTestId("signature-section")).toBeInTheDocument();
  });

  it("posts approve with the signature blob and shows success", async () => {
    const fetchMock = vi
      .fn()
      // initial comments load
      .mockResolvedValueOnce(jsonResponse({ comments: [] }))
      // /approve POST
      .mockResolvedValueOnce(
        jsonResponse({ approved: true, approved_at: "2026-04-26T11:00:00Z" }),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CustomerApprovalView
        token={"a".repeat(40)}
        initial={pristineEstimate()}
        tenantLabel="Acme Mechanical"
      />,
    );
    // Wait for the dynamically-imported signature canvas to mount.
    await waitFor(() => {
      expect(screen.getByTestId("signature-pad")).toBeInTheDocument();
    });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByTestId("approve-button"));

    await waitFor(() => {
      expect(screen.getByTestId("decision-banner")).toHaveTextContent(
        "Estimate approved.",
      );
    });
    // Customer already scheduled during the call; the banner must not
    // promise the contractor "will start scheduling".
    expect(screen.getByTestId("decision-banner")).toHaveTextContent(
      "will confirm your appointment",
    );
    expect(screen.getByTestId("decision-banner")).not.toHaveTextContent(
      "will start scheduling",
    );

    const approvalCall = fetchMock.mock.calls.find(([url]) =>
      String(url).endsWith("/approve"),
    );
    expect(approvalCall).toBeTruthy();
    const sentBody = JSON.parse(approvalCall![1].body as string);
    expect(sentBody.signature_blob).toBe("data:image/png;base64,FAKE");
  });

  it("blocks approve when the signature pad is empty", async () => {
    mockSignaturePadEmpty = true;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ comments: [] })),
    );

    render(
      <CustomerApprovalView
        token={"a".repeat(40)}
        initial={pristineEstimate()}
        tenantLabel="Acme Mechanical"
      />,
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByTestId("approve-button"));

    await waitFor(() => {
      expect(screen.getByTestId("approval-error")).toHaveTextContent(
        "Please draw your signature",
      );
    });
    // Only the comments fetch happened , no /approve call.
    const approvalCalls = (
      (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls as [string][]
    ).filter(([url]) => String(url).endsWith("/approve"));
    expect(approvalCalls).toHaveLength(0);
  });
});

describe("CustomerApprovalView (lost-race / already-decided)", () => {
  it("404 from /approve triggers refetch and renders the decided state", async () => {
    const fetchMock = vi
      .fn()
      // initial comments load
      .mockResolvedValueOnce(jsonResponse({ comments: [] }))
      // /approve POST returns 404 (token consumed elsewhere)
      .mockResolvedValueOnce(jsonResponse({ error: "not found" }, 404))
      // refetch GET , backend now reports approved
      .mockResolvedValueOnce(
        jsonResponse({
          ...pristineEstimate(),
          decision: { kind: "approved", at: "2026-04-26T11:00:00Z" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CustomerApprovalView
        token={"a".repeat(40)}
        initial={pristineEstimate()}
        tenantLabel="Acme Mechanical"
      />,
    );
    await waitFor(() => {
      expect(screen.getByTestId("signature-pad")).toBeInTheDocument();
    });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByTestId("approve-button"));

    await waitFor(() => {
      expect(screen.getByTestId("decision-banner")).toHaveTextContent(
        "Estimate approved.",
      );
    });
    // Approve form is gone.
    expect(screen.queryByTestId("approve-button")).toBeNull();
    expect(screen.queryByTestId("signature-section")).toBeNull();
  });

  it("renders the rejected banner when initial decision is rejected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ comments: [] })),
    );
    render(
      <CustomerApprovalView
        token={"a".repeat(40)}
        initial={{
          ...pristineEstimate(),
          decision: {
            kind: "rejected",
            at: "2026-04-26T12:00:00Z",
            reason: "Pricing too high",
          },
        }}
        tenantLabel="Acme Mechanical"
      />,
    );

    expect(screen.getByTestId("decision-banner")).toHaveTextContent(
      "Estimate rejected.",
    );
    expect(screen.getByTestId("decision-banner")).toHaveTextContent(
      "Pricing too high",
    );
    expect(screen.queryByTestId("approve-button")).toBeNull();
    expect(screen.queryByTestId("signature-section")).toBeNull();
  });
});

describe("CustomerApprovalView (reject confirm modal)", () => {
  it("opens the modal, posts /reject, and shows the rejected banner", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ comments: [] }))
      .mockResolvedValueOnce(
        jsonResponse({ rejected: true, rejected_at: "2026-04-26T12:00:00Z" }),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CustomerApprovalView
        token={"a".repeat(40)}
        initial={pristineEstimate()}
        tenantLabel="Acme Mechanical"
      />,
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByTestId("reject-open"));
    expect(screen.getByTestId("reject-modal")).toBeInTheDocument();
    await user.type(
      screen.getByTestId("reject-reason"),
      "Need a smaller scope",
    );
    await user.click(screen.getByTestId("reject-confirm"));

    await waitFor(() => {
      expect(screen.getByTestId("decision-banner")).toHaveTextContent(
        "Estimate rejected.",
      );
    });

    const rejectCall = fetchMock.mock.calls.find(([url]) =>
      String(url).endsWith("/reject"),
    );
    expect(rejectCall).toBeTruthy();
    expect(JSON.parse(rejectCall![1].body as string)).toEqual({
      reason: "Need a smaller scope",
    });
  });
});
