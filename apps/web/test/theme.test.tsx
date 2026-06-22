import { fireEvent, render, screen, waitFor } from "@testing-library/preact";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeControl } from "../src/components/ThemeControl.js";
import { useTheme } from "../src/theme.js";

function ThemeHarness() {
  const [theme, setTheme] = useTheme();
  return <ThemeControl value={theme} onChange={setTheme} />;
}

describe("theme preference", () => {
  let dark = false;
  let listener: (() => void) | undefined;

  beforeEach(() => {
    dark = false;
    listener = undefined;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({
        get matches() { return dark; },
        addEventListener: (_event: string, callback: () => void) => { listener = callback; },
        removeEventListener: vi.fn(),
      }),
    });
  });

  it("persists an explicit preference", async () => {
    render(<ThemeHarness />);
    fireEvent.change(screen.getByLabelText("Theme"), { target: { value: "dark" } });

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    expect(window.localStorage.getItem("quick-palette-theme")).toBe("dark");
  });

  it("responds to system theme changes", async () => {
    render(<ThemeHarness />);
    expect(document.documentElement.dataset.theme).toBe("light");

    dark = true;
    listener?.();
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
  });
});
