import { describe, expect, it } from "vitest";
import { hexToOklch, isInSrgb, mapToSrgb, normalizeHue } from "../../src/core/color.js";
import {
  HUE_OFFSETS,
  PERCEPTUAL_HUE_SHIFTS,
  PERCEPTUAL_REPRESENTATIVE_LIGHTNESS,
} from "../../src/core/constants.js";
import { generatePalette } from "../../src/core/generate.js";
import { tuneHarmonyHues } from "../../src/core/perceptual-harmony.js";
import { HARMONY_TUNINGS, type HarmonyMode } from "../../src/core/types.js";
import { PERCEPTUAL_HARMONY_FIXTURES } from "../fixtures/perceptual-harmony.js";

const purposes = HARMONY_TUNINGS.filter((tuning) => tuning !== "mechanical");

describe("perceptual harmony tuning", () => {
  it.each(purposes)("is deterministic for %s", (purpose) => {
    const input = tuningInput("#2563EB", "analogous", purpose);
    expect(tuneHarmonyHues(input)).toEqual(tuneHarmonyHues(input));
  });

  it.each(purposes)("keeps the base hue and bounded candidates for %s", (purpose) => {
    const input = tuningInput("#DC2626", "triadic", purpose);
    const tuned = tuneHarmonyHues(input);
    expect(tuned[0]).toBe(input.mechanicalHues[0]);
    tuned.forEach((hue, index) => {
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThan(360);
      expect(hueDistance(hue, input.mechanicalHues[index]!)).toBeLessThanOrEqual(
        Math.max(...PERCEPTUAL_HUE_SHIFTS),
      );
    });
  });

  it.each(purposes)("does not adjust monochrome for %s", (purpose) => {
    const input = tuningInput("#FF00FF", "monochrome", purpose);
    expect(tuneHarmonyHues(input)).toEqual(input.mechanicalHues);
  });

  it.each(purposes)("returns deterministic in-gamut HEX for %s", (harmonyTuning) => {
    const config = {
      baseColor: "#FF00FF",
      harmony: "triadic" as const,
      harmonyTuning,
      neutralMode: "tinted" as const,
      colorSteps: 9 as const,
      neutralSteps: 9 as const,
    };
    const result = generatePalette(config);
    expect(result).toEqual(generatePalette(config));
    result.colors.forEach((hex) => expect(isInSrgb(hexToOklch(hex))).toBe(true));
  });

  it("selects the accepted purpose-specific candidates", () => {
    const ui = tuneHarmonyHues(tuningInput("#DC2626", "analogous", "ui"));
    const branding = tuneHarmonyHues(tuningInput("#DC2626", "analogous", "branding"));
    const data = tuneHarmonyHues(tuningInput("#DC2626", "analogous", "data-visualization"));
    const mechanical = tuningInput("#DC2626", "analogous", "ui").mechanicalHues;

    expect(signedShift(ui[0]!, mechanical[0]!)).toBeCloseTo(0);
    expect(signedShift(ui[2]!, mechanical[2]!)).toBeCloseTo(-12);
    expect(signedShift(branding[0]!, mechanical[0]!)).toBeCloseTo(-12);
    expect(signedShift(branding[2]!, mechanical[2]!)).toBeCloseTo(-12);
    expect(signedShift(data[0]!, mechanical[0]!)).toBeCloseTo(-12);
    expect(signedShift(data[2]!, mechanical[2]!)).toBeCloseTo(12);
  });

  it.each(PERCEPTUAL_HARMONY_FIXTURES)(
    "matches the evaluation fixture for $baseColor $harmony",
    ({ baseColor, harmony, middleColors }) => {
      for (const harmonyTuning of HARMONY_TUNINGS) {
        const result = generatePalette({
          baseColor,
          harmony,
          harmonyTuning,
          neutralMode: "neutral",
          colorSteps: 3,
          neutralSteps: 3,
        });
        const actual = HUE_OFFSETS[harmony].map((_, index) => result.colors[(index * 3) + 1]);
        expect(actual).toEqual(middleColors[harmonyTuning]);
      }
    },
  );

  it("handles hue wraparound without leaving the normalized range", () => {
    const tuned = tuneHarmonyHues(tuningInput("#FF00FF", "analogous", "branding"));
    tuned.forEach((hue) => expect(hue).toBeGreaterThanOrEqual(0));
    tuned.forEach((hue) => expect(hue).toBeLessThan(360));
  });

  it("maximizes the minimum mapped distance for data visualization", () => {
    const input = tuningInput("#993300", "triadic", "data-visualization");
    const tuned = tuneHarmonyHues(input);
    const chroma = Math.max(0.08, Math.min(input.base.c, 0.22));
    const candidateDistances = PERCEPTUAL_HUE_SHIFTS.flatMap((firstShift) => (
      PERCEPTUAL_HUE_SHIFTS.map((secondShift) => minimumMappedDistance([
        input.mechanicalHues[0]!,
        normalizeHue(input.mechanicalHues[1]! + firstShift),
        normalizeHue(input.mechanicalHues[2]! + secondShift),
      ], chroma))
    ));

    expect(minimumMappedDistance(tuned, chroma)).toBeCloseTo(Math.max(...candidateDistances), 12);
  });
});

function tuningInput(
  hex: string,
  harmony: HarmonyMode,
  purpose: "ui" | "branding" | "data-visualization",
) {
  const base = hexToOklch(hex);
  return {
    base,
    harmony,
    mechanicalHues: HUE_OFFSETS[harmony].map((offset) => normalizeHue(base.h + offset)),
    purpose,
  } as const;
}

function hueDistance(left: number, right: number): number {
  return Math.abs(signedShift(left, right));
}

function signedShift(hue: number, target: number): number {
  return ((hue - target + 540) % 360) - 180;
}

function minimumMappedDistance(hues: readonly number[], chroma: number): number {
  const colors = hues.map((h) => {
    const [l, c, hue] = mapToSrgb({
      l: PERCEPTUAL_REPRESENTATIVE_LIGHTNESS,
      c: chroma,
      h,
    }).to("srgb").to("oklch").coords;
    const radians = ((hue ?? 0) * Math.PI) / 180;
    return [l ?? 0, (c ?? 0) * Math.cos(radians), (c ?? 0) * Math.sin(radians)] as const;
  });
  return Math.min(...colors.flatMap((left, index) => colors.slice(index + 1).map((right) => (
    Math.hypot(left[0] - right[0], left[1] - right[1], left[2] - right[2])
  ))));
}
