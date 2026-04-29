import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

import { GET } from "../route";

const ADMIN_KEY = "test-admin-secret";
const TENANT_ID = "11111111-1111-4111-9111-111111111111";

function makeRequest(search: string) {
  return new NextRequest(
    new URL(`/oauth/handshake${search}`, "https://endall.ai"),
  );
}

describe("/oauth/handshake (R2-8d session_id consumer)", () => {
  beforeEach(() => {
    vi.stubEnv(
      "ASK_ENDALL_BRIDGE_URL",
      "https://bridge.test.example",
    );
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("session_id with successful consume sets cookie and redirects to /settings/integrations", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ admin_key: ADMIN_KEY, tenant_id: TENANT_ID }),
    });
    (globalThis.fetch as unknown) = fetchMock;

    const res = await GET(
      makeRequest("?session_id=opaque-session-token-123&connected=1&provider=gmail"),
    );

    expect(res.status).toBe(302);
    const location = res.headers.get("location") || "";
    expect(location).toContain("/settings/integrations");
    expect(location).toContain("connected=1");
    expect(location).toContain("provider=gmail");
    expect(location).not.toContain("admin_key");
    expect(location).not.toContain("session_id");

    // Cookie set with admin_key + tenant_id JSON.
    const cookie = res.cookies.get("endall_session");
    expect(cookie).toBeDefined();
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("lax");
    expect(cookie?.path).toBe("/");
    expect(cookie?.maxAge).toBe(600);
    const parsed = JSON.parse(cookie!.value);
    expect(parsed.admin_key).toBe(ADMIN_KEY);
    expect(parsed.tenant_id).toBe(TENANT_ID);

    // Bridge call shape: POST to /public/oauth/consume-session with
    // {session_id} body.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [bridgeUrl, init] = fetchMock.mock.calls[0];
    expect(bridgeUrl).toBe(
      "https://bridge.test.example/public/oauth/consume-session",
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ session_id: "opaque-session-token-123" });
  });

  it("session_id with 404 from bridge redirects with error=session_invalid (no cookie)", async () => {
    (globalThis.fetch as unknown) = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ detail: "not found" }),
    });

    const res = await GET(makeRequest("?session_id=already-consumed"));

    expect(res.status).toBe(302);
    const location = res.headers.get("location") || "";
    expect(location).toContain("/settings/integrations");
    expect(location).toContain("error=session_invalid");
    expect(res.cookies.get("endall_session")).toBeUndefined();
  });

  it("session_id with bridge network error redirects with error=session_invalid (no cookie)", async () => {
    (globalThis.fetch as unknown) = vi.fn().mockRejectedValue(
      new Error("network down"),
    );

    const res = await GET(makeRequest("?session_id=will-fail"));

    expect(res.status).toBe(302);
    const location = res.headers.get("location") || "";
    expect(location).toContain("error=session_invalid");
    expect(res.cookies.get("endall_session")).toBeUndefined();
  });

  it("session_id with consume timeout redirects with error=handshake_timeout (no cookie)", async () => {
    // Simulate AbortSignal.timeout firing: fetch rejects with a
    // DOMException named TimeoutError. Real timeout is 5s; we shortcut
    // it for the test.
    const fetchMock = vi.fn().mockImplementation(() => {
      const e = new DOMException("timed out", "TimeoutError");
      return Promise.reject(e);
    });
    (globalThis.fetch as unknown) = fetchMock;

    const res = await GET(makeRequest("?session_id=will-time-out"));

    expect(res.status).toBe(302);
    const location = res.headers.get("location") || "";
    expect(location).toContain("/settings/integrations");
    expect(location).toContain("error=handshake_timeout");
    expect(res.cookies.get("endall_session")).toBeUndefined();

    // Pin the AbortSignal wiring: a regression that drops
    // `signal: AbortSignal.timeout(...)` would let a hung bridge stall
    // the route indefinitely without tripping the timeout branch.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0][1];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("session_id with bridge body missing admin_key redirects with error=session_invalid (no cookie)", async () => {
    (globalThis.fetch as unknown) = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const res = await GET(makeRequest("?session_id=malformed-resp"));

    expect(res.status).toBe(302);
    const location = res.headers.get("location") || "";
    expect(location).toContain("error=session_invalid");
    expect(res.cookies.get("endall_session")).toBeUndefined();
  });

  it("legacy admin_key + tenant_id shape sets cookie and redirects (deploy-window backwards compat)", async () => {
    const res = await GET(
      makeRequest(
        `?admin_key=${ADMIN_KEY}&tenant_id=${TENANT_ID}&connected=1&provider=quickbooks`,
      ),
    );

    expect(res.status).toBe(302);
    const location = res.headers.get("location") || "";
    expect(location).toContain("/settings/integrations");
    expect(location).toContain("connected=1");
    expect(location).toContain("provider=quickbooks");
    expect(location).not.toContain("admin_key");
    expect(location).not.toContain("tenant_id");

    const cookie = res.cookies.get("endall_session");
    expect(cookie).toBeDefined();
    const parsed = JSON.parse(cookie!.value);
    expect(parsed.admin_key).toBe(ADMIN_KEY);
    expect(parsed.tenant_id).toBe(TENANT_ID);
  });

  it("error-only (pre-state-validation failure) forwards error, sets no cookie", async () => {
    const res = await GET(
      makeRequest("?error=user_denied&provider=gmail"),
    );

    expect(res.status).toBe(302);
    const location = res.headers.get("location") || "";
    expect(location).toContain("/settings/integrations");
    expect(location).toContain("error=user_denied");
    expect(location).toContain("provider=gmail");
    expect(res.cookies.get("endall_session")).toBeUndefined();
  });

  it("no params at all redirects to /settings/integrations with nothing", async () => {
    const res = await GET(makeRequest(""));

    expect(res.status).toBe(302);
    const location = res.headers.get("location") || "";
    expect(location).toContain("/settings/integrations");
    expect(res.cookies.get("endall_session")).toBeUndefined();
  });

  it("session cookie is host-only and Secure in production (no Domain attr)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    (globalThis.fetch as unknown) = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ admin_key: ADMIN_KEY, tenant_id: TENANT_ID }),
    });

    const res = await GET(makeRequest("?session_id=valid-sid"));

    const cookie = res.cookies.get("endall_session");
    expect(cookie).toBeDefined();
    // Secure attribute keeps the cookie off plaintext HTTP. Production
    // only because vitest dev runs without NODE_ENV=production.
    expect(cookie?.secure).toBe(true);
    // Absence of Domain pins the cookie to the exact host that served the
    // response (endall.ai), preventing carry-over to subdomains. Set-Cookie
    // returns undefined for the domain field when no Domain attr is set.
    expect(cookie?.domain).toBeUndefined();
  });

  it("session_id wins over legacy admin_key when both are present", async () => {
    (globalThis.fetch as unknown) = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          admin_key: "from-bridge-consume",
          tenant_id: "from-bridge-consume-tenant",
        }),
    });

    const res = await GET(
      makeRequest(
        `?session_id=valid-sid&admin_key=${ADMIN_KEY}&tenant_id=${TENANT_ID}`,
      ),
    );

    expect(res.status).toBe(302);
    const cookie = res.cookies.get("endall_session");
    expect(cookie).toBeDefined();
    const parsed = JSON.parse(cookie!.value);
    // session_id consume result, not the URL admin_key.
    expect(parsed.admin_key).toBe("from-bridge-consume");
    expect(parsed.tenant_id).toBe("from-bridge-consume-tenant");
  });
});
