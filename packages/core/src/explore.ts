import { generatePalette } from "./generate.js";
import { generateRandomPaletteConfig } from "./random.js";
import type {
  PaletteResult,
  RandomPaletteConfigOptions,
  RandomPaletteConfigResult,
  RandomSeed,
} from "./types.js";

const MAX_NEXT_ATTEMPTS = 1024;

export interface PaletteCandidate extends RandomPaletteConfigResult {
  readonly result: PaletteResult;
}

export function createPaletteCandidate(seed?: RandomSeed): PaletteCandidate {
  const random = seed === undefined
    ? generateRandomPaletteConfig()
    : generateRandomPaletteConfig({ seed });
  return candidateFromRandom(random);
}

export function nextPaletteCandidate(current: PaletteCandidate): PaletteCandidate {
  const currentSeed = Number.parseInt(current.seed, 16);
  for (let offset = 1; offset <= MAX_NEXT_ATTEMPTS; offset += 1) {
    const seed = (currentSeed + offset) >>> 0;
    const next = candidateFromRandom(generateRandomPaletteConfig({ seed }));
    if (!samePalette(current.result, next.result)) return next;
  }
  throw new Error("Unable to generate a visually different palette.");
}

export function candidateFromRandom(
  random: RandomPaletteConfigResult,
  generate: typeof generatePalette = generatePalette,
): PaletteCandidate {
  return { ...random, result: generate(random.config) };
}

export function nextPaletteCandidateWith(
  current: PaletteCandidate,
  randomConfig: (options?: RandomPaletteConfigOptions) => RandomPaletteConfigResult,
  generate: typeof generatePalette,
): PaletteCandidate {
  const currentSeed = Number.parseInt(current.seed, 16);
  for (let offset = 1; offset <= MAX_NEXT_ATTEMPTS; offset += 1) {
    const seed = (currentSeed + offset) >>> 0;
    const next = candidateFromRandom(randomConfig({ seed }), generate);
    if (!samePalette(current.result, next.result)) return next;
  }
  throw new Error("Unable to generate a visually different palette.");
}

function samePalette(left: PaletteResult, right: PaletteResult): boolean {
  return sameColors(left.colors, right.colors) && sameColors(left.neutrals, right.neutrals);
}

function sameColors(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((color, index) => color === right[index]);
}
