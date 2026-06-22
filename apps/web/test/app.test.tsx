import { fireEvent, render, screen, waitFor } from "@testing-library/preact";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/App.js";

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
});

describe("App accessibility and configuration", () => {
  it("exposes landmarks, the reset logo, and named controls", () => {
    render(<App />);

    expect(screen.getByRole("link", { name: "Balanced color scales, made easy Quick Palette" }))
      .toHaveAttribute("href", "/");
    expect(screen.getByRole("navigation", { name: "Palette mode" })).toBeTruthy();
    expect(screen.getByRole("main")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Palette preview" })).toBeTruthy();
  });

  it("commits valid HEX on Enter and reverts invalid input on blur", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Configure" }));
    const input = screen.getByLabelText("HEX color") as HTMLInputElement;
    const committed = input.value;

    fireEvent.input(input, { target: { value: "invalid" } });
    fireEvent.blur(input);
    await waitFor(() => expect(input.value).toBe(committed));
    expect(screen.getByText("Enter #RGB or #RRGGBB.")).toBeTruthy();

    fireEvent.input(input, { target: { value: "#abc" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(input.value).toBe("#AABBCC"));
    expect(screen.queryByText("Enter #RGB or #RRGGBB.")).toBeNull();
  });

  it("normalizes dependent harmony controls", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Configure" }));
    const harmony = screen.getByLabelText("Color relationship") as HTMLSelectElement;
    const tuning = screen.getByLabelText("Color balance") as HTMLSelectElement;

    fireEvent.change(harmony, { target: { value: "monochrome" } });
    await waitFor(() => expect(tuning.disabled).toBe(true));
    expect(tuning.value).toBe("mechanical");
    expect(screen.getByText("Single-color palettes use exact spacing.")).toBeTruthy();

    fireEvent.change(harmony, { target: { value: "analogous" } });
    await waitFor(() => expect(document.getElementById("spread")).not.toBeNull());
    expect(document.getElementById("spread")).toHaveAttribute("min", "15");
    expect(document.getElementById("spread")).toHaveAttribute("max", "60");
  });

  it("preserves configured values across mode navigation", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Configure" }));
    const input = screen.getByLabelText("HEX color") as HTMLInputElement;
    fireEvent.input(input, { target: { value: "#abc" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(input.value).toBe("#AABBCC"));

    fireEvent.click(screen.getByRole("button", { name: "Explore" }));
    fireEvent.click(screen.getByRole("button", { name: "Next palette" }));
    fireEvent.click(screen.getByRole("button", { name: "Configure" }));
    expect(screen.getByLabelText("HEX color")).toHaveValue("#AABBCC");
  });

  it("loads the explored candidate only through Edit this palette", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Configure" }));
    const input = screen.getByLabelText("HEX color") as HTMLInputElement;
    fireEvent.input(input, { target: { value: "#abc" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(input.value).toBe("#AABBCC"));

    fireEvent.click(screen.getByRole("button", { name: "Explore" }));
    const exploredBase = screen.getByText("Base").nextElementSibling?.textContent;
    fireEvent.click(screen.getByRole("button", { name: "Edit this palette" }));
    expect(screen.getByLabelText("HEX color")).toHaveValue(exploredBase);
  });

  it("reports an empty seed without replacing the current palette", async () => {
    render(<App />);
    const seed = screen.getByLabelText("Seed") as HTMLInputElement;
    const currentSeed = screen.getByText(/Current normalized seed:/).textContent;

    fireEvent.input(seed, { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Load seed" }));

    expect(await screen.findByText("Enter a non-empty seed.")).toBeTruthy();
    expect(seed).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(/Current normalized seed:/).textContent).toBe(currentSeed);
  });
});
