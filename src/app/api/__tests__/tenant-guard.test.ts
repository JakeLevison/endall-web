import { describe, it, expect, vi, beforeEach } from "vitest";

let mockResolution:
  | { ok: true; tenant_id: string; user_id: string }
  | { ok: false; code: "NO_SESSION" | "NO_TENANT_MEMBERSHIP" } = {
  ok: false,
  code: "NO_SESSION",
};

vi.mock("@/lib/tenant-server", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/tenant-server")>(
      "@/lib/tenant-server",
    );
  return {
    ...actual,
    resolveTenantFromSession: vi.fn(async () => mockResolution),
  };
});

vi.mock("../chat/handler", () => ({
  handleChat: vi.fn(async () => {
    const { NextResponse } = await import("next/server");
    return NextResponse.json({ ok: true });
  }),
}));

beforeEach(() => {
  mockResolution = { ok: false, code: "NO_SESSION" };
});

describe("/api/quickbooks/status", () => {
  beforeEach(() => {
    vi.stubEnv("ASK_ENDALL_ADMIN_KEY", "secret-admin-key");
  });

  it("returns 403 tenant_unresolved when no session", async () => {
    mockResolution = { ok: false, code: "NO_SESSION" };
    const { GET } = await import("../quickbooks/status/route");
    const res = await GET();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toEqual({
      error: "tenant_unresolved",
      code: "NO_SESSION",
    });
  });

  it("returns 403 tenant_unresolved when user has no membership", async () => {
    mockResolution = { ok: false, code: "NO_TENANT_MEMBERSHIP" };
    const { GET } = await import("../quickbooks/status/route");
    const res = await GET();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toEqual({
      error: "tenant_unresolved",
      code: "NO_TENANT_MEMBERSHIP",
    });
  });
});

describe("/api/chat vs /api/demo/chat", () => {
  it("/api/chat returns 403 when session unresolved", async () => {
    mockResolution = { ok: false, code: "NO_SESSION" };
    const { POST } = await import("../chat/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "hi" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("/api/demo/chat works with NEXT_PUBLIC_TENANT_ID fallback, no session needed", async () => {
    vi.stubEnv("NEXT_PUBLIC_TENANT_ID", "marketing-tenant");
    mockResolution = { ok: false, code: "NO_SESSION" };

    const { POST } = await import("../demo/chat/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/demo/chat", {
      method: "POST",
      body: JSON.stringify({ message: "hi" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });

    const { handleChat } = await import("../chat/handler");
    expect(handleChat).toHaveBeenCalledWith(
      expect.anything(),
      "marketing-tenant",
    );
  });
});
