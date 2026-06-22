import { DEFAULT_COLOR_STEPS, DEFAULT_NEUTRAL_STEPS } from "./constants.js";
import { generateRandomPaletteConfig } from "./random.js";
import type {
  HarmonyMode,
  HarmonyTuning,
  NeutralMode,
  PaletteAdjustments,
  PaletteConfig,
  RandomSeed,
  StepCount,
} from "./types.js";

export const DEFAULT_PALETTE_CONFIG: PaletteConfig = {
  baseColor: "#2563EB",
  harmony: "analogous",
  harmonyTuning: "mechanical",
  neutralMode: "neutral",
  colorSteps: DEFAULT_COLOR_STEPS,
  neutralSteps: DEFAULT_NEUTRAL_STEPS,
};

export interface PaletteConfigOptions {
  readonly seed?: RandomSeed;
  readonly baseColor?: string;
  readonly harmony?: HarmonyMode;
  readonly harmonyTuning?: HarmonyTuning;
  readonly neutralMode?: NeutralMode;
  readonly colorSteps?: StepCount;
  readonly neutralSteps?: StepCount;
  readonly adjustments?: PaletteAdjustments;
}

export function resolvePaletteConfig(options: PaletteConfigOptions = {}): PaletteConfig {
  const constraints = {
    ...(options.baseColor === undefined ? {} : { baseColor: options.baseColor }),
    ...(options.harmony === undefined ? {} : { harmony: options.harmony }),
    ...(options.harmonyTuning === undefined ? {} : { harmonyTuning: options.harmonyTuning }),
    ...(options.neutralMode === undefined ? {} : { neutralMode: options.neutralMode }),
    ...(options.colorSteps === undefined ? {} : { colorSteps: options.colorSteps }),
    ...(options.neutralSteps === undefined ? {} : { neutralSteps: options.neutralSteps }),
    ...(options.adjustments === undefined ? {} : { adjustments: options.adjustments }),
  };

  if (options.seed !== undefined) {
    return generateRandomPaletteConfig({ seed: options.seed, constraints }).config;
  }
  return { ...DEFAULT_PALETTE_CONFIG, ...constraints };
}
