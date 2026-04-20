import { describe, it, expect, vi, beforeEach } from "vitest";

let mockUser: { id: string } | null = null;
let mockMemberRows: Array<{ tenant_id: string; created_at: string }> = [];
let mockMemberError: { message: string } | null = null;

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: mockUser } })),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => ({
              maybeSingle: vi.fn(async () => ({
                data: mockMemberRows[0] ?? null,
                error: mockMemberError,
              })),
            }),
          }),
        }),
      }),
    }),
  }),
}));

import {
  resolveTenantFromSession,
  tenantUnresolvedResponse,
} from "../tenant-server";

describe("resolveTenantFromSession", () => {
  beforeEach(() => {
    mockUser = null;
    mockMemberRows = [];
    mockMemberError = null;
  });

  it("returns NO_SESSION when no user", async () => {
    const result = await resolveTenantFromSession();
    expect(result).toEqual({ ok: false, code: "NO_SESSION" });
  });

  it("returns NO_TENANT_MEMBERSHIP when user has no membership rows", async () => {
    mockUser = { id: "user-1" };
    mockMemberRows = [];
    const result = await resolveTenantFromSession();
    expect(result).toEqual({ ok: false, code: "NO_TENANT_MEMBERSHIP" });
  });

  it("returns ok + tenant_id when user has a membership", async () => {
    mockUser = { id: "user-1" };
    mockMemberRows = [{ tenant_id: "tenant-a", created_at: "2025-01-01" }];
    const result = await resolveTenantFromSession();
    expect(result).toEqual({
      ok: true,
      tenant_id: "tenant-a",
      user_id: "user-1",
    });
  });

  it("tenantUnresolvedResponse returns 403 with typed body", async () => {
    const res = tenantUnresolvedResponse("NO_TENANT_MEMBERSHIP");
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toEqual({
      error: "tenant_unresolved",
      code: "NO_TENANT_MEMBERSHIP",
    });
  });
});
