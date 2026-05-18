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

  it("renders tiles in the founder-specified grid order", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation(() =>
          Promise.resolve(jsonResponse({ connected: false })),
        ),
    );

    render(<SettingsPage />);
    await clickIntegrationsTab();

    await screen.findByTestId("settings-tile-quickbooks");

    const order = Array.from(
      document.querySelectorAll('[data-testid^="settings-tile-"]'),
    ).map((el) =>
      el.getAttribute("data-testid")!.replace("settings-tile-", ""),
    );

    expect(order).toEqual([
      "gmail",
      "google-calendar",
      "slack",
      "quickbooks",
      "zoho-mail",
      "brevo",
      "linkedin",
      "webhooks",
      "telegram",
    ]);
  });

  it("renders a QuickBooks Connect button when QB is not connected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: unknown) => {
        if (String(url).includes("/api/quickbooks/status")) {
          return Promise.resolve(jsonResponse({ connected: false }));
        }
        return Promise.resolve(jsonResponse({}));
      }),
    );

    render(<SettingsPage />);
    await clickIntegrationsTab();

    const connectBtn = await screen.findByTestId(
      "settings-quickbooks-connect",
    );
    expect(connectBtn).toBeEnabled();
    expect(connectBtn).toHaveTextContent(/connect/i);
  });

  it("QuickBooks Connect calls /api/quickbooks/authorize and navigates to auth_url", async () => {
    const fetchMock = vi.fn().mockImplementation((url: unknown) => {
      if (String(url).includes("/api/quickbooks/status")) {
        return Promise.resolve(jsonResponse({ connected: false }));
      }
      if (String(url).includes("/api/quickbooks/authorize")) {
        return Promise.resolve(
          jsonResponse({ auth_url: "https://appcenter.intuit.test/connect?x=1" }),
        );
      }
      return Promise.resolve(jsonResponse({}));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<SettingsPage />);
    await clickIntegrationsTab();

    const connectBtn = await screen.findByTestId(
      "settings-quickbooks-connect",
    );
    await userEvent.setup().click(connectBtn);

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.find((c) =>
          String(c[0]).includes("/api/quickbooks/authorize"),
        ),
      ).toBeTruthy();
    });
    await waitFor(() => {
      expect(window.location.href).toBe(
        "https://appcenter.intuit.test/connect?x=1",
      );
    });
  });

  it("shows connected state with company name, Disconnect, and auto-push toggle", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: unknown) => {
        if (String(url).includes("/api/quickbooks/status")) {
          return Promise.resolve(
            jsonResponse({
              connected: true,
              company_name: "Sandbox Company US 1096",
              environment: "sandbox",
              connected_at: "2026-04-14T12:00:00+00:00",
              auto_push_enabled: true,
            }),
          );
        }
        return Promise.resolve(jsonResponse({}));
      }),
    );

    render(<SettingsPage />);
    await clickIntegrationsTab();

    expect(
      await screen.findByText(/Sandbox Company US 1096/),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("settings-quickbooks-disconnect"),
    ).toBeInTheDocument();
    const toggle = screen.getByTestId("settings-quickbooks-autopush");
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("QuickBooks Disconnect calls /api/quickbooks/disconnect", async () => {
    const fetchMock = vi.fn().mockImplementation((url: unknown) => {
      if (String(url).includes("/api/quickbooks/status")) {
        return Promise.resolve(
          jsonResponse({
            connected: true,
            company_name: "Sandbox Company US 1096",
            environment: "sandbox",
            connected_at: "2026-04-14T12:00:00+00:00",
            auto_push_enabled: false,
          }),
        );
      }
      return Promise.resolve(jsonResponse({}));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<SettingsPage />);
    await clickIntegrationsTab();

    const disconnectBtn = await screen.findByTestId(
      "settings-quickbooks-disconnect",
    );
    await userEvent.setup().click(disconnectBtn);

    await waitFor(() => {
      const call = fetchMock.mock.calls.find((c) =>
        String(c[0]).includes("/api/quickbooks/disconnect"),
      );
      expect(call).toBeTruthy();
      expect((call?.[1] as RequestInit)?.method).toBe("POST");
    });
  });

  it("QuickBooks auto-push toggle PATCHes /api/quickbooks/auto-push", async () => {
    const fetchMock = vi.fn().mockImplementation((url: unknown) => {
      if (String(url).includes("/api/quickbooks/status")) {
        return Promise.resolve(
          jsonResponse({
            connected: true,
            company_name: "Sandbox Company US 1096",
            environment: "sandbox",
            connected_at: "2026-04-14T12:00:00+00:00",
            auto_push_enabled: false,
          }),
        );
      }
      return Promise.resolve(jsonResponse({ auto_push_enabled: true }));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<SettingsPage />);
    await clickIntegrationsTab();

    const toggle = await screen.findByTestId("settings-quickbooks-autopush");
    expect(toggle).toHaveAttribute("aria-checked", "false");
    await userEvent.setup().click(toggle);

    await waitFor(() => {
      const call = fetchMock.mock.calls.find((c) =>
        String(c[0]).includes("/api/quickbooks/auto-push"),
      );
      expect(call).toBeTruthy();
      expect((call?.[1] as RequestInit)?.method).toBe("PATCH");
      expect(String((call?.[1] as RequestInit)?.body)).toContain("true");
    });
    await waitFor(() =>
      expect(toggle).toHaveAttribute("aria-checked", "true"),
    );
  });
});
