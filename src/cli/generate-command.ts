import { writeFile } from "node:fs/promises";
import { DEFAULT_COLOR_STEPS, DEFAULT_NEUTRAL_STEPS } from "../core/constants.js";
import { generatePalette } from "../core/generate.js";
import { generateRandomPaletteConfig } from "../core/random.js";
import type { PaletteConfig, RandomPaletteConstraints } from "../core/types.js";
import type { CliCommand, OutputFormat } from "./args.js";
import { formatCssOutput, formatHexOutput, formatJsonOutput } from "./output.js";

const DEFAULT_GENERATE_CONFIG: PaletteConfig = {
  baseColor: "#2563EB",
  harmony: "analogous",
  harmonyTuning: "mechanical",
  neutralMode: "neutral",
  colorSteps: DEFAULT_COLOR_STEPS,
  neutralSteps: DEFAULT_NEUTRAL_STEPS,
};

type GenerateCommand = Extract<CliCommand, { readonly name: "generate" }>;

export async function runGenerateCommand(command: GenerateCommand): Promise<void> {
  const config = resolveConfig(command);
  const result = generatePalette(config);
  const content = `${formatResult(result, command.format)}\n`;
  if (command.outputPath === undefined) {
    process.stdout.write(content);
  } else {
    await writeFile(command.outputPath, content, "utf8");
  }
}

function resolveConfig(command: GenerateCommand): PaletteConfig {
  const adjustments = {
    ...(command.analogousSpread === undefined ? {} : { analogousSpread: command.analogousSpread }),
    ...(command.hueRotation === undefined ? {} : { hueRotation: command.hueRotation }),
    ...(command.chromaScale === undefined ? {} : { chromaScale: command.chromaScale }),
  };
  const constraints: RandomPaletteConstraints = {
    ...(command.baseColor === undefined ? {} : { baseColor: command.baseColor }),
    ...(command.harmony === undefined
      ? (command.analogousSpread === undefined ? {} : { harmony: "analogous" as const })
      : { harmony: command.harmony }),
    ...(command.harmonyTuning === undefined ? {} : { harmonyTuning: command.harmonyTuning }),
    ...(command.neutralMode === undefined ? {} : { neutralMode: command.neutralMode }),
    ...(command.colorSteps === undefined ? {} : { colorSteps: command.colorSteps }),
    ...(command.neutralSteps === undefined ? {} : { neutralSteps: command.neutralSteps }),
    ...(Object.keys(adjustments).length === 0 ? {} : { adjustments }),
  };
  if (command.seed !== undefined) {
    return generateRandomPaletteConfig({ seed: command.seed, constraints }).config;
  }
  return { ...DEFAULT_GENERATE_CONFIG, ...constraints };
}

function formatResult(
  result: ReturnType<typeof generatePalette>,
  format: OutputFormat,
): string {
  if (format === "json") return formatJsonOutput(result);
  if (format === "css") return formatCssOutput(result).trimEnd();
  return formatHexOutput(result, false);
}
