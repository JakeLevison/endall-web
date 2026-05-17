import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import ActivityFeed from "../ActivityFeed";

let activitiesResult: { data: unknown[] | null };

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        order: () => ({
          limit: () => Promise.resolve(activitiesResult),
        }),
      }),
    }),
  }),
}));

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  activitiesResult = { data: [] };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ActivityFeed voice bookings", () => {
  it("surfaces voice_jobs from /api/jobs/unified as booking items", async () => {
    activitiesResult = { data: [] };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse([
          {
            id: "vj-1",
            source: "voice_jobs",
            title: "Panel upgrade",
            status: "pending",
            scheduled_at: "2026-05-20T15:00:00Z",
            customer_id: "contact-77",
            created_at: "2026-05-17T09:00:00Z",
          },
          {
            id: "j-2",
            source: "jobs",
            title: "Should be excluded",
            status: "pending",
            scheduled_at: "2026-05-21T15:00:00Z",
            customer_id: "contact-88",
            created_at: "2026-05-17T10:00:00Z",
          },
        ]),
      ),
    );

    render(<ActivityFeed />);

    const link = await screen.findByRole("link", {
      name: /New booking: Panel upgrade on May 20/i,
    });
    expect(link).toHaveAttribute("href", "/contacts/contact-77");
    expect(screen.queryByText(/Should be excluded/)).not.toBeInTheDocument();
  });

  it("does not blank the feed when the jobs endpoint fails", async () => {
    activitiesResult = {
      data: [
        {
          id: "act-1",
          type: "call",
          subject: "Inbound call logged",
          contact_id: "contact-5",
          deal_id: null,
          created_at: "2026-05-17T08:00:00Z",
          contacts: { first_name: "Greg", last_name: "Klausa" },
        },
      ],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: "bridge down" }, 502)),
    );

    render(<ActivityFeed />);

    expect(
      await screen.findByText(/Inbound call logged/),
    ).toBeInTheDocument();
  });
});
