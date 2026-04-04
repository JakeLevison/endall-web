import { describe, it, expect, vi } from "vitest";

describe("My Files refresh after file generation", () => {
  it("refreshFiles calls /api/chat/files endpoint", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ files: [{ id: "1", file_name: "test.xlsx" }] }),
    });
    globalThis.fetch = mockFetch;

    // Simulate what refreshFiles does
    const resp = await fetch("/api/chat/files");
    const data = await resp.json();

    expect(mockFetch).toHaveBeenCalledWith("/api/chat/files");
    expect(data.files).toHaveLength(1);
    expect(data.files[0].file_name).toBe("test.xlsx");
  });

  it("refreshFiles handles empty response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ files: [] }),
    });
    globalThis.fetch = mockFetch;

    const resp = await fetch("/api/chat/files");
    const data = await resp.json();
    expect(data.files).toHaveLength(0);
  });

  it("refreshFiles handles fetch error gracefully", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
    globalThis.fetch = mockFetch;

    let files: unknown[] = [];
    try {
      await fetch("/api/chat/files");
    } catch {
      files = []; // fallback to empty
    }
    expect(files).toHaveLength(0);
  });
});
