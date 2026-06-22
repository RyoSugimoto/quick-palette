import { describe, expect, it } from "vitest";
import {
  DEFAULT_COLOR_STEPS,
  DEFAULT_NEUTRAL_STEPS,
  RANDOM_BASE_COLORS,
  RANDOM_HARMONIES,
  RANDOM_HARMONY_TUNINGS,
  RANDOM_NEUTRAL_MODES,
} from "../../packages/core/src/constants.js";
import { generatePalette } from "../../packages/core/src/generate.js";
import {
  generateRandomPaletteConfig,
  InvalidRandomSeedError,
} from "../../packages/core/src/random.js";

describe("random palette configuration", () => {
  it("returns the same configuration for the same seed", () => {
    expect(generateRandomPaletteConfig({ seed: "8f3a21c4" }))
      .toEqual(generateRandomPaletteConfig({ seed: "8F3A21C4" }));
  });

  it("reproduces arbitrary string seeds from the normalized displayed seed", () => {
    const first = generateRandomPaletteConfig({ seed: "brand launch" });
    expect(first.seed).toMatch(/^[0-9a-f]{8}$/);
    expect(generateRandomPaletteConfig({ seed: first.seed })).toEqual(first);
  });

  it.each(["00000000", "00000001", "7fffffff", "ffffffff", "8f3a21c4"]) (
    "produces a valid palette for representative seed %s",
    (seed) => {
      const result = generateRandomPaletteConfig({ seed });
      expect(RANDOM_BASE_COLORS).toContain(result.config.baseColor);
      expect(RANDOM_HARMONIES).toContain(result.config.harmony);
      expect(RANDOM_HARMONY_TUNINGS).toContain(result.config.harmonyTuning);
      expect(RANDOM_NEUTRAL_MODES).toContain(result.config.neutralMode);
      expect(() => generatePalette(result.config)).not.toThrow();
    },
  );

  it("uses fixed default step counts", () => {
    const { config } = generateRandomPaletteConfig({ seed: 0 });
    expect(config.colorSteps).toBe(DEFAULT_COLOR_STEPS);
    expect(config.neutralSteps).toBe(DEFAULT_NEUTRAL_STEPS);
  });

  it("never changes pinned fields", () => {
    const constraints = {
      baseColor: "#abc",
      harmony: "triadic" as const,
      harmonyTuning: "branding" as const,
      neutralMode: "tinted" as const,
      colorSteps: 3 as const,
      neutralSteps: 9 as const,
      adjustments: { hueRotation: 15, chromaScale: 0.75 },
    };

    for (const seed of [0, 1, 42, 0xffff_ffff]) {
      expect(generateRandomPaletteConfig({ seed, constraints }).config).toEqual({
        ...constraints,
        baseColor: "#AABBCC",
      });
    }
  });

  it("keeps unpinned fields stable when constraints are added", () => {
    const original = generateRandomPaletteConfig({ seed: 0 });
    const constrained = generateRandomPaletteConfig({
      seed: 0,
      constraints: { baseColor: original.config.baseColor },
    });

    expect(constrained).toEqual(original);
  });

  it.each(["", "   ", -1, 0x1_0000_0000, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects malformed or out-of-range seed %j",
    (seed) => {
      expect(() => generateRandomPaletteConfig({ seed })).toThrow(InvalidRandomSeedError);
    },
  );

  it("deduplicates curated random base colors", () => {
    expect(new Set(RANDOM_BASE_COLORS).size).toBe(RANDOM_BASE_COLORS.length);
  });

  it.each(["#64748B", "#9F6F7D", "#9A6F58"])(
    "includes muted candidate %s in random base colors",
    (hex) => expect(RANDOM_BASE_COLORS).toContain(hex),
  );
});
