import {
  COLOR_LIGHTNESS_RANGE,
  DEFAULT_ANALOGOUS_SPREAD,
  DEFAULT_CHROMA_SCALE,
  DEFAULT_HUE_ROTATION,
  HUE_OFFSETS,
  MAX_ANALOGOUS_SPREAD,
  MAX_CHROMA_SCALE,
  MAX_HUE_ROTATION,
  MIN_ANALOGOUS_SPREAD,
  MIN_CHROMA_SCALE,
  MIN_HUE_ROTATION,
  NEUTRAL_LIGHTNESS_RANGE,
  TINTED_NEUTRAL_CHROMA_RATIO,
  TINTED_NEUTRAL_MAX_CHROMA,
} from "./constants.js";
import { hexToOklch, normalizeHex, normalizeHue, oklchToHex } from "./color.js";
import { tuneHarmonyHues } from "./perceptual-harmony.js";
import type { PaletteConfig, PaletteResult } from "./types.js";

const ACHROMATIC_CHROMA_THRESHOLD = 0.001;

export class InvalidPaletteAdjustmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPaletteAdjustmentError";
  }
}

export function generatePalette(input: PaletteConfig): PaletteResult {
  const config = { ...input, baseColor: normalizeHex(input.baseColor) };
  const base = hexToOklch(config.baseColor);
  const adjustments = resolveAdjustments(config);
  const effectiveBase = {
    ...base,
    h: normalizeHue(base.h + adjustments.hueRotation),
  };
  const lightness = interpolate(
    COLOR_LIGHTNESS_RANGE.min,
    COLOR_LIGHTNESS_RANGE.max,
    config.colorSteps,
  );
  const offsets = config.harmony === "analogous"
    ? [-adjustments.analogousSpread, 0, adjustments.analogousSpread]
    : HUE_OFFSETS[config.harmony];
  const mechanicalHues = offsets.map((offset) => normalizeHue(effectiveBase.h + offset));
  const baseChroma = base.c < ACHROMATIC_CHROMA_THRESHOLD
    ? 0
    : Math.max(0.08, Math.min(base.c, 0.22));
  const colorChroma = baseChroma * adjustments.chromaScale;
  const hues = config.harmonyTuning && config.harmonyTuning !== "mechanical"
    ? tuneHarmonyHues({
      base: effectiveBase,
      harmony: config.harmony,
      mechanicalHues,
      purpose: config.harmonyTuning,
      chroma: colorChroma,
    })
    : mechanicalHues;
  const colors = hues.flatMap((h) => lightness.map((l) => oklchToHex({
    l,
    c: colorChroma,
    h,
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
    h: effectiveBase.h,
  }));

  return { config, colors, neutrals };
}

function resolveAdjustments(config: PaletteConfig) {
  const analogousSpread = config.adjustments?.analogousSpread ?? DEFAULT_ANALOGOUS_SPREAD;
  const hueRotation = config.adjustments?.hueRotation ?? DEFAULT_HUE_ROTATION;
  const chromaScale = config.adjustments?.chromaScale ?? DEFAULT_CHROMA_SCALE;

  validateFiniteRange("analogous spread", analogousSpread, MIN_ANALOGOUS_SPREAD, MAX_ANALOGOUS_SPREAD);
  validateFiniteRange("hue rotation", hueRotation, MIN_HUE_ROTATION, MAX_HUE_ROTATION);
  validateFiniteRange("chroma scale", chromaScale, MIN_CHROMA_SCALE, MAX_CHROMA_SCALE);
  if (config.harmony !== "analogous" && config.adjustments?.analogousSpread !== undefined) {
    throw new InvalidPaletteAdjustmentError("Analogous spread requires analogous harmony.");
  }
  return { analogousSpread, hueRotation, chromaScale };
}

function validateFiniteRange(label: string, value: number, min: number, max: number): void {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new InvalidPaletteAdjustmentError(
      `Invalid ${label}: ${String(value)}. Expected a finite value from ${min} to ${max}.`,
    );
  }
}

function interpolate(start: number, end: number, count: number): number[] {
  if (count === 1) return [start];
  return Array.from({ length: count }, (_, index) => (
    start + ((end - start) * index) / (count - 1)
  ));
}
