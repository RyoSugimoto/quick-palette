import { describe, expect, it } from "vitest";
import {
  InvalidHexColorError,
  hexToOklch,
  isInSrgb,
  isValidHex,
  normalizeHex,
  normalizeHue,
} from "../../src/core/color.js";
import {
  DEFAULT_COLOR_STEPS,
  DEFAULT_NEUTRAL_STEPS,
  HUE_OFFSETS,
  TINTED_NEUTRAL_MAX_CHROMA,
} from "../../src/core/constants.js";
import { generatePalette, InvalidPaletteAdjustmentError } from "../../src/core/generate.js";
import { HARMONY_MODES, NEUTRAL_MODES, STEP_COUNTS, type PaletteConfig } from "../../src/core/types.js";

const baseConfig: PaletteConfig = {
  baseColor: "#2563EB",
  harmony: "analogous",
  neutralMode: "tinted",
  colorSteps: 5,
  neutralSteps: 9,
};

describe("HEX handling", () => {
  it("normalizes short and lowercase HEX values", () => {
    expect(normalizeHex(" #abc ")).toBe("#AABBCC");
    expect(normalizeHex("#12abEF")).toBe("#12ABEF");
  });

  it.each(["2563EB", "#12", "#1234", "#GGGGGG", ""]) (
    "rejects invalid input %j",
    (value) => expect(() => normalizeHex(value)).toThrow(InvalidHexColorError),
  );

  it.each(["#abc", " #12abEF ", "#2563EB"])("recognizes valid input %j", (value) => {
    expect(isValidHex(value)).toBe(true);
  });
});

describe("palette generation", () => {
  it("uses five steps as the default for colors and neutrals", () => {
    expect(DEFAULT_COLOR_STEPS).toBe(5);
    expect(DEFAULT_NEUTRAL_STEPS).toBe(5);
  });

  it("is deterministic", () => {
    expect(generatePalette(baseConfig)).toEqual(generatePalette(baseConfig));
  });

  it.each([
    ["#2563EB", "monochrome", ["#002C92", "#427FFF", "#CEDFFE"]],
    ["#FF00FF", "triadic", ["#630163", "#CA47C8", "#FFCAFC", "#493802", "#A78208", "#FFDA7C", "#00434B", "#0B99A9", "#8FF0FF"]],
    ["#CA8A04", "complementary", ["#503402", "#B47B05", "#FFD79F", "#003876", "#4888DB", "#CAE0FE"]],
    ["#808080", "analogous", ["#3A3A3A", "#878787", "#DEDEDE", "#3A3A3A", "#878787", "#DEDEDE", "#3A3A3A", "#878787", "#DEDEDE"]],
    ["#DC2626", "analogous", ["#6D023B", "#E43989", "#FFCFDE", "#730207", "#EE3B36", "#FED2CC", "#5A2D01", "#C96C06", "#FED5B7"]],
  ] as const)("preserves the mechanical fixture for %s %s", (baseColor, harmony, expectedColors) => {
    const config = { ...baseConfig, baseColor, harmony, colorSteps: 3 as const, neutralSteps: 3 as const };
    const omitted = generatePalette(config);
    const explicit = generatePalette({ ...config, harmonyTuning: "mechanical" });
    expect(omitted.colors).toEqual(expectedColors);
    expect(explicit.colors).toEqual(omitted.colors);
    expect(explicit.neutrals).toEqual(omitted.neutrals);
  });

  it.each(STEP_COUNTS)("returns the requested %i lightness steps for every harmony hue", (colorSteps) => {
    const result = generatePalette({ ...baseConfig, colorSteps });
    expect(result.colors).toHaveLength(colorSteps * HUE_OFFSETS[baseConfig.harmony].length);

    for (let start = 0; start < result.colors.length; start += colorSteps) {
      const lightness = result.colors.slice(start, start + colorSteps).map((hex) => hexToOklch(hex).l);
      expect(lightness).toEqual([...lightness].sort((a, b) => a - b));
    }
  });

  it.each(STEP_COUNTS)("returns the requested %i neutral steps", (neutralSteps) => {
    expect(generatePalette({ ...baseConfig, neutralSteps }).neutrals).toHaveLength(neutralSteps);
  });

  it.each(HARMONY_MODES)("supports the %s harmony", (harmony) => {
    const result = generatePalette({ ...baseConfig, harmony });
    expect(result.colors).toHaveLength(
      baseConfig.colorSteps * HUE_OFFSETS[harmony].length,
    );

    const baseHue = hexToOklch(baseConfig.baseColor).h;
    HUE_OFFSETS[harmony].forEach((offset, groupIndex) => {
      const representative = result.colors[(groupIndex * baseConfig.colorSteps) + 2];
      expect(representative).toBeDefined();
      const actualHue = hexToOklch(representative as string).h;
      expect(hueDistance(actualHue, normalizeHue(baseHue + offset))).toBeLessThan(2);
    });
  });

  it("keeps existing colors when adjustment defaults are explicit", () => {
    const existing = generatePalette(baseConfig);
    const adjusted = generatePalette({
      ...baseConfig,
      adjustments: { analogousSpread: 30, hueRotation: 0, chromaScale: 1 },
    });
    expect(adjusted.colors).toEqual(existing.colors);
    expect(adjusted.neutrals).toEqual(existing.neutrals);
  });

  it("adjusts analogous spread symmetrically", () => {
    const result = generatePalette({
      ...baseConfig,
      harmonyTuning: "mechanical",
      colorSteps: 3,
      adjustments: { analogousSpread: 45 },
    });
    const baseHue = hexToOklch(baseConfig.baseColor).h;
    [-45, 0, 45].forEach((offset, index) => {
      const hue = hexToOklch(result.colors[(index * 3) + 1]!).h;
      expect(hueDistance(hue, normalizeHue(baseHue + offset))).toBeLessThan(2);
    });
  });

  it("rotates generated colors and can remove their chroma", () => {
    const rotated = generatePalette({
      ...baseConfig,
      harmony: "monochrome",
      colorSteps: 3,
      adjustments: { hueRotation: 30 },
    });
    const actualHue = hexToOklch(rotated.colors[1]!).h;
    expect(hueDistance(actualHue, hexToOklch(baseConfig.baseColor).h + 30)).toBeLessThan(2);

    const achromatic = generatePalette({
      ...baseConfig,
      harmony: "monochrome",
      adjustments: { chromaScale: 0 },
    });
    achromatic.colors.forEach((hex) => expect(hexToOklch(hex).c).toBeLessThan(0.005));
  });

  it.each([
    { analogousSpread: 14 },
    { hueRotation: Number.NaN },
    { chromaScale: 2.1 },
  ])("rejects invalid adjustment $analogousSpread$hueRotation$chromaScale", (adjustments) => {
    expect(() => generatePalette({ ...baseConfig, adjustments }))
      .toThrow(InvalidPaletteAdjustmentError);
  });

  it("rejects analogous spread for another harmony", () => {
    expect(() => generatePalette({
      ...baseConfig,
      harmony: "triadic",
      adjustments: { analogousSpread: 30 },
    })).toThrow(InvalidPaletteAdjustmentError);
  });

  it.each(["#000000", "#808080", "#FFFFFF"])(
    "keeps an achromatic base color %s achromatic",
    (baseColor) => {
      const result = generatePalette({ ...baseConfig, baseColor, harmony: "monochrome" });
      for (const hex of result.colors) {
        expect(hexToOklch(hex).c).toBeLessThan(0.005);
      }
    },
  );

  it.each(NEUTRAL_MODES)("supports the %s neutral mode", (neutralMode) => {
    expect(generatePalette({ ...baseConfig, neutralMode }).neutrals).toHaveLength(baseConfig.neutralSteps);
  });

  it("keeps base-tinted grays subtly chromatic", () => {
    const result = generatePalette({ ...baseConfig, baseColor: "#FF00FF", neutralMode: "tinted" });
    for (const hex of result.neutrals) {
      expect(hexToOklch(hex).c).toBeLessThanOrEqual(TINTED_NEUTRAL_MAX_CHROMA + 0.002);
    }
  });

  it("returns only valid, in-gamut sRGB HEX values", () => {
    for (const harmony of HARMONY_MODES) {
      for (const neutralMode of NEUTRAL_MODES) {
        const result = generatePalette({ ...baseConfig, baseColor: "#FF00FF", harmony, neutralMode });
        for (const hex of [...result.colors, ...result.neutrals]) {
          expect(isValidHex(hex)).toBe(true);
          expect(isInSrgb(hexToOklch(hex))).toBe(true);
        }
      }
    }
  });
});

function hueDistance(left: number, right: number): number {
  const difference = Math.abs(normalizeHue(left) - normalizeHue(right));
  return Math.min(difference, 360 - difference);
}
