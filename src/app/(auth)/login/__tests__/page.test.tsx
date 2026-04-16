import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithOtp: vi.fn(async () => ({ error: null })),
    },
  }),
}));

import LoginPage from "../page";

describe("LoginPage", () => {
  it("renders email input and submit button", () => {
    render(<LoginPage />);

    expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@company\.com/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send sign-in link/i })
    ).toBeInTheDocument();
  });

  it("does not render a password field", () => {
    render(<LoginPage />);

    expect(screen.queryByPlaceholderText(/password/i)).not.toBeInTheDocument();
  });
});
