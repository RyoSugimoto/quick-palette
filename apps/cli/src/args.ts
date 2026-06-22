import { normalizeHex } from "@quick-palette/core";
import {
  MAX_ANALOGOUS_SPREAD,
  MAX_CHROMA_SCALE,
  MAX_HUE_ROTATION,
  MIN_ANALOGOUS_SPREAD,
  MIN_CHROMA_SCALE,
  MIN_HUE_ROTATION,
} from "@quick-palette/core";
import {
  HARMONY_MODES,
  HARMONY_TUNINGS,
  NEUTRAL_MODES,
  STEP_COUNTS,
  type HarmonyMode,
  type HarmonyTuning,
  type NeutralMode,
  type RandomSeed,
  type StepCount,
} from "@quick-palette/core";

export type OutputFormat = "hex" | "json" | "css";

export type CliCommand =
  | { readonly name: "interactive" }
  | { readonly name: "configure" }
  | { readonly name: "help" }
  | { readonly name: "explore"; readonly seed?: RandomSeed }
  | {
    readonly name: "generate";
    readonly seed?: RandomSeed;
    readonly baseColor?: string;
    readonly harmony?: HarmonyMode;
    readonly harmonyTuning?: HarmonyTuning;
    readonly neutralMode?: NeutralMode;
    readonly colorSteps?: StepCount;
    readonly neutralSteps?: StepCount;
    readonly analogousSpread?: number;
    readonly hueRotation?: number;
    readonly chromaScale?: number;
    readonly format: OutputFormat;
    readonly outputPath?: string;
  };

export class CliArgumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CliArgumentError";
  }
}

export function parseCliArgs(args: readonly string[]): CliCommand {
  if (args.length === 0) return { name: "interactive" };
  if (args.includes("--help") || args.includes("-h")) return { name: "help" };

  const [command, ...options] = args;
  if (command === "configure") {
    if (options.length > 0) throw new CliArgumentError("The configure command does not accept options.");
    return { name: "configure" };
  }
  if (command === "explore") return parseExploreOptions(options);
  if (command === "generate") return parseGenerateOptions(options);
  throw new CliArgumentError(
    `Unknown command "${command}". Choose one of: explore, configure, generate. Example: quick-palette explore`,
  );
}

function parseExploreOptions(args: readonly string[]): CliCommand {
  const values = parseOptionValues(args, new Set(["--seed"]));
  const seed = values.get("--seed");
  return seed === undefined ? { name: "explore" } : { name: "explore", seed };
}

function parseGenerateOptions(args: readonly string[]): CliCommand {
  const values = parseOptionValues(args, new Set([
    "--seed",
    "--base",
    "--harmony",
    "--tuning",
    "--neutral",
    "--color-steps",
    "--neutral-steps",
    "--format",
    "--output",
    "--analogous-spread",
    "--hue-rotation",
    "--chroma-scale",
  ]));
  const format = parseChoice(values.get("--format") ?? "hex", "format", ["hex", "json", "css"]);
  const base = values.get("--base");
  const seed = values.get("--seed");
  const harmony = optionalChoice(values.get("--harmony"), "harmony", HARMONY_MODES);
  const harmonyTuning = optionalChoice(values.get("--tuning"), "tuning", HARMONY_TUNINGS);
  const neutralMode = optionalChoice(values.get("--neutral"), "neutral mode", NEUTRAL_MODES);
  const colorSteps = optionalStepCount(values.get("--color-steps"), "color steps");
  const neutralSteps = optionalStepCount(values.get("--neutral-steps"), "neutral steps");
  const outputPath = values.get("--output");
  const analogousSpread = optionalNumber(
    values.get("--analogous-spread"), "analogous spread", MIN_ANALOGOUS_SPREAD, MAX_ANALOGOUS_SPREAD,
  );
  const hueRotation = optionalNumber(
    values.get("--hue-rotation"), "hue rotation", MIN_HUE_ROTATION, MAX_HUE_ROTATION,
  );
  const chromaScale = optionalNumber(
    values.get("--chroma-scale"), "chroma scale", MIN_CHROMA_SCALE, MAX_CHROMA_SCALE,
  );
  if (analogousSpread !== undefined && harmony !== undefined && harmony !== "analogous") {
    throw new CliArgumentError(
      "--analogous-spread only works with --harmony analogous. Example: --harmony analogous --analogous-spread 45",
    );
  }

  return {
    name: "generate",
    ...(seed === undefined ? {} : { seed }),
    ...(base === undefined ? {} : { baseColor: parseBaseColor(base) }),
    ...(harmony === undefined ? {} : { harmony }),
    ...(harmonyTuning === undefined ? {} : { harmonyTuning }),
    ...(neutralMode === undefined ? {} : { neutralMode }),
    ...(colorSteps === undefined ? {} : { colorSteps }),
    ...(neutralSteps === undefined ? {} : { neutralSteps }),
    ...(analogousSpread === undefined ? {} : { analogousSpread }),
    ...(hueRotation === undefined ? {} : { hueRotation }),
    ...(chromaScale === undefined ? {} : { chromaScale }),
    format,
    ...(outputPath === undefined ? {} : { outputPath }),
  };
}

function optionalNumber(
  value: string | undefined,
  label: string,
  min: number,
  max: number,
): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (value.trim() === "" || !Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new CliArgumentError(
      `Invalid ${label} "${value}". Choose a number from ${min} to ${max}. Example: ${numberExample(label)}`,
    );
  }
  return parsed;
}

function parseOptionValues(
  args: readonly string[],
  allowed: ReadonlySet<string>,
): Map<string, string> {
  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index += 2) {
    const option = args[index];
    const value = args[index + 1];
    if (option === undefined || !allowed.has(option)) {
      throw new CliArgumentError(
        `Unknown option "${option ?? ""}". Run quick-palette --help to see valid options. Example: quick-palette generate --format hex`,
      );
    }
    if (values.has(option)) {
      throw new CliArgumentError(`Option ${option} was provided more than once. Keep only one value.`);
    }
    if (value === undefined || value.startsWith("--")) {
      throw new CliArgumentError(
        `Missing value for ${option}. Example: ${optionExample(option)}`,
      );
    }
    values.set(option, value);
  }
  return values;
}

function parseBaseColor(value: string): string {
  try {
    return normalizeHex(value);
  } catch {
    throw new CliArgumentError(
      `Invalid base color "${value}". Use #RGB or #RRGGBB. Example: --base #2563EB`,
    );
  }
}

function optionalChoice<const Values extends readonly string[]>(
  value: string | undefined,
  label: string,
  allowed: Values,
): Values[number] | undefined {
  return value === undefined ? undefined : parseChoice(value, label, allowed);
}

function parseChoice<const Values extends readonly string[]>(
  value: string,
  label: string,
  allowed: Values,
): Values[number] {
  if ((allowed as readonly string[]).includes(value)) return value as Values[number];
  throw new CliArgumentError(
    `Unknown ${label} "${value}". Choose one of: ${allowed.join(", ")}. Example: ${choiceExample(label, allowed[0] ?? value)}`,
  );
}

function optionalStepCount(value: string | undefined, label: string): StepCount | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if ((STEP_COUNTS as readonly number[]).includes(parsed)) return parsed as StepCount;
  throw new CliArgumentError(
    `Invalid ${label} "${value}". Choose one of: ${STEP_COUNTS.join(", ")}. Example: ${label === "color steps" ? "--color-steps 5" : "--neutral-steps 5"}`,
  );
}

function numberExample(label: string): string {
  if (label === "analogous spread") return "--analogous-spread 30";
  if (label === "hue rotation") return "--hue-rotation 15";
  return "--chroma-scale 1";
}

function choiceExample(label: string, fallback: string): string {
  if (label === "harmony") return "--harmony analogous";
  if (label === "tuning") return "--tuning ui";
  if (label === "neutral mode") return "--neutral tinted";
  if (label === "format") return "--format hex";
  return fallback;
}

function optionExample(option: string): string {
  const examples: Readonly<Record<string, string>> = {
    "--seed": "--seed 8f3a21c4",
    "--base": "--base #2563EB",
    "--harmony": "--harmony analogous",
    "--tuning": "--tuning ui",
    "--neutral": "--neutral tinted",
    "--color-steps": "--color-steps 5",
    "--neutral-steps": "--neutral-steps 5",
    "--format": "--format hex",
    "--output": "--output palette.css",
    "--analogous-spread": "--analogous-spread 30",
    "--hue-rotation": "--hue-rotation 15",
    "--chroma-scale": "--chroma-scale 1",
  };
  return examples[option] ?? `${option} <value>`;
}

export const HELP_TEXT = `Quick Palette

Usage:
  quick-palette
  quick-palette explore [--seed <seed>]
  quick-palette configure
  quick-palette generate [options]
  quick-palette --help

Commands:
  explore                  Browse random palettes, optionally from --seed
  configure                Build a palette through guided choices
  generate                 Print or save a palette without prompts
  --help                   Show this command reference

Palette options:
  --seed <seed>            Reproduce a randomized palette
  --base <hex>             Starting color (default: #2563EB)
  --harmony <mode>         monochrome (Single color), analogous (Neighboring colors),
                           complementary (Opposite colors), triadic (Three-color balance),
                           tetradic (Four-color contrast), pentadic (Five-color range)
  --tuning <purpose>       mechanical (Keep exact spacing), ui (Subtle for interfaces),
                           branding (Bold for brands), data-visualization (Distinct for charts)
  --neutral <mode>         neutral (Pure gray) or tinted (Tinted gray)
  --color-steps <count>    3, 5, 7, or 9 (default: 5)
  --neutral-steps <count>  3, 5, 7, or 9 (default: 5)

Fine tuning:
  --analogous-spread <deg> Analogous hue distance, 15 to 60 (default: 30)
  --hue-rotation <deg>     Rotate all generated hues, -180 to 180 (default: 0)
  --chroma-scale <factor>  Scale color chroma, 0 to 2 (default: 1)

Output:
  --format <format>        hex, json, or css (default: hex)
  --output <path>          Write output to a file instead of stdout

  Without --output, generate writes only the selected format to stdout.
  With --output, it writes only to that file. Errors are written to stderr.`;
