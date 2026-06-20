export const HARMONY_MODES = [
  "monochrome",
  "analogous",
  "complementary",
  "triadic",
] as const;

export const NEUTRAL_MODES = ["neutral", "tinted"] as const;
export const STEP_COUNTS = [3, 5, 7, 9] as const;
export const HARMONY_TUNINGS = [
  "mechanical",
  "ui",
  "branding",
  "data-visualization",
] as const;

export type HarmonyMode = (typeof HARMONY_MODES)[number];
export type NeutralMode = (typeof NEUTRAL_MODES)[number];
export type StepCount = (typeof STEP_COUNTS)[number];
export type HarmonyTuning = (typeof HARMONY_TUNINGS)[number];

export type ColorFamily = "red" | "orange" | "yellow" | "green" | "blue" | "purple";
export type Mood = "calm" | "energetic" | "elegant" | "playful";
export type UseCase = "brand" | "dashboard" | "editorial" | "wellness";

export interface ColorCandidate {
  readonly name: string;
  readonly hex: string;
}

export interface PaletteConfig {
  readonly baseColor: string;
  readonly harmony: HarmonyMode;
  readonly neutralMode: NeutralMode;
  readonly colorSteps: StepCount;
  readonly neutralSteps: StepCount;
  readonly harmonyTuning?: HarmonyTuning;
}

export interface PaletteResult {
  readonly config: PaletteConfig;
  readonly colors: readonly string[];
  readonly neutrals: readonly string[];
}

export interface OklchColor {
  readonly l: number;
  readonly c: number;
  readonly h: number;
}
