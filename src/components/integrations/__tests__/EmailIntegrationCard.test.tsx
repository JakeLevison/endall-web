import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import {
  EmailIntegrationCard,
  OutlookComingSoonCard,
} from "../EmailIntegrationCard";

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const ORIGINAL_LOCATION = window.location;

function setSearch(search: string) {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      ...ORIGINAL_LOCATION,
      assign: vi.fn(),
      replace: vi.fn(),
      href: `https://endall.ai/settings/integrations${search}`,
      pathname: "/settings/integrations",
      search,
      origin: "https://endall.ai",
      host: "endall.ai",
      hostname: "endall.ai",
      protocol: "https:",
    },
    writable: true,
  });
}

beforeEach(() => {
  toastSuccess.mockClear();
  toastError.mockClear();
  setSearch("");
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: ORIGINAL_LOCATION,
    writable: true,
  });
});

describe("EmailIntegrationCard", () => {
  it("renders 'Not connected' state with a Connect Gmail button", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ connected: false, provider: "gmail" }),
      ),
    );

    render(<EmailIntegrationCard />);

    await waitFor(() => {
      expect(screen.getByTestId("gmail-status-line")).toHaveTextContent(
        "Not connected",
      );
    });
    expect(screen.getByTestId("gmail-connect")).toBeInTheDocument();
    expect(screen.queryByTestId("gmail-disconnect")).toBeNull();
    expect(screen.queryByTestId("gmail-reconnect")).toBeNull();
  });

  it("renders 'Connected' state with the user's email and a Disconnect button", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          connected: true,
          provider: "gmail",
          account_email: "ops@acme.test",
          connected_at: "2026-04-25T10:00:00Z",
          scope: "openid email gmail.send",
          status: "connected",
          last_refresh_error: null,
        }),
      ),
    );

    render(<EmailIntegrationCard />);

    await waitFor(() => {
      expect(screen.getByTestId("gmail-status-line")).toHaveTextContent(
        "Connected as",
      );
    });
    expect(screen.getByText("ops@acme.test")).toBeInTheDocument();
    expect(screen.getByTestId("gmail-disconnect")).toBeInTheDocument();
    expect(screen.queryByTestId("gmail-connect")).toBeNull();
  });

  it("renders 'Reauth required' state with a Reconnect button", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          connected: true,
          provider: "gmail",
          account_email: "ops@acme.test",
          connected_at: "2026-04-25T10:00:00Z",
          scope: "",
          status: "reauth_required",
          last_refresh_error: "invalid_grant",
        }),
      ),
    );

    render(<EmailIntegrationCard />);

    await waitFor(() => {
      expect(screen.getByTestId("gmail-status-line")).toHaveTextContent(
        "Your Gmail authorization expired",
      );
    });
    expect(screen.getByTestId("gmail-reconnect")).toBeInTheDocument();
    expect(screen.queryByTestId("gmail-disconnect")).toBeNull();
  });

  it("shows a success toast when ?connected=1&provider=gmail is present", async () => {
    setSearch("?connected=1&provider=gmail");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ connected: true, provider: "gmail", account_email: "x@y.z", connected_at: "2026-04-25T00:00:00Z", scope: "", status: "connected", last_refresh_error: null }),
      ),
    );

    render(<EmailIntegrationCard />);

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith(
        "Gmail connected successfully.",
      );
    });
  });

  it("shows an error toast distinguishing user_denied from generic errors", async () => {
    setSearch("?error=user_denied&provider=gmail");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ connected: false, provider: "gmail" })),
    );

    render(<EmailIntegrationCard />);

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        "You declined access. Try again to connect Gmail.",
      );
    });
  });

  it("disconnect button posts to /api/oauth/gmail/disconnect and refetches", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          connected: true,
          provider: "gmail",
          account_email: "ops@acme.test",
          connected_at: "2026-04-25T10:00:00Z",
          scope: "",
          status: "connected",
          last_refresh_error: null,
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ disconnected: true }))
      .mockResolvedValueOnce(jsonResponse({ connected: false, provider: "gmail" }));
    vi.stubGlobal("fetch", fetchMock);

    render(<EmailIntegrationCard />);

    await waitFor(() =>
      expect(screen.getByTestId("gmail-disconnect")).toBeInTheDocument(),
    );

    const user = userEvent.setup();
    await user.click(screen.getByTestId("gmail-disconnect"));

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith("Gmail disconnected.");
    });
    const calls = fetchMock.mock.calls.map((c) => c[0]);
    expect(calls).toContain("/api/oauth/gmail/disconnect");
  });
});

describe("OutlookComingSoonCard", () => {
  it("renders the disabled coming-soon state without a connect button", () => {
    render(<OutlookComingSoonCard />);
    const card = screen.getByTestId("outlook-coming-soon");
    expect(card).toHaveAttribute("aria-disabled", "true");
    expect(card.querySelectorAll("button")).toHaveLength(0);
    expect(card).toHaveTextContent("Coming soon");
  });
});
