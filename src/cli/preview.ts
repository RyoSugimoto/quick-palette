import {
  DEFAULT_ANALOGOUS_SPREAD,
  DEFAULT_CHROMA_SCALE,
  DEFAULT_HUE_ROTATION,
} from "../core/constants.js";
import type {
  HarmonyMode,
  HarmonyTuning,
  NeutralMode,
  PaletteResult,
} from "../core/types.js";
import { formatHexOutput } from "./output.js";

const HARMONY_LABELS: Readonly<Record<HarmonyMode, string>> = {
  monochrome: "Single color",
  analogous: "Neighboring colors",
  complementary: "Opposite colors",
  triadic: "Three-color balance",
  tetradic: "Four-color contrast",
  pentadic: "Five-color range",
};

const HARMONY_TUNING_LABELS: Readonly<Record<HarmonyTuning, string>> = {
  mechanical: "Keep exact spacing",
  ui: "Subtle for interfaces",
  branding: "Bold for brands",
  "data-visualization": "Distinct for charts",
};

const NEUTRAL_LABELS: Readonly<Record<NeutralMode, string>> = {
  neutral: "Pure gray",
  tinted: "Tinted gray",
};

export function formatPreview(result: PaletteResult, useColor: boolean): string {
  const metadata = [
    `Starting color: ${result.config.baseColor}`,
    `Color relationship: ${HARMONY_LABELS[result.config.harmony]}`,
    ...(result.config.harmony === "monochrome"
      ? []
      : [`Color balance: ${HARMONY_TUNING_LABELS[result.config.harmonyTuning ?? "mechanical"]}`]),
    `Gray style: ${NEUTRAL_LABELS[result.config.neutralMode]}`,
    ...(result.config.adjustments?.analogousSpread === undefined
      || result.config.adjustments.analogousSpread === DEFAULT_ANALOGOUS_SPREAD ? [] : [
      `Color spacing: ${result.config.adjustments.analogousSpread}deg`,
    ]),
    ...(result.config.adjustments?.hueRotation === undefined
      || result.config.adjustments.hueRotation === DEFAULT_HUE_ROTATION ? [] : [
      `Hue shift: ${formatSigned(result.config.adjustments.hueRotation)}deg`,
    ]),
    ...(result.config.adjustments?.chromaScale === undefined
      || result.config.adjustments.chromaScale === DEFAULT_CHROMA_SCALE ? [] : [
      `Color intensity: ${result.config.adjustments.chromaScale}x`,
    ]),
  ];

  return [
    "",
    "Palette preview",
    ...metadata,
    "",
    formatHexOutput(result, useColor),
  ].join("\n");
}

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}
