import { describe, expect, it, vi } from "vitest";
import { explorePalettes } from "../../src/cli/explore.js";
import type { ExplorationAction, PromptInterface } from "../../src/cli/prompt.js";
import { generatePalette } from "../../src/core/generate.js";
import { generateRandomPaletteConfig } from "../../src/core/random.js";

const prompt: PromptInterface = {
  question: vi.fn(),
  close: vi.fn(),
};

function randomConfig(options?: Parameters<typeof generateRandomPaletteConfig>[0]) {
  return generateRandomPaletteConfig(options ?? { seed: 0 });
}

function actions(...values: ExplorationAction[]) {
  const promptAction = vi.fn();
  for (const value of values) promptAction.mockResolvedValueOnce(value);
  return promptAction;
}

describe("palette exploration", () => {
  it("starts from a supplied seed", async () => {
    const output = vi.fn();
    const outcome = await explorePalettes(prompt, false, {
      initialSeed: "8f3a21c4",
      randomConfig,
      promptAction: actions("quit"),
      output,
    });

    expect(outcome).toEqual({ action: "quit" });
    expect(output).toHaveBeenCalledWith(expect.stringContaining("Seed: 8f3a21c4"));
  });

  it("accepts and prints the currently previewed candidate", async () => {
    const output = vi.fn();
    const outcome = await explorePalettes(prompt, false, {
      randomConfig,
      promptAction: actions("accept"),
      output,
    });

    expect(outcome.action).toBe("accept");
    if (outcome.action !== "accept") return;
    expect(output).toHaveBeenCalledTimes(2);
    expect(output.mock.calls[0]?.[0]).toContain(`Seed: ${outcome.candidate.seed}`);
    expect(output.mock.calls[1]?.[0]).toContain(outcome.candidate.result.colors[0]);
  });

  it("moves to a candidate with a different seed and palette", async () => {
    const output = vi.fn();
    const outcome = await explorePalettes(prompt, false, {
      randomConfig,
      promptAction: actions("next", "accept"),
      output,
    });

    expect(outcome.action).toBe("accept");
    if (outcome.action !== "accept") return;
    const initial = generateRandomPaletteConfig({ seed: 0 });
    const initialResult = generatePalette(initial.config);
    expect(outcome.candidate.seed).not.toBe(initial.seed);
    expect([
      outcome.candidate.result.colors,
      outcome.candidate.result.neutrals,
    ]).not.toEqual([
      initialResult.colors,
      initialResult.neutrals,
    ]);
    expect(output).toHaveBeenCalledTimes(3);
  });

  it("skips a different config that produces the same palette", async () => {
    const shared = {
      baseColor: "#2563EB",
      harmony: "monochrome" as const,
      neutralMode: "neutral" as const,
      colorSteps: 5 as const,
      neutralSteps: 5 as const,
    };
    const initial = { seed: "000000ea", config: { ...shared, harmonyTuning: "ui" as const } };
    const duplicate = {
      seed: "000000eb",
      config: { ...shared, harmonyTuning: "mechanical" as const },
    };
    const next = generateRandomPaletteConfig({ seed: 236 });
    const configs = [initial, duplicate, next];
    const duplicateRandomConfig = vi.fn(() => configs.shift() ?? next);
    const outcome = await explorePalettes(prompt, false, {
      initialSeed: 234,
      randomConfig: duplicateRandomConfig,
      promptAction: actions("next", "accept"),
      output: vi.fn(),
    });

    expect(initial.config).not.toEqual(duplicate.config);
    const initialResult = generatePalette(initial.config);
    const duplicateResult = generatePalette(duplicate.config);
    expect([duplicateResult.colors, duplicateResult.neutrals]).toEqual([
      initialResult.colors,
      initialResult.neutrals,
    ]);
    expect(outcome.action).toBe("accept");
    if (outcome.action !== "accept") return;
    expect(outcome.candidate.seed).toBe(next.seed);
    expect([
      outcome.candidate.result.colors,
      outcome.candidate.result.neutrals,
    ]).not.toEqual([
      initialResult.colors,
      initialResult.neutrals,
    ]);
  });

  it("returns the current config for editing", async () => {
    const outcome = await explorePalettes(prompt, false, {
      randomConfig,
      promptAction: actions("edit"),
      output: vi.fn(),
    });
    expect(outcome).toEqual({
      action: "edit",
      config: generateRandomPaletteConfig({ seed: 0 }).config,
    });
  });

  it("quits without printing accepted output", async () => {
    const output = vi.fn();
    await expect(explorePalettes(prompt, false, {
      randomConfig,
      promptAction: actions("quit"),
      output,
    })).resolves.toEqual({ action: "quit" });
    expect(output).toHaveBeenCalledTimes(1);
  });

  it("propagates cancellation and stops the loop", async () => {
    const cancelled = new Error("Prompt cancelled.");
    await expect(explorePalettes(prompt, false, {
      randomConfig,
      promptAction: vi.fn().mockRejectedValue(cancelled),
      output: vi.fn(),
    })).rejects.toBe(cancelled);
  });
});
