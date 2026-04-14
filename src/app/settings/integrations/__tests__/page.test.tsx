import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

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
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders unauthorized when admin_key missing", async () => {
    setLocation(`?tenant_id=${TENANT_ID}`);
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
      expect(screen.getByText(/^not connected$/i)).toBeInTheDocument();
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
    });
    render(<IntegrationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Sandbox Company US 1096/)).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /disconnect/i }),
    ).toBeInTheDocument();
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
    });
    render(<IntegrationsPage />);
    await waitFor(() => {
      expect(screen.getByTestId("success-banner")).toBeInTheDocument();
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
