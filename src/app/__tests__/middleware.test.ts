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
      "/dispatch?admin_key=secret-admin-key&tenant_id=abc-123"
    );
    const res = await middleware(req);

    expect(res.status).toBe(200);
    const cookie = res.cookies.get("tenant_id");
    expect(cookie?.value).toBe("abc-123");
  });

  it("bypass off + valid session + membership allows access with tenant", async () => {
    vi.stubEnv("ADMIN_KEY_BYPASS_ENABLED", "false");
    mockUser = { id: "user-1" };
    mockMembership = { tenant_id: "tenant-xyz" };

    const req = makeRequest("/dispatch");
    const res = await middleware(req);

    expect(res.status).toBe(200);
    const cookie = res.cookies.get("tenant_id");
    expect(cookie?.value).toBe("tenant-xyz");
  });

  it("bypass off + no session redirects to /login", async () => {
    vi.stubEnv("ADMIN_KEY_BYPASS_ENABLED", "false");
    mockUser = null;

    const req = makeRequest("/dispatch");
    const res = await middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location") || "";
    expect(location).toContain("/login");
    expect(location).toContain("redirect=%2Fdispatch");
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
    "/demo-files/Patriot_Electric_NPV.xlsx",
    "/demo-files/Patriot_Electric_Proposal.docx",
    "/discovery",
    "/privacy",
    "/team",
    "/terms",
    "/ask",
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
