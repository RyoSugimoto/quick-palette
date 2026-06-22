import { describe, expect, it, vi } from "vitest";
import { configurePalette, exportPalette } from "../../src/cli/configure.js";
import type { PromptInterface } from "../../src/cli/prompt.js";
import type { PaletteConfig } from "../../src/core/types.js";

const initialConfig: PaletteConfig = {
  baseColor: "#2563EB",
  harmony: "analogous",
  harmonyTuning: "ui",
  neutralMode: "tinted",
  colorSteps: 5,
  neutralSteps: 5,
};

function createPrompt(
  choices: unknown[],
  questions: string[] = [],
): PromptInterface & { choose: ReturnType<typeof vi.fn>; question: ReturnType<typeof vi.fn> } {
  const remainingChoices = [...choices];
  const remainingQuestions = [...questions];
  return {
    choose: vi.fn(async () => remainingChoices.shift()),
    question: vi.fn(async () => remainingQuestions.shift() ?? ""),
    close: vi.fn(),
  };
}

describe("detailed configuration flow", () => {
  it("exports an already generated exploration result", async () => {
    const prompt = createPrompt(["json", "print", "done"]);
    const writeJson = vi.fn().mockResolvedValue(undefined);

    const result = await configurePalette(
      createPrompt(["done"]),
      false,
      initialConfig,
      { output: vi.fn() },
    );
    await exportPalette(prompt, result, writeJson, vi.fn());

    expect(writeJson).toHaveBeenCalledWith(result);
  });

  it("finishes with implicit five-step defaults without repeating output", async () => {
    const prompt = createPrompt([
      "hex",
      "analogous",
      "ui",
      "tinted",
      "done",
    ], ["#2563eb"]);
    const output = vi.fn();

    const result = await configurePalette(prompt, false, undefined, { output });

    expect(result.config).toEqual(initialConfig);
    expect(prompt.question).toHaveBeenCalledTimes(1);
    expect(prompt.choose.mock.calls.map(([question]) => question)).not.toContain(
      expect.stringContaining("number of"),
    );
    expect(output).toHaveBeenLastCalledWith(expect.stringContaining("Color scales"));
    expect(output).toHaveBeenCalledTimes(1);
  });

  it("edits harmony while preserving every other candidate field", async () => {
    const prompt = createPrompt([
      "edit",
      "harmony",
      "triadic",
      "branding",
      "done",
    ]);

    const result = await configurePalette(prompt, false, initialConfig, { output: vi.fn() });

    expect(result.config).toEqual({
      ...initialConfig,
      harmony: "triadic",
      harmonyTuning: "branding",
    });
  });

  it("removes analogous-only spread when changing harmony", async () => {
    const prompt = createPrompt(["edit", "harmony", "tetradic", "ui", "done"]);
    const result = await configurePalette(prompt, false, {
      ...initialConfig,
      adjustments: { analogousSpread: 45, hueRotation: 15 },
    }, { output: vi.fn() });

    expect(result.config.adjustments).toEqual({ hueRotation: 15 });
  });

  it("edits final adjustments without changing other settings", async () => {
    const prompt = createPrompt(["edit", "adjustments", 45, 15, 0.75, "done"]);
    const result = await configurePalette(prompt, false, initialConfig, { output: vi.fn() });
    expect(result.config).toEqual({
      ...initialConfig,
      adjustments: { analogousSpread: 45, hueRotation: 15, chromaScale: 0.75 },
    });
  });

  it("opens the field picker immediately for an exploration candidate", async () => {
    const prompt = createPrompt(["neutral", "neutral", "done"]);
    const output = vi.fn();

    const result = await configurePalette(prompt, false, initialConfig, {
      output,
      editImmediately: true,
    });

    expect(prompt.choose.mock.calls[0]?.[0]).toBe("What would you like to edit?");
    expect(output).toHaveBeenCalledTimes(1);
    expect(result.config.neutralMode).toBe("neutral");
  });

  it("skips harmony adjustment for monochrome palettes", async () => {
    const prompt = createPrompt(["hex", "monochrome", "neutral", "done"], ["#2563EB"]);

    const result = await configurePalette(prompt, false, undefined, { output: vi.fn() });

    expect(result.config.harmonyTuning).toBe("mechanical");
    expect(prompt.choose.mock.calls.map(([question]) => question)).not.toContain(
      "How should the harmony colors be adjusted?",
    );
  });

  it("resets adjustment and skips its prompt when editing to monochrome", async () => {
    const prompt = createPrompt(["edit", "harmony", "monochrome", "done"]);

    const result = await configurePalette(prompt, false, initialConfig, { output: vi.fn() });

    expect(result.config.harmony).toBe("monochrome");
    expect(result.config.harmonyTuning).toBe("mechanical");
  });

  it("keeps current values preselected while editing", async () => {
    const prompt = createPrompt(["edit", "neutral", "neutral", "done"]);
    await configurePalette(prompt, false, initialConfig, { output: vi.fn() });

    const neutralCall = prompt.choose.mock.calls.find(
      ([question]) => question === "Choose a neutral palette:",
    );
    expect(neutralCall?.[2]).toBe("tinted");
  });

  it("keeps custom step counts reachable through edit", async () => {
    const prompt = createPrompt(["edit", "steps", 7, 9, "done"]);
    const result = await configurePalette(prompt, false, initialConfig, { output: vi.fn() });
    expect(result.config.colorSteps).toBe(7);
    expect(result.config.neutralSteps).toBe(9);
  });

  it("can export both JSON and CSS before finishing", async () => {
    const prompt = createPrompt([
      "export",
      "json",
      "print",
      "another",
      "css",
      "print",
      "back",
      "done",
    ]);
    const writeJson = vi.fn().mockResolvedValue(undefined);
    const writeCss = vi.fn().mockResolvedValue(undefined);

    const result = await configurePalette(prompt, false, initialConfig, {
      output: vi.fn(),
      writeJson,
      writeCss,
    });

    expect(writeJson).toHaveBeenCalledWith(expect.objectContaining({ config: initialConfig }));
    expect(writeCss).toHaveBeenCalledWith(expect.objectContaining({ config: initialConfig }));
    expect(result.config).toEqual(initialConfig);
  });

  it("can save JSON and CSS to selected paths", async () => {
    const prompt = createPrompt([
      "export",
      "json",
      "save",
      "another",
      "css",
      "save",
      "done",
    ], ["palette.json", "palette.css"]);
    const writeJson = vi.fn().mockResolvedValue(undefined);
    const writeCss = vi.fn().mockResolvedValue(undefined);

    await configurePalette(prompt, false, initialConfig, {
      output: vi.fn(),
      writeJson,
      writeCss,
    });

    expect(writeJson).toHaveBeenCalledWith(expect.any(Object), "palette.json");
    expect(writeCss).toHaveBeenCalledWith(expect.any(Object), "palette.css");
  });

  it("returns from export without reprinting the preview", async () => {
    const prompt = createPrompt(["export", "back", "done"]);
    const output = vi.fn();

    await configurePalette(prompt, false, initialConfig, { output });

    expect(output).toHaveBeenCalledTimes(1);
  });
});
