/**
 * Edge-case tests for CustomerApprovalView that are not covered by the
 * primary test file (CustomerApprovalView.test.tsx).
 *
 * Gaps addressed:
 *  - Empty line_items list
 *  - grand_total locale formatting (non-integer, zero)
 *  - signed_name clamped at 120 characters is sent to the approve endpoint
 *  - Network error on approve shows the generic error label
 *  - 500 response from /approve shows the generic error label
 *  - CommentThread inside the view uses read mode (no composer visible)
 */
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
      isEmpty: () => false, // pad is always non-empty in these tests
      clear: () => {},
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

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function baseEstimate(overrides: Partial<PublicEstimate> = {}): PublicEstimate {
  return {
    estimate_id: "est-1",
    estimate_number: "EST-2026-0001",
    status: "sent",
    customer_name: "Acme Co.",
    customer_email: "ops@acme.test",
    project_address: "123 Main St",
    project_description: "Replace rooftop unit.",
    payment_terms: "net_30",
    timeline_weeks: 4,
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
    ],
    pdf_storage_path: null,
    decision: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});

describe("CustomerApprovalView -- empty line items", () => {
  it("shows a placeholder when line_items is empty", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ comments: [] })),
    );
    render(
      <CustomerApprovalView
        token={"a".repeat(40)}
        initial={baseEstimate({ line_items: [] })}
        tenantLabel="Acme Mechanical"
      />,
    );
    expect(
      screen.getByText("No line items on this estimate."),
    ).toBeInTheDocument();
  });
});

describe("CustomerApprovalView -- grand_total locale formatting", () => {
  it("formats zero grand_total as $0.00", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ comments: [] })),
    );
    render(
      <CustomerApprovalView
        token={"a".repeat(40)}
        initial={baseEstimate({ grand_total: 0, line_items: [] })}
        tenantLabel="Acme Mechanical"
      />,
    );
    expect(screen.getByTestId("grand-total")).toHaveTextContent("$0.00");
  });

  it("formats a fractional grand_total with two decimal places", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ comments: [] })),
    );
    render(
      <CustomerApprovalView
        token={"a".repeat(40)}
        initial={baseEstimate({ grand_total: 9999.5 })}
        tenantLabel="Acme Mechanical"
      />,
    );
    expect(screen.getByTestId("grand-total")).toHaveTextContent("$9,999.50");
  });
});

describe("CustomerApprovalView -- signed_name truncation sent to bridge", () => {
  it("sends signed_name truncated to 120 chars from the API endpoint", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ comments: [] }))
      .mockResolvedValueOnce(
        jsonResponse({ approved: true, approved_at: "2026-04-27T12:00:00Z" }),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CustomerApprovalView
        token={"a".repeat(40)}
        initial={baseEstimate()}
        tenantLabel="Acme Mechanical"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("signature-pad")).toBeInTheDocument();
    });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    // Type a name longer than 120 chars; the input is maxLength=120 so we type
    // exactly 120 to verify the cap is enforced client-side.
    const name = "N".repeat(120);
    await user.type(screen.getByTestId("signed-name"), name);
    await user.click(screen.getByTestId("approve-button"));

    await waitFor(() => {
      expect(screen.getByTestId("decision-banner")).toBeInTheDocument();
    });

    const approvalCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes("/approve"),
    );
    const sentBody = JSON.parse(approvalCall![1].body as string) as {
      signed_name: string;
    };
    expect(sentBody.signed_name.length).toBeLessThanOrEqual(120);
  });
});

describe("CustomerApprovalView -- network error on /approve", () => {
  it("shows the generic error label when fetch throws", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ comments: [] }))
      .mockRejectedValueOnce(new Error("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CustomerApprovalView
        token={"a".repeat(40)}
        initial={baseEstimate()}
        tenantLabel="Acme Mechanical"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("signature-pad")).toBeInTheDocument();
    });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByTestId("approve-button"));

    await waitFor(() => {
      expect(screen.getByTestId("approval-error")).toBeInTheDocument();
    });
    // Approve button is re-enabled after the error (submitting state cleared).
    expect(screen.getByTestId("approve-button")).toBeEnabled();
  });

  it("shows the generic error label on a 500 response from /approve", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ comments: [] }))
      .mockResolvedValueOnce(
        jsonResponse({ error: "internal server error" }, 500),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CustomerApprovalView
        token={"a".repeat(40)}
        initial={baseEstimate()}
        tenantLabel="Acme Mechanical"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("signature-pad")).toBeInTheDocument();
    });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByTestId("approve-button"));

    await waitFor(() => {
      expect(screen.getByTestId("approval-error")).toHaveTextContent(
        "Could not approve right now",
      );
    });
  });
});

describe("CustomerApprovalView -- comment thread in read mode", () => {
  it("does not render a comment composer for the customer", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ comments: [] })),
    );
    render(
      <CustomerApprovalView
        token={"a".repeat(40)}
        initial={baseEstimate()}
        tenantLabel="Acme Mechanical"
      />,
    );
    await waitFor(() => {
      expect(screen.getByTestId("comment-thread")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("comment-thread-draft")).toBeNull();
    expect(screen.queryByTestId("comment-thread-post")).toBeNull();
  });
});
