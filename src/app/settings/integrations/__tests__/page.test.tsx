import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

const routerReplaceMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: routerReplaceMock,
    push: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    forward: vi.fn(),
  }),
}));

import IntegrationsPage from "../page";

const BRIDGE_URL = "https://ask-endall-bridge-production.up.railway.app";
const TENANT_ID = "109d88ca-983a-4bfd-9e79-c64061fd0727";
const ADMIN_KEY = "test-key-123";

function setLocation(search: string) {
  const url = `https://endall.ai/settings/integrations${search}`;
  const u = new URL(url);
  const navHolder = { href: u.href };
  const loc = {
    get href() {
      return navHolder.href;
    },
    set href(v: string) {
      navHolder.href = v;
    },
    search: u.search,
    pathname: u.pathname,
    origin: u.origin,
    host: u.host,
    hostname: u.hostname,
    protocol: u.protocol,
    toString: () => navHolder.href,
    assign: vi.fn((v: string) => {
      navHolder.href = v;
    }),
    replace: vi.fn((v: string) => {
      navHolder.href = v;
    }),
  };
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: loc,
  });
  return navHolder;
}

function mockFetchStatus(body: unknown, ok = true) {
  (globalThis.fetch as unknown) = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(body),
  });
}

describe("IntegrationsPage", () => {
  beforeEach(() => {
    routerReplaceMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders unauthorized when no tenant resolvable", async () => {
    setLocation("");
    render(<IntegrationsPage />);
    await waitFor(() => {
      expect(
        screen.getByText(/unauthorized\. please include admin_key/i),
      ).toBeInTheDocument();
    });
  });

  it("renders not-connected state when status returns connected: false", async () => {
    setLocation(`?tenant_id=${TENANT_ID}&admin_key=${ADMIN_KEY}`);
    mockFetchStatus({ connected: false });
    render(<IntegrationsPage />);

    await waitFor(() => {
      // The QB card and the Gmail card both render "Not connected"; assert
      // at least one (QB) is present.
      expect(screen.getAllByText(/^not connected$/i).length).toBeGreaterThanOrEqual(1);
    });
    expect(
      screen.getByRole("button", { name: /connect quickbooks/i }),
    ).toBeInTheDocument();
  });

  it("renders connected state with company name when status returns connected: true", async () => {
    setLocation(`?tenant_id=${TENANT_ID}&admin_key=${ADMIN_KEY}`);
    mockFetchStatus({
      connected: true,
      company_name: "Sandbox Company US 1096",
      environment: "sandbox",
      connected_at: "2026-04-14T12:00:00+00:00",
      auto_push_enabled: true,
    });
    render(<IntegrationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Sandbox Company US 1096/)).toBeInTheDocument();
    });
    // QB Disconnect plus, when Gmail status mock matches connected:true,
    // a second Disconnect from the Gmail card. Only the QB Disconnect is
    // load-bearing for this test.
    expect(
      screen.getAllByRole("button", { name: /disconnect/i }).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("connect button constructs correct authorize URL", async () => {
    const nav = setLocation(`?tenant_id=${TENANT_ID}&admin_key=${ADMIN_KEY}`);
    mockFetchStatus({ connected: false });

    render(<IntegrationsPage />);
    const btn = await screen.findByRole("button", { name: /connect quickbooks/i });
    fireEvent.click(btn);

    expect(nav.href).toBe(
      `${BRIDGE_URL}/integrations/quickbooks/authorize?tenant_id=${encodeURIComponent(
        TENANT_ID,
      )}&admin_key=${encodeURIComponent(ADMIN_KEY)}`,
    );
  });

  it("success banner appears when connected=1 in query", async () => {
    setLocation(`?tenant_id=${TENANT_ID}&admin_key=${ADMIN_KEY}&connected=1`);
    mockFetchStatus({
      connected: true,
      company_name: "Sandbox Company US 1096",
      environment: "sandbox",
      connected_at: "2026-04-14T12:00:00+00:00",
      auto_push_enabled: true,
    });
    render(<IntegrationsPage />);
    await waitFor(() => {
      expect(screen.getByTestId("success-banner")).toBeInTheDocument();
    });
  });

  it("auto-push toggle reflects server state and strips ?connected=1 from URL", async () => {
    setLocation(`?tenant_id=${TENANT_ID}&admin_key=${ADMIN_KEY}&connected=1`);
    mockFetchStatus({
      connected: true,
      company_name: "Sandbox Company US 1096",
      environment: "sandbox",
      connected_at: "2026-04-14T12:00:00+00:00",
      auto_push_enabled: true,
    });
    render(<IntegrationsPage />);

    const toggle = await screen.findByTestId("auto-push-toggle");
    expect(toggle.getAttribute("aria-checked")).toBe("true");

    // Banner persistence fix: router.replace called with query string stripped.
    await waitFor(() => {
      expect(routerReplaceMock).toHaveBeenCalled();
    });
    const replaceArgs = routerReplaceMock.mock.calls.map((c) => String(c[0]));
    expect(replaceArgs.some((u) => !u.includes("connected=1"))).toBe(true);
  });

  it("auto-push toggle PATCHes /integrations/quickbooks/auto-push on click", async () => {
    setLocation(`?tenant_id=${TENANT_ID}&admin_key=${ADMIN_KEY}`);
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).includes("/status")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            connected: true,
            company_name: "Sandbox Company US 1096",
            environment: "sandbox",
            connected_at: "2026-04-14T12:00:00+00:00",
            auto_push_enabled: true,
          }),
        } as unknown as Response;
      }
      if (String(url).includes("/auto-push")) {
        const body = JSON.parse(String(init?.body ?? "{}"));
        return {
          ok: true,
          status: 200,
          json: async () => ({ auto_push_enabled: body.enabled }),
        } as unknown as Response;
      }
      return { ok: false, status: 404, json: async () => ({}) } as unknown as Response;
    });
    (globalThis.fetch as unknown) = fetchMock;

    render(<IntegrationsPage />);

    const toggle = await screen.findByTestId("auto-push-toggle");
    expect(toggle.getAttribute("aria-checked")).toBe("true");

    fireEvent.click(toggle);

    await waitFor(() => {
      const patchCall = fetchMock.mock.calls.find(
        (c) =>
          String(c[0]).includes("/integrations/quickbooks/auto-push") &&
          ((c[1] as RequestInit | undefined)?.method === "PATCH"),
      );
      expect(patchCall).toBeTruthy();
      const body = JSON.parse(String((patchCall?.[1] as RequestInit | undefined)?.body));
      expect(body).toEqual({ enabled: false });
    });

    await waitFor(() => {
      expect(toggle.getAttribute("aria-checked")).toBe("false");
    });
  });

  it("error banner appears when error in query", async () => {
    setLocation(
      `?tenant_id=${TENANT_ID}&admin_key=${ADMIN_KEY}&error=token_exchange_failed`,
    );
    mockFetchStatus({ connected: false });
    render(<IntegrationsPage />);
    await waitFor(() => {
      expect(screen.getByTestId("error-banner")).toBeInTheDocument();
    });
    expect(screen.getByTestId("error-banner")).toHaveTextContent(
      /token exchange failed/i,
    );
  });
});
