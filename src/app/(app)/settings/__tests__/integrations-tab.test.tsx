import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import SettingsPage from "../page";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => Promise.resolve({ count: 0, data: [] }),
      order: () => Promise.resolve({ count: 0, data: [] }),
    }),
  }),
}));

vi.mock("@/lib/tenant-hook", () => ({
  useTenant: () => ({ tenant_id: "test-tenant" }),
}));

const ORIGINAL_LOCATION = window.location;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function clickIntegrationsTab() {
  return userEvent
    .setup()
    .click(screen.getByRole("tab", { name: /integrations/i }));
}

beforeEach(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      ...ORIGINAL_LOCATION,
      assign: vi.fn(),
      replace: vi.fn(),
      href: "https://endall.ai/settings",
      pathname: "/settings",
      search: "",
      origin: "https://endall.ai",
    },
    writable: true,
  });
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

describe("SettingsPage Integrations tab", () => {
  it("renders a Gmail Connect button on the Integrations tab", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({}))),
    );

    render(<SettingsPage />);
    await clickIntegrationsTab();

    expect(
      await screen.findByTestId("settings-gmail-connect"),
    ).toBeInTheDocument();
  });

  it("Gmail Connect button calls /api/oauth/gmail/authorize and navigates to auth_url", async () => {
    const fetchMock = vi.fn().mockImplementation((url: unknown) => {
      if (String(url).includes("/api/oauth/gmail/authorize")) {
        return Promise.resolve(
          jsonResponse({
            auth_url: "https://accounts.google.test/oauth?state=abc",
          }),
        );
      }
      return Promise.resolve(jsonResponse({}));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<SettingsPage />);
    await clickIntegrationsTab();

    const connectBtn = await screen.findByTestId("settings-gmail-connect");
    await userEvent.setup().click(connectBtn);

    await waitFor(() => {
      const call = fetchMock.mock.calls.find((c) =>
        String(c[0]).includes("/api/oauth/gmail/authorize"),
      );
      expect(call).toBeTruthy();
    });

    await waitFor(() => {
      expect(window.location.href).toBe(
        "https://accounts.google.test/oauth?state=abc",
      );
    });
  });

  it("non-Gmail integrations render a disabled Coming soon button (no broken Connect)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({}))),
    );

    render(<SettingsPage />);
    await clickIntegrationsTab();

    // Google Calendar shares the same broken-button bug class but has no
    // backend OAuth route — surface that honestly instead of rendering a
    // dead Connect button.
    const calendarBtn = await screen.findByTestId(
      "settings-google-calendar-connect",
    );
    expect(calendarBtn).toBeDisabled();
    expect(calendarBtn).toHaveTextContent(/coming soon/i);
  });
});
