import { writeFile } from "node:fs/promises";
import { resolvePaletteConfig } from "@quick-palette/core";
import { generatePalette } from "@quick-palette/core";
import type { CliCommand, OutputFormat } from "./args.js";
import { formatCssOutput, formatHexOutput, formatJsonOutput } from "./output.js";

type GenerateCommand = Extract<CliCommand, { readonly name: "generate" }>;

export async function runGenerateCommand(command: GenerateCommand): Promise<void> {
  const config = resolvePaletteConfig({
    ...(command.seed === undefined ? {} : { seed: command.seed }),
    ...(command.baseColor === undefined ? {} : { baseColor: command.baseColor }),
    ...(command.harmony === undefined
      ? (command.analogousSpread === undefined ? {} : { harmony: "analogous" as const })
      : { harmony: command.harmony }),
    ...(command.harmonyTuning === undefined ? {} : { harmonyTuning: command.harmonyTuning }),
    ...(command.neutralMode === undefined ? {} : { neutralMode: command.neutralMode }),
    ...(command.colorSteps === undefined ? {} : { colorSteps: command.colorSteps }),
    ...(command.neutralSteps === undefined ? {} : { neutralSteps: command.neutralSteps }),
    ...resolveAdjustments(command),
  });
  const result = generatePalette(config);
  const content = `${formatResult(result, command.format)}\n`;
  if (command.outputPath === undefined) {
    process.stdout.write(content);
  } else {
    await writeFile(command.outputPath, content, "utf8");
  }
}

function resolveAdjustments(command: GenerateCommand) {
  const adjustments = {
    ...(command.analogousSpread === undefined ? {} : { analogousSpread: command.analogousSpread }),
    ...(command.hueRotation === undefined ? {} : { hueRotation: command.hueRotation }),
    ...(command.chromaScale === undefined ? {} : { chromaScale: command.chromaScale }),
  };
  return Object.keys(adjustments).length === 0 ? {} : { adjustments };
}

function formatResult(
  result: ReturnType<typeof generatePalette>,
  format: OutputFormat,
): string {
  if (format === "json") return formatJsonOutput(result);
  if (format === "css") return formatCssOutput(result).trimEnd();
  return formatHexOutput(result, false);
}
