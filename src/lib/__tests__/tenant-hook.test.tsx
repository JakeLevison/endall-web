import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

type MembershipRow = { tenant_id: string; created_at: string };

let mockUser: { id: string } | null = null;
let mockRows: MembershipRow[] = [];

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: mockUser } })),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          order: vi.fn(async () => ({
            data: mockRows,
            error: null,
          })),
        }),
      }),
    }),
  }),
}));

const captureMock = vi.fn();
vi.mock("@/lib/posthog", () => ({
  posthog: { capture: (...args: unknown[]) => captureMock(...args) },
}));

import { useTenant } from "../tenant-hook";

describe("useTenant", () => {
  beforeEach(() => {
    mockUser = null;
    mockRows = [];
    captureMock.mockReset();
    window.sessionStorage.clear();
  });

  it("returns tenant_id when user has a single membership", async () => {
    mockUser = { id: "user-1" };
    mockRows = [{ tenant_id: "tenant-a", created_at: "2025-01-01" }];

    const { result } = renderHook(() => useTenant());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tenant_id).toBe("tenant-a");
    expect(result.current.error).toBe(null);
    expect(captureMock).not.toHaveBeenCalled();
  });

  it("returns no_session error when auth has no user", async () => {
    mockUser = null;

    const { result } = renderHook(() => useTenant());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tenant_id).toBe(null);
    expect(result.current.error).toBe("no_session");
  });

  it("returns no_membership error when user has no tenant_members rows", async () => {
    mockUser = { id: "user-2" };
    mockRows = [];

    const { result } = renderHook(() => useTenant());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tenant_id).toBe(null);
    expect(result.current.error).toBe("no_membership");
  });

  it("fires multi_membership PostHog breadcrumb once per session, not per render", async () => {
    mockUser = { id: "user-3" };
    mockRows = [
      { tenant_id: "tenant-a", created_at: "2025-01-01" },
      { tenant_id: "tenant-b", created_at: "2025-02-01" },
    ];

    const { result: first } = renderHook(() => useTenant());
    await waitFor(() => {
      expect(first.current.loading).toBe(false);
    });

    expect(captureMock).toHaveBeenCalledTimes(1);
    expect(captureMock).toHaveBeenCalledWith(
      "tenant.multi_membership_detected",
      {
        user_id: "user-3",
        member_count: 2,
        selected_tenant_id: "tenant-a",
      },
    );

    // Re-render in same session — should NOT fire again.
    const { result: second } = renderHook(() => useTenant());
    await waitFor(() => {
      expect(second.current.loading).toBe(false);
    });

    expect(captureMock).toHaveBeenCalledTimes(1);
  });
});
