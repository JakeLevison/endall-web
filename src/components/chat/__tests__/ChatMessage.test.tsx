import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ChatMessage from "../ChatMessage";

describe("ChatMessage", () => {
  it("renders bold markdown as <strong>", () => {
    render(<ChatMessage role="assistant" content="This is **bold text** here" />);
    const strong = screen.getByText("bold text");
    expect(strong.tagName).toBe("STRONG");
  });

  it("renders italic markdown as <em>", () => {
    render(<ChatMessage role="assistant" content="This is *italic text* here" />);
    const em = screen.getByText("italic text");
    expect(em.tagName).toBe("EM");
  });

  it("renders unordered lists", () => {
    render(<ChatMessage role="assistant" content={"- Item one\n- Item two\n- Item three"} />);
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(3);
  });

  it("renders numbered lists", () => {
    render(<ChatMessage role="assistant" content={"1. First\n2. Second\n3. Third"} />);
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(3);
  });

  it("renders headers", () => {
    render(<ChatMessage role="assistant" content="## Section Title" />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent("Section Title");
  });

  it("renders user messages as plain text (no markdown)", () => {
    render(<ChatMessage role="user" content="This is **not bold**" />);
    // User messages should show raw text, not parsed markdown
    expect(screen.getByText("This is **not bold**")).toBeInTheDocument();
  });

  it("renders tables", () => {
    const table = "| Name | Value |\n|------|-------|\n| Revenue | $1M |\n| Cost | $500K |";
    render(<ChatMessage role="assistant" content={table} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Revenue")).toBeInTheDocument();
  });
});
