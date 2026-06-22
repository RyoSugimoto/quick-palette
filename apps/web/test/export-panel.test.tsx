import { generatePalette, DEFAULT_PALETTE_CONFIG } from "@quick-palette/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { ExportPanel } from "../src/components/ExportPanel.js";

const result = generatePalette(DEFAULT_PALETTE_CONFIG);

describe("ExportPanel", () => {
  it("reports copy success beside the export actions", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<ExportPanel result={result} />);

    fireEvent.click(screen.getByRole("button", { name: "Copy CSS" }));
    expect(await screen.findByText("Copied CSS output.")).toHaveAttribute("aria-live", "polite");
    expect(writeText).toHaveBeenCalledOnce();
  });

  it("keeps selectable output available when clipboard access fails", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    render(<ExportPanel result={result} />);

    fireEvent.click(screen.getByRole("button", { name: "Copy CSS" }));
    expect(await screen.findByText(/Could not access the clipboard/)).toBeTruthy();
    expect((screen.getByLabelText("CSS output") as HTMLTextAreaElement).value).toContain(":root {");
  });

  it("clears stale feedback when the format changes", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    render(<ExportPanel result={result} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy CSS" }));
    await screen.findByText("Copied CSS output.");

    fireEvent.click(screen.getByRole("button", { name: "JSON" }));
    await waitFor(() => expect(screen.queryByText("Copied CSS output.")).toBeNull());
  });
});
