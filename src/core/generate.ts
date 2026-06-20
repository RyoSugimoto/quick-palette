import {
  COLOR_LIGHTNESS_RANGE,
  HUE_OFFSETS,
  NEUTRAL_LIGHTNESS_RANGE,
  TINTED_NEUTRAL_CHROMA_RATIO,
  TINTED_NEUTRAL_MAX_CHROMA,
} from "./constants.js";
import { hexToOklch, normalizeHex, normalizeHue, oklchToHex } from "./color.js";
import type { PaletteConfig, PaletteResult } from "./types.js";

const ACHROMATIC_CHROMA_THRESHOLD = 0.001;

export function generatePalette(input: PaletteConfig): PaletteResult {
  const config = { ...input, baseColor: normalizeHex(input.baseColor) };
  const base = hexToOklch(config.baseColor);
  const lightness = interpolate(
    COLOR_LIGHTNESS_RANGE.min,
    COLOR_LIGHTNESS_RANGE.max,
    config.colorSteps,
  );
  const offsets = HUE_OFFSETS[config.harmony];
  const colorChroma = base.c < ACHROMATIC_CHROMA_THRESHOLD
    ? 0
    : Math.max(0.08, Math.min(base.c, 0.22));
  const colors = offsets.flatMap((offset) => lightness.map((l) => oklchToHex({
    l,
    c: colorChroma,
    h: normalizeHue(base.h + offset),
  })));

  const neutralLightness = interpolate(
    NEUTRAL_LIGHTNESS_RANGE.max,
    NEUTRAL_LIGHTNESS_RANGE.min,
    config.neutralSteps,
  );
  const neutrals = neutralLightness.map((l) => oklchToHex({
    l,
    c: config.neutralMode === "tinted"
      ? Math.min(TINTED_NEUTRAL_MAX_CHROMA, base.c * TINTED_NEUTRAL_CHROMA_RATIO)
      : 0,
    h: base.h,
  }));

  return { config, colors, neutrals };
}

function interpolate(start: number, end: number, count: number): number[] {
  if (count === 1) return [start];
  return Array.from({ length: count }, (_, index) => (
    start + ((end - start) * index) / (count - 1)
  ));
}
