import type { ColorCandidate, ColorFamily, HarmonyMode, Mood, UseCase } from "./types.js";

export const COLOR_FAMILY_CANDIDATES: Readonly<Record<ColorFamily, readonly ColorCandidate[]>> = {
  red: [{ name: "Crimson", hex: "#DC2626" }, { name: "Rose", hex: "#E11D48" }],
  orange: [{ name: "Orange", hex: "#EA580C" }, { name: "Amber", hex: "#D97706" }],
  yellow: [{ name: "Gold", hex: "#CA8A04" }, { name: "Lemon", hex: "#EAB308" }],
  green: [{ name: "Emerald", hex: "#059669" }, { name: "Forest", hex: "#15803D" }],
  blue: [{ name: "Blue", hex: "#2563EB" }, { name: "Sky", hex: "#0284C7" }],
  purple: [{ name: "Violet", hex: "#7C3AED" }, { name: "Purple", hex: "#9333EA" }],
};

export const MOOD_CANDIDATES: Readonly<Record<Mood, readonly ColorCandidate[]>> = {
  calm: [{ name: "Quiet Blue", hex: "#3B82F6" }, { name: "Soft Teal", hex: "#0D9488" }],
  energetic: [{ name: "Bright Orange", hex: "#F97316" }, { name: "Hot Pink", hex: "#DB2777" }],
  elegant: [{ name: "Deep Navy", hex: "#1E3A8A" }, { name: "Burgundy", hex: "#881337" }],
  playful: [{ name: "Candy Purple", hex: "#A855F7" }, { name: "Fresh Green", hex: "#22C55E" }],
};

export const USE_CASE_CANDIDATES: Readonly<Record<UseCase, readonly ColorCandidate[]>> = {
  brand: [{ name: "Confident Blue", hex: "#2563EB" }, { name: "Bold Red", hex: "#DC2626" }],
  dashboard: [{ name: "Data Blue", hex: "#0369A1" }, { name: "Data Teal", hex: "#0F766E" }],
  editorial: [{ name: "Ink", hex: "#334155" }, { name: "Accent Red", hex: "#BE123C" }],
  wellness: [{ name: "Sage", hex: "#65A30D" }, { name: "Ocean", hex: "#0891B2" }],
};

export const HUE_OFFSETS: Readonly<Record<HarmonyMode, readonly number[]>> = {
  monochrome: [0],
  analogous: [-30, 0, 30],
  complementary: [0, 180],
  triadic: [0, 120, 240],
};

export const COLOR_LIGHTNESS_RANGE = { min: 0.35, max: 0.9 } as const;
export const NEUTRAL_LIGHTNESS_RANGE = { min: 0.18, max: 0.98 } as const;
export const TINTED_NEUTRAL_MAX_CHROMA = 0.02;
export const TINTED_NEUTRAL_CHROMA_RATIO = 0.12;
export const DEFAULT_COLOR_STEPS = 5;
export const DEFAULT_NEUTRAL_STEPS = 5;
