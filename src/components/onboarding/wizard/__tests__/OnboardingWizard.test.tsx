import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { OnboardingWizard } from "../OnboardingWizard";

const replaceMock = vi.fn();
const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: pushMock }),
  useSearchParams: () => new URLSearchParams("step=company"),
}));

beforeEach(() => {
  replaceMock.mockReset();
  pushMock.mockReset();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
});

function renderWizard() {
  return render(
    <OnboardingWizard
      adminEmail="admin@acme.test"
      tenantName="Acme MEP"
      tenantId="tenant-123"
      token="invite-token-xyz"
    />,
  );
}

async function fillCompanyStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByPlaceholderText(/Acme Mechanical, LLC/i),
    "Acme MEP, LLC",
  );
  await user.type(
    screen.getByPlaceholderText(/123 Main St/i),
    "1 Main St, Hartford CT",
  );
  // Add a licensed jurisdiction tag (Enter-to-commit).
  const tagInput = screen.getByPlaceholderText(/Type a jurisdiction/i);
  await user.type(tagInput, "CT");
  await user.keyboard("{Enter}");
}

describe("OnboardingWizard", () => {
  it("does not advance when the proxy responds with 501", async () => {
    const fetchSpy =
      vi.fn<(input: URL | string, init?: RequestInit) => Promise<Response>>();
    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({ error: "not_implemented", step: "company-details" }),
        {
          status: 501,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const user = userEvent.setup();
    renderWizard();

    // Sanity: we should be on the Company step (StepShell shows "Step 2 of 8").
    await screen.findByText(/step 2 of 8/i);

    await fillCompanyStep(user);
    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    // Bridge call sent the bearer + body.
    const init = fetchSpy.mock.calls[0][1];
    expect(init?.method).toBe("PATCH");
    const headers = (init?.headers ?? {}) as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer invite-token-xyz");

    // Wizard surfaces an error and stays on Company (not advancing to Services).
    await waitFor(() => {
      expect(
        screen.getByText(/your data is still here, try again/i),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/step 2 of 8/i)).toBeInTheDocument();
    expect(screen.queryByText(/step 3 of 8/i)).not.toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("advances to the next step when the proxy responds with 200", async () => {
    const fetchSpy =
      vi.fn<(input: URL | string, init?: RequestInit) => Promise<Response>>();
    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({ step_progress: { company: { completed_at: "x" } } }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const user = userEvent.setup();
    renderWizard();
    await screen.findByText(/step 2 of 8/i);

    await fillCompanyStep(user);
    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    await waitFor(() => {
      expect(screen.getByText(/step 3 of 8/i)).toBeInTheDocument();
    });
  });
});
