import { generatePalette } from "@quick-palette/core";
import { candidateFromRandom, nextPaletteCandidateWith } from "@quick-palette/core";
import { generateRandomPaletteConfig } from "@quick-palette/core";
import type {
  PaletteConfig,
  PaletteResult,
  RandomPaletteConfigOptions,
  RandomPaletteConfigResult,
  RandomSeed,
} from "@quick-palette/core";
import { formatHexOutput } from "./output.js";
import {
  promptExplorationAction,
  type ExplorationAction,
  type PromptInterface,
} from "./prompt.js";
import { formatPreview } from "./preview.js";

export interface ExplorationCandidate extends RandomPaletteConfigResult {
  readonly result: PaletteResult;
}

export type ExplorationOutcome =
  | { readonly action: "accept"; readonly candidate: ExplorationCandidate }
  | { readonly action: "edit"; readonly config: PaletteConfig }
  | { readonly action: "quit" };

export interface ExplorationDependencies {
  readonly initialSeed?: RandomSeed;
  readonly randomConfig?: (
    options?: RandomPaletteConfigOptions,
  ) => RandomPaletteConfigResult;
  readonly generate?: (config: PaletteConfig) => PaletteResult;
  readonly promptAction?: (prompt: PromptInterface) => Promise<ExplorationAction>;
  readonly output?: (message: string) => void;
}

export async function explorePalettes(
  prompt: PromptInterface,
  useColor: boolean,
  dependencies: ExplorationDependencies = {},
): Promise<ExplorationOutcome> {
  const randomConfig = dependencies.randomConfig ?? generateRandomPaletteConfig;
  const generate = dependencies.generate ?? generatePalette;
  const promptAction = dependencies.promptAction ?? promptExplorationAction;
  const output = dependencies.output ?? console.log;
  const initialRandom = dependencies.initialSeed === undefined
    ? randomConfig()
    : randomConfig({ seed: dependencies.initialSeed });
  let candidate = createCandidate(initialRandom, generate);

  while (true) {
    output(`${formatPreview(candidate.result, useColor)}\n\nSeed: ${candidate.seed}`);
    const action = await promptAction(prompt);

    if (action === "accept") {
      output(`\n${formatHexOutput(candidate.result, useColor)}`);
      return { action, candidate };
    }
    if (action === "edit") return { action, config: candidate.config };
    if (action === "quit") return { action };
    candidate = nextCandidate(candidate, randomConfig, generate);
  }
}

function createCandidate(
  random: RandomPaletteConfigResult,
  generate: (config: PaletteConfig) => PaletteResult,
): ExplorationCandidate {
  return candidateFromRandom(random, generate);
}

function nextCandidate(
  current: ExplorationCandidate,
  randomConfig: (options?: RandomPaletteConfigOptions) => RandomPaletteConfigResult,
  generate: (config: PaletteConfig) => PaletteResult,
): ExplorationCandidate {
  return nextPaletteCandidateWith(current, randomConfig, generate);
}
