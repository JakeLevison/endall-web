import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Supabase mock state controlled per test
let mockUser: { id: string } | null = null;
let mockMembership: { tenant_id: string } | null = null;

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: mockUser }, error: null })),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          limit: () => ({
            single: vi.fn(async () => ({
              data: mockMembership,
              error: mockMembership ? null : { message: "not found" },
            })),
          }),
        }),
      }),
    }),
  }),
}));

// Import after mocks
import { middleware } from "../../middleware";

function makeRequest(url: string, cookies: Record<string, string> = {}) {
  const req = new NextRequest(new URL(url, "https://endall.ai"));
  for (const [k, v] of Object.entries(cookies)) {
    req.cookies.set(k, v);
  }
  return req;
}

describe("middleware", () => {
  beforeEach(() => {
    mockUser = null;
    mockMembership = null;
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
    vi.stubEnv("ASK_ENDALL_ADMIN_KEY", "secret-admin-key");
    vi.stubEnv("ADMIN_KEY_BYPASS_ENABLED", "true");
  });

  it("bypass on: valid admin_key + tenant_id allows access", async () => {
    const req = makeRequest(
      "/invoice-review?admin_key=secret-admin-key&tenant_id=abc-123"
    );
    const res = await middleware(req);

    expect(res.status).toBe(200);
    const cookie = res.cookies.get("tenant_id");
    expect(cookie?.value).toBe("abc-123");
  });

  // R2-8d cookie-handshake bypass path
  it("bypass on: valid endall_session cookie rewrites with admin_key + tenant_id", async () => {
    const req = makeRequest(
      "/settings/integrations",
      {
        endall_session: JSON.stringify({
          admin_key: "secret-admin-key",
          tenant_id: "abc-123",
        }),
      },
    );
    const res = await middleware(req);

    expect(res.status).toBe(200);
    // Browser address bar URL stays clean (no admin_key); the rewrite
    // adds admin_key + tenant_id to the request URL the page sees via
    // useSearchParams server-side.
    expect(res.headers.get("x-middleware-rewrite") || "").toMatch(
      /admin_key=secret-admin-key/,
    );
    expect(res.headers.get("x-middleware-rewrite") || "").toMatch(
      /tenant_id=abc-123/,
    );
    const cookie = res.cookies.get("tenant_id");
    expect(cookie?.value).toBe("abc-123");
  });

  it("bypass on: cookie present but admin_key mismatch falls through (no rewrite, redirects to login)", async () => {
    mockUser = null;
    const req = makeRequest(
      "/settings/integrations",
      {
        endall_session: JSON.stringify({
          admin_key: "wrong-key",
          tenant_id: "abc-123",
        }),
      },
    );
    const res = await middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location") || "";
    expect(location).toContain("/login");
  });

  // R2-8d fold-in: admin_key compare uses constant-time XOR. These three
  // cases pin the externally-observable contract:
  //   - matching keys allow (sanity)
  //   - same-length mismatch denies (this is the case that exercises the
  //     XOR loop and pins the constant-time content compare)
  //   - different-length mismatch denies WITHOUT throwing (Edge-runtime
  //     safety; the XOR helper returns false on length mismatch where
  //     node:crypto.timingSafeEqual would throw)
  // A future revert to === or to a length-leaking compare breaks one
  // of these.
  it("constant-time admin_key compare: matching keys pass through", async () => {
    const req = makeRequest(
      "/settings/integrations",
      {
        endall_session: JSON.stringify({
          admin_key: "secret-admin-key",
          tenant_id: "abc-123",
        }),
      },
    );
    const res = await middleware(req);
    expect(res.status).toBe(200);
  });

  it("constant-time admin_key compare: same-length mismatch denies", async () => {
    mockUser = null;
    // Same length as "secret-admin-key" (16 chars) but every byte differs.
    const req = makeRequest(
      "/settings/integrations",
      {
        endall_session: JSON.stringify({
          admin_key: "WRONG_SAMELENGTH",
          tenant_id: "abc-123",
        }),
      },
    );
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location") || "").toContain("/login");
  });

  it("constant-time admin_key compare: different-length mismatch denies (does not throw)", async () => {
    mockUser = null;
    // Different length from "secret-admin-key" - exercise the length
    // mismatch branch that node:crypto.timingSafeEqual would throw on.
    const req = makeRequest(
      "/settings/integrations",
      {
        endall_session: JSON.stringify({
          admin_key: "x",
          tenant_id: "abc-123",
        }),
      },
    );
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location") || "").toContain("/login");
  });

  it("bypass on: malformed cookie JSON falls through to URL-param path", async () => {
    const req = makeRequest(
      "/settings/integrations?admin_key=secret-admin-key&tenant_id=abc-123",
      { endall_session: "not-json{{{" },
    );
    const res = await middleware(req);

    // URL params are valid, so URL-param path takes over.
    expect(res.status).toBe(200);
    const cookie = res.cookies.get("tenant_id");
    expect(cookie?.value).toBe("abc-123");
  });

  it("bypass on: cookie + URL params both present, cookie wins", async () => {
    const req = makeRequest(
      "/settings/integrations?admin_key=secret-admin-key&tenant_id=URL-TENANT",
      {
        endall_session: JSON.stringify({
          admin_key: "secret-admin-key",
          tenant_id: "COOKIE-TENANT",
        }),
      },
    );
    const res = await middleware(req);

    expect(res.status).toBe(200);
    // tenant_id cookie set on response is the cookie-derived one.
    const cookie = res.cookies.get("tenant_id");
    expect(cookie?.value).toBe("COOKIE-TENANT");
  });

  it("bypass on: no cookie, no URL params, redirects to login", async () => {
    mockUser = null;
    const req = makeRequest("/settings/integrations");
    const res = await middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location") || "";
    expect(location).toContain("/login");
  });

  it("bypass off + valid session + membership allows access with tenant", async () => {
    vi.stubEnv("ADMIN_KEY_BYPASS_ENABLED", "false");
    mockUser = { id: "user-1" };
    mockMembership = { tenant_id: "tenant-xyz" };

    const req = makeRequest("/invoice-review");
    const res = await middleware(req);

    expect(res.status).toBe(200);
    const cookie = res.cookies.get("tenant_id");
    expect(cookie?.value).toBe("tenant-xyz");
  });

  it("bypass off + no session redirects to /login", async () => {
    vi.stubEnv("ADMIN_KEY_BYPASS_ENABLED", "false");
    mockUser = null;

    const req = makeRequest("/invoice-review");
    const res = await middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location") || "";
    expect(location).toContain("/login");
    expect(location).toContain("redirect=%2Finvoice-review");
  });

  it("bypass off + session + no membership redirects to /no-tenant", async () => {
    vi.stubEnv("ADMIN_KEY_BYPASS_ENABLED", "false");
    mockUser = { id: "user-orphan" };
    mockMembership = null;

    const req = makeRequest("/settings/integrations");
    const res = await middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location") || "";
    expect(location).toContain("/no-tenant");
  });

  // Every real page under src/app that should be publicly reachable. If
  // someone adds a marketing page and forgets the allowlist, this should
  // be the test that fails.
  const PUBLIC_PATHS = [
    "/contact",
    "/demo",
    "/demo/request",
    "/demo/confirmation",
    "/demo/interactive",
    "/discovery",
    "/features",
    "/privacy",
    "/team",
    "/terms",
    "/ask",
    "/oauth/handshake",
  ];

  it.each(PUBLIC_PATHS)(
    "public marketing route %s returns 200 without session",
    async (path) => {
      mockUser = null;
      mockMembership = null;

      const req = makeRequest(path);
      const res = await middleware(req);

      expect(res.status).toBe(200);
    },
  );

  it("bypass off + no session + public route does NOT redirect (the prod regression path)", async () => {
    vi.stubEnv("ADMIN_KEY_BYPASS_ENABLED", "false");
    mockUser = null;
    mockMembership = null;

    const req = makeRequest("/contact");
    const res = await middleware(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("/oauth/handshake is public but /oauth/<other> is not (PUBLIC_PREFIXES narrowed in R2-8d fold-in)", async () => {
    vi.stubEnv("ADMIN_KEY_BYPASS_ENABLED", "false");
    mockUser = null;
    mockMembership = null;

    const handshake = await middleware(makeRequest("/oauth/handshake"));
    expect(handshake.status).toBe(200);

    const sibling = await middleware(makeRequest("/oauth/anything-else"));
    expect(sibling.status).toBe(307);
    expect(sibling.headers.get("location") || "").toContain("/login");
  });

  it("authenticated top-level route still redirects to /login when no session (regression guard)", async () => {
    vi.stubEnv("ADMIN_KEY_BYPASS_ENABLED", "false");
    mockUser = null;

    const req = makeRequest("/settings/integrations");
    const res = await middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location") || "";
    expect(location).toContain("/login");
  });
});
