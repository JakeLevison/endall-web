import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { CommentThread } from "../CommentThread";

const COMMENTS_ENDPOINT = "/api/estimates/abc/comments";

const sampleRows = [
  {
    id: "c1",
    author_type: "contractor",
    author_identifier: "Mike",
    body: "Updated the labor totals.",
    resolved_at: null,
    created_at: "2026-04-25T10:00:00Z",
  },
  {
    id: "c2",
    author_type: "customer",
    author_identifier: null,
    body: "Looks good, thanks.",
    resolved_at: null,
    created_at: "2026-04-25T10:30:00Z",
  },
];

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});

describe("CommentThread", () => {
  it("renders comments returned by GET", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ comments: sampleRows }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CommentThread
        endpoint={COMMENTS_ENDPOINT}
        mode="read"
        pollMs={0}
      />,
    );

    await waitFor(() => {
      expect(screen.getAllByTestId("comment-row")).toHaveLength(2);
    });
    expect(screen.getByText("Updated the labor totals.")).toBeInTheDocument();
    expect(screen.getByText("Mike")).toBeInTheDocument();
    expect(screen.getByText("Customer")).toBeInTheDocument();
    expect(screen.queryByTestId("comment-thread-draft")).toBeNull();
  });

  it("hides composer in read mode", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ comments: [] })),
    );
    render(
      <CommentThread endpoint={COMMENTS_ENDPOINT} mode="read" pollMs={0} />,
    );
    await waitFor(() => {
      expect(screen.getByText("No comments yet.")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("comment-thread-draft")).toBeNull();
    expect(screen.queryByTestId("comment-thread-post")).toBeNull();
  });

  it("posts a new comment in readwrite mode and refreshes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ comments: [] }))
      .mockResolvedValueOnce(jsonResponse({ id: "new", body: "Hello" }, { status: 201 }))
      .mockResolvedValueOnce(
        jsonResponse({
          comments: [
            {
              id: "new",
              author_type: "contractor",
              author_identifier: "Mike",
              body: "Hello",
              resolved_at: null,
              created_at: "2026-04-26T00:00:00Z",
            },
          ],
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CommentThread
        endpoint={COMMENTS_ENDPOINT}
        mode="readwrite"
        pollMs={0}
      />,
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    await waitFor(() => {
      expect(screen.getByText("No comments yet.")).toBeInTheDocument();
    });

    const draft = screen.getByTestId("comment-thread-draft");
    await user.type(draft, "Hello");
    await user.click(screen.getByTestId("comment-thread-post"));

    await waitFor(() => {
      expect(screen.getByText("Hello")).toBeInTheDocument();
    });

    // 1 initial GET, 1 POST, 1 refresh GET
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const postCall = fetchMock.mock.calls[1];
    expect(postCall[1]?.method).toBe("POST");
    expect(JSON.parse(postCall[1]?.body as string)).toEqual({ body: "Hello" });
  });

  it("surfaces a 404 from the endpoint as an error label", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    render(
      <CommentThread endpoint={COMMENTS_ENDPOINT} mode="read" pollMs={0} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("comment-thread-error")).toHaveTextContent(
        "comments unavailable (404)",
      );
    });
  });

  it("never sends a tenant header , server enforces scoping", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ comments: [] }))
      .mockResolvedValueOnce(jsonResponse({ id: "x" }, { status: 201 }))
      .mockResolvedValueOnce(jsonResponse({ comments: [] }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CommentThread
        endpoint={COMMENTS_ENDPOINT}
        mode="readwrite"
        pollMs={0}
      />,
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    await waitFor(() =>
      expect(screen.getByText("No comments yet.")).toBeInTheDocument(),
    );

    await user.type(screen.getByTestId("comment-thread-draft"), "hi");
    await user.click(screen.getByTestId("comment-thread-post"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));

    const allHeaders = fetchMock.mock.calls.flatMap((call) => {
      const init = call[1] as RequestInit | undefined;
      const headers = (init?.headers || {}) as Record<string, string>;
      return Object.keys(headers).map((k) => k.toLowerCase());
    });
    expect(allHeaders).not.toContain("x-tenant-id");
    expect(allHeaders).not.toContain("authorization");
    expect(allHeaders).not.toContain("admin_key");
  });
});
