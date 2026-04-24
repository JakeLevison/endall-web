import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Supabase mock state controlled per test. The strip fix must hold whether
// or not we reach the Supabase path, so most tests bypass it via subdomain
// routing or by hitting the tenant branch before Supabase initializes.
let mockUser: { id: string } | null = null;
let mockMembership: { tenant_id: string } | null = null;
// Capture headers forwarded to downstream via NextResponse.next({ request }).
let downstreamHeaders: Headers | null = null;

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

// Spy on NextResponse.next to capture the request.headers that middleware
// forwards downstream. This is the assertion surface for "what did the
// downstream handler actually see?".
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  const OriginalNextResponse = actual.NextResponse;
  const nextSpy = vi.fn((init?: { request?: { headers?: Headers } }) => {
    if (init?.request?.headers) {
      downstreamHeaders = init.request.headers;
    }
    return OriginalNextResponse.next(init);
  });
  const rewriteSpy = vi.fn((url: URL | string, init?: { request?: { headers?: Headers } }) => {
    if (init?.request?.headers) {
      downstreamHeaders = init.request.headers;
    }
    return OriginalNextResponse.rewrite(url, init);
  });
  const PatchedResponse = Object.assign(
    function () {
      return new OriginalNextResponse();
    },
    OriginalNextResponse,
    { next: nextSpy, rewrite: rewriteSpy },
  );
  return { ...actual, NextResponse: PatchedResponse };
});

// Import after mocks so middleware binds the patched NextResponse.
import { middleware } from "../../middleware";

function makeRequest(
  url: string,
  extraHeaders: Record<string, string> = {},
  cookies: Record<string, string> = {},
) {
  const headers = new Headers(extraHeaders);
  const req = new NextRequest(new URL(url, "https://endall.ai"), { headers });
  for (const [k, v] of Object.entries(cookies)) {
    req.cookies.set(k, v);
  }
  return req;
}

describe("middleware: x-tenant-slug defense-in-depth strip", () => {
  beforeEach(() => {
    mockUser = null;
    mockMembership = null;
    downstreamHeaders = null;
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
    vi.stubEnv("ADMIN_KEY_BYPASS_ENABLED", "false");
  });

  it("bare endall.ai with client-supplied x-tenant-slug: header is stripped downstream", async () => {
    // Public marketing route on the main domain. Attacker sends a spoofed
    // tenant slug; middleware must not forward it.
    const req = makeRequest("/contact", {
      host: "endall.ai",
      "x-tenant-slug": "victim-tenant",
    });
    await middleware(req);

    expect(downstreamHeaders).not.toBeNull();
    expect(downstreamHeaders!.get("x-tenant-slug")).toBeNull();
  });

  it("bare endall.ai with client-supplied x-tenant-id: header is stripped downstream", async () => {
    // Defense-in-depth: x-tenant-id is likewise owned by middleware only.
    const req = makeRequest("/contact", {
      host: "endall.ai",
      "x-tenant-id": "victim-tenant-uuid",
    });
    await middleware(req);

    expect(downstreamHeaders).not.toBeNull();
    expect(downstreamHeaders!.get("x-tenant-id")).toBeNull();
  });

  it("{slug}.endall.app with client-supplied x-tenant-slug: overwritten with slug-derived value", async () => {
    const req = makeRequest("/approve/sixteencharstoken00", {
      host: "acme.endall.app",
      "x-tenant-slug": "victim-tenant",
    });
    await middleware(req);

    expect(downstreamHeaders).not.toBeNull();
    expect(downstreamHeaders!.get("x-tenant-slug")).toBe("acme");
  });

  it("{slug}.endall.app with NO client-supplied header: set to slug value", async () => {
    const req = makeRequest("/approve/sixteencharstoken00", {
      host: "acme.endall.app",
    });
    await middleware(req);

    expect(downstreamHeaders).not.toBeNull();
    expect(downstreamHeaders!.get("x-tenant-slug")).toBe("acme");
  });

  it("login route with client-supplied x-tenant-slug: stripped downstream", async () => {
    // /login is a public route on endall.ai. It does not flow through a
    // tenant subdomain, so the header must not survive.
    const req = makeRequest("/login", {
      host: "endall.ai",
      "x-tenant-slug": "victim-tenant",
    });
    await middleware(req);

    expect(downstreamHeaders).not.toBeNull();
    expect(downstreamHeaders!.get("x-tenant-slug")).toBeNull();
  });

  it("reserved subdomain (www.endall.app) with client-supplied x-tenant-slug: stripped", async () => {
    // www.endall.app resolves to null in parseTenantSlug, so it falls into
    // the contractor pipeline. Header must be stripped the same as any
    // other non-tenant-subdomain request.
    const req = makeRequest("/", {
      host: "www.endall.app",
      "x-tenant-slug": "victim-tenant",
    });
    await middleware(req);

    expect(downstreamHeaders).not.toBeNull();
    expect(downstreamHeaders!.get("x-tenant-slug")).toBeNull();
  });

  it("tenant-not-found rewrite on subdomain does not preserve client-supplied header", async () => {
    // Request to a tenant subdomain but non-tenant path rewrites to
    // /tenant-not-found. The slug header is still set by the middleware
    // from the host, not from the client.
    const req = makeRequest("/random-path", {
      host: "acme.endall.app",
      "x-tenant-slug": "victim-tenant",
    });
    await middleware(req);

    expect(downstreamHeaders).not.toBeNull();
    expect(downstreamHeaders!.get("x-tenant-slug")).toBe("acme");
  });

  it("authenticated dispatch request with client-supplied x-tenant-id: overwritten with membership tenant", async () => {
    mockUser = { id: "user-1" };
    mockMembership = { tenant_id: "legit-tenant-uuid" };

    const req = makeRequest("/dispatch", {
      host: "endall.ai",
      "x-tenant-id": "victim-tenant-uuid",
      "x-tenant-slug": "victim-slug",
    });
    await middleware(req);

    expect(downstreamHeaders).not.toBeNull();
    expect(downstreamHeaders!.get("x-tenant-id")).toBe("legit-tenant-uuid");
    expect(downstreamHeaders!.get("x-tenant-slug")).toBeNull();
  });

  it("admin bypass path with client-supplied x-tenant-slug: stripped, bypass tenant-id wins", async () => {
    vi.stubEnv("ADMIN_KEY_BYPASS_ENABLED", "true");
    vi.stubEnv("ASK_ENDALL_ADMIN_KEY", "secret-admin-key");

    const req = makeRequest(
      "/dispatch?admin_key=secret-admin-key&tenant_id=bypass-tenant",
      {
        host: "endall.ai",
        "x-tenant-id": "victim-tenant",
        "x-tenant-slug": "victim-slug",
      },
    );
    await middleware(req);

    expect(downstreamHeaders).not.toBeNull();
    expect(downstreamHeaders!.get("x-tenant-id")).toBe("bypass-tenant");
    expect(downstreamHeaders!.get("x-tenant-slug")).toBeNull();
  });
});
