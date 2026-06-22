export const HARMONY_MODES = [
  "monochrome",
  "analogous",
  "complementary",
  "triadic",
  "tetradic",
  "pentadic",
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
export type Mood = "calm" | "energetic" | "elegant" | "playful" | "muted";
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
  readonly adjustments?: PaletteAdjustments;
}

export interface PaletteAdjustments {
  readonly analogousSpread?: number;
  readonly hueRotation?: number;
  readonly chromaScale?: number;
}

export interface PaletteResult {
  readonly config: PaletteConfig;
  readonly colors: readonly string[];
  readonly neutrals: readonly string[];
}

export type RandomSeed = string | number;
export type RandomPaletteConstraints = Partial<PaletteConfig>;

export interface RandomPaletteConfigOptions {
  readonly seed?: RandomSeed;
  readonly constraints?: RandomPaletteConstraints;
}

export interface RandomPaletteConfigResult {
  readonly seed: string;
  readonly config: PaletteConfig;
}

export interface OklchColor {
  readonly l: number;
  readonly c: number;
  readonly h: number;
}
