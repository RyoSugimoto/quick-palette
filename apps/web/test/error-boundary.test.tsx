import { render, screen } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import { ErrorBoundary } from "../src/components/ErrorBoundary.js";

function BrokenComponent(): never {
  throw new Error("render failed");
}

describe("ErrorBoundary", () => {
  it("provides a keyboard-operable recovery UI", () => {
    render(<ErrorBoundary><BrokenComponent /></ErrorBoundary>);

    expect(screen.getByRole("heading", { name: "Quick Palette could not continue" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reload Quick Palette" })).toBeEnabled();
  });
});
