import { describe, expect, it } from "vitest";
import { DEFAULT_PALETTE_CONFIG, resolvePaletteConfig } from "../../packages/core/src/config.js";
import { createPaletteCandidate, nextPaletteCandidate } from "../../packages/core/src/explore.js";
import { formatCssOutput, formatJsonOutput, formatPlainHexOutput } from "../../packages/format/src/index.js";
import { generatePalette } from "../../packages/core/src/generate.js";
import { formatHexOutput } from "../../apps/cli/src/output.js";

describe("browser-shared behavior", () => {
  it("uses the CLI generation defaults without a seed", () => {
    expect(resolvePaletteConfig()).toEqual(DEFAULT_PALETTE_CONFIG);
  });

  it("keeps explicit fields while resolving a seeded configuration", () => {
    const config = resolvePaletteConfig({
      seed: "8f3a21c4",
      baseColor: "#2563EB",
      harmony: "tetradic",
      colorSteps: 9,
    });
    expect(config.baseColor).toBe("#2563EB");
    expect(config.harmony).toBe("tetradic");
    expect(config.colorSteps).toBe(9);
  });

  it("advances to a visually distinct deterministic candidate", () => {
    const current = createPaletteCandidate("8f3a21c4");
    const next = nextPaletteCandidate(current);
    expect(next.seed).not.toBe(current.seed);
    expect([...next.result.colors, ...next.result.neutrals])
      .not.toEqual([...current.result.colors, ...current.result.neutrals]);
    expect(nextPaletteCandidate(current)).toEqual(next);
  });

  it("shares exact plain, JSON, and CSS formatting with the CLI boundary", () => {
    const result = generatePalette({
      baseColor: "#2563EB",
      harmony: "analogous",
      harmonyTuning: "ui",
      neutralMode: "tinted",
      colorSteps: 5,
      neutralSteps: 5,
    });
    expect(formatPlainHexOutput(result)).toBe(formatHexOutput(result, false));
    expect(JSON.parse(formatJsonOutput(result))).toEqual(result);
    expect(formatCssOutput(result)).toContain("--palette-color-1-100:");
  });
});
