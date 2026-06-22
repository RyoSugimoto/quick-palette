import {
  DEFAULT_COLOR_STEPS,
  DEFAULT_NEUTRAL_STEPS,
  RANDOM_BASE_COLORS,
  RANDOM_HARMONIES,
  RANDOM_HARMONY_TUNINGS,
  RANDOM_NEUTRAL_MODES,
} from "./constants.js";
import { normalizeHex } from "./color.js";
import type {
  PaletteConfig,
  RandomPaletteConfigOptions,
  RandomPaletteConfigResult,
  RandomSeed,
} from "./types.js";

const UINT32_SIZE = 0x1_0000_0000;
const UINT32_MAX = UINT32_SIZE - 1;
const HEX_SEED_PATTERN = /^[0-9a-f]{1,8}$/i;

export class InvalidRandomSeedError extends Error {
  constructor(seed: unknown) {
    super(`Invalid random seed: ${String(seed)}`);
    this.name = "InvalidRandomSeedError";
  }
}

export function generateRandomPaletteConfig(
  options: RandomPaletteConfigOptions = {},
): RandomPaletteConfigResult {
  const seedValue = options.seed ?? Math.floor(Math.random() * UINT32_SIZE);
  const numericSeed = seedToUint32(seedValue);
  const random = createPrng(numericSeed);
  const constraints = options.constraints ?? {};
  const randomized = {
    baseColor: pick(RANDOM_BASE_COLORS, random),
    harmony: pick(RANDOM_HARMONIES, random),
    harmonyTuning: pick(RANDOM_HARMONY_TUNINGS, random),
    neutralMode: pick(RANDOM_NEUTRAL_MODES, random),
  };

  const config: PaletteConfig = {
    baseColor: constraints.baseColor === undefined
      ? randomized.baseColor
      : normalizeHex(constraints.baseColor),
    harmony: constraints.harmony ?? randomized.harmony,
    harmonyTuning: constraints.harmonyTuning ?? randomized.harmonyTuning,
    neutralMode: constraints.neutralMode ?? randomized.neutralMode,
    colorSteps: constraints.colorSteps ?? DEFAULT_COLOR_STEPS,
    neutralSteps: constraints.neutralSteps ?? DEFAULT_NEUTRAL_STEPS,
    ...(constraints.adjustments === undefined ? {} : { adjustments: constraints.adjustments }),
  };

  return { seed: formatSeed(numericSeed), config };
}

function seedToUint32(seed: RandomSeed): number {
  if (typeof seed === "number") {
    if (!Number.isSafeInteger(seed) || seed < 0 || seed > UINT32_MAX) {
      throw new InvalidRandomSeedError(seed);
    }
    return seed;
  }

  const normalized = seed.trim();
  if (normalized.length === 0) throw new InvalidRandomSeedError(seed);
  if (HEX_SEED_PATTERN.test(normalized)) return Number.parseInt(normalized, 16);

  // FNV-1a maps memorable, arbitrary seed strings to the displayed uint32 seed.
  let hash = 0x811c9dc5;
  for (const character of normalized) {
    hash ^= character.codePointAt(0) as number;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function formatSeed(seed: number): string {
  return seed.toString(16).padStart(8, "0");
}

function createPrng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / UINT32_SIZE;
  };
}

function pick<T>(values: readonly T[], random: () => number): T {
  const value = values[Math.floor(random() * values.length)];
  if (value === undefined) throw new Error("Cannot select from an empty random candidate list");
  return value;
}
