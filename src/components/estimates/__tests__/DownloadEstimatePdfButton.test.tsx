import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { DownloadEstimatePdfButton } from "../DownloadEstimatePdfButton";

function pdfResponse(filename?: string): Response {
  const headers: Record<string, string> = {
    "Content-Type": "application/pdf",
  };
  if (filename) {
    headers["Content-Disposition"] = `attachment; filename="${filename}"`;
  }
  // %PDF magic so consumers can sniff
  return new Response(new Uint8Array([0x25, 0x50, 0x44, 0x46]), {
    status: 200,
    headers,
  });
}

const originalCreate = URL.createObjectURL;
const originalRevoke = URL.revokeObjectURL;

beforeEach(() => {
  Object.defineProperty(URL, "createObjectURL", {
    value: vi.fn(() => "blob:mock-url"),
    configurable: true,
    writable: true,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    value: vi.fn(),
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
  Object.defineProperty(URL, "createObjectURL", {
    value: originalCreate,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    value: originalRevoke,
    configurable: true,
    writable: true,
  });
});

describe("DownloadEstimatePdfButton", () => {
  it("renders an idle Download PDF label", () => {
    render(<DownloadEstimatePdfButton estimateId="est-1" />);
    expect(
      screen.getByRole("button", { name: /download pdf/i }),
    ).toBeInTheDocument();
  });

  it("hits the proxy and triggers a blob download on click", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(pdfResponse("custom-name.pdf"));
    vi.stubGlobal("fetch", fetchMock);

    const clickSpy = vi.fn();
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === "a") {
        Object.defineProperty(el, "click", { value: clickSpy });
      }
      return el;
    });

    render(<DownloadEstimatePdfButton estimateId="est-1" />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /download pdf/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/estimates/est-1/pdf",
        expect.objectContaining({ cache: "no-store" }),
      );
    });
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("shows an inline error when the proxy returns 404", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "not found" }), { status: 404 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<DownloadEstimatePdfButton estimateId="missing" />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /download pdf/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /pdf not available/i }),
      ).toBeInTheDocument();
    });
  });

  it("shows an inline error when fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("network")),
    );

    render(<DownloadEstimatePdfButton estimateId="est-1" />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /download pdf/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /could not download/i }),
      ).toBeInTheDocument();
    });
  });

  it("revokes the object URL shortly after triggering the download", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(pdfResponse("ok.pdf"));
    vi.stubGlobal("fetch", fetchMock);

    render(<DownloadEstimatePdfButton estimateId="est-1" />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /download pdf/i }));

    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalled();
    });
    // The component schedules the revoke for ~1s after the click;
    // wait until it actually fires rather than racing fake timers
    // with the userEvent click pipeline.
    await waitFor(
      () => {
        expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
      },
      { timeout: 2000 },
    );
  });

  it("does not throw or warn when unmounted while an error timer is pending", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("network")),
    );
    const warn = vi.spyOn(console, "error").mockImplementation(() => {});

    const { unmount } = render(<DownloadEstimatePdfButton estimateId="est-1" />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /download pdf/i }));

    // Error state is set; the auto-clear timer is armed. Unmounting
    // before it fires must not log a setState-on-unmounted warning.
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /could not download/i }),
      ).toBeInTheDocument();
    });
    unmount();

    // Give the (no-op) auto-clear a moment to flush.
    await new Promise((r) => setTimeout(r, 10));
    expect(
      warn.mock.calls.some((c) =>
        String(c[0] ?? "").includes("unmounted"),
      ),
    ).toBe(false);
  });
});
