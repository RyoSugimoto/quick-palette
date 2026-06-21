import { DEFAULT_COLOR_STEPS, DEFAULT_NEUTRAL_STEPS } from "../core/constants.js";
import { generatePalette } from "../core/generate.js";
import type {
  HarmonyMode,
  HarmonyTuning,
  NeutralMode,
  PaletteConfig,
  PaletteResult,
} from "../core/types.js";
import { writeCssOutput, writeJsonOutput } from "./output.js";
import {
  promptBaseColor,
  promptConfigurationAction,
  promptConfigurationEditAction,
  promptExportCompleteAction,
  promptExportDestination,
  promptExportFormat,
  promptHarmony,
  promptHarmonyTuning,
  promptNeutralMode,
  promptStepCount,
  type PromptInterface,
} from "./prompt.js";
import { formatPreview } from "./preview.js";

export interface ConfigureDependencies {
  readonly output?: (message: string) => void;
  readonly writeJson?: typeof writeJsonOutput;
  readonly writeCss?: typeof writeCssOutput;
  readonly editImmediately?: boolean;
}

export async function configurePalette(
  prompt: PromptInterface,
  useColor: boolean,
  initialConfig?: PaletteConfig,
  dependencies: ConfigureDependencies = {},
): Promise<PaletteResult> {
  const output = dependencies.output ?? console.log;
  const writeJson = dependencies.writeJson ?? writeJsonOutput;
  const writeCss = dependencies.writeCss ?? writeCssOutput;
  let config = initialConfig ?? await promptInitialConfig(prompt);
  if (dependencies.editImmediately) config = await editConfig(prompt, config);

  while (true) {
    const result = generatePalette(config);
    output(formatPreview(result, useColor));

    while (true) {
      const action = await promptConfigurationAction(prompt);
      if (action === "done") return result;
      if (action === "edit") {
        config = await editConfig(prompt, config);
        break;
      }

      const exportAction = await exportPalette(prompt, result, writeJson, writeCss);
      if (exportAction === "done") return result;
    }
  }
}

async function promptInitialConfig(prompt: PromptInterface): Promise<PaletteConfig> {
  const baseColor = await promptBaseColor(prompt);
  const harmony = await promptHarmony(prompt);
  const harmonyTuning = harmony === "monochrome"
    ? "mechanical"
    : await promptHarmonyTuning(prompt);
  return {
    baseColor,
    harmony,
    harmonyTuning,
    neutralMode: await promptNeutralMode(prompt),
    colorSteps: DEFAULT_COLOR_STEPS,
    neutralSteps: DEFAULT_NEUTRAL_STEPS,
  };
}

async function editConfig(
  prompt: PromptInterface,
  config: PaletteConfig,
): Promise<PaletteConfig> {
  const action = await promptConfigurationEditAction(prompt);
  if (action === "cancel") return config;
  if (action === "base") {
    return { ...config, baseColor: await promptBaseColor(prompt, config.baseColor) };
  }
  if (action === "harmony") {
    const harmony: HarmonyMode = await promptHarmony(prompt, config.harmony);
    const harmonyTuning: HarmonyTuning = harmony === "monochrome"
      ? "mechanical"
      : await promptHarmonyTuning(prompt, config.harmonyTuning ?? "mechanical");
    return { ...config, harmony, harmonyTuning };
  }
  if (action === "neutral") {
    const neutralMode: NeutralMode = await promptNeutralMode(prompt, config.neutralMode);
    return { ...config, neutralMode };
  }

  const colorSteps = await promptStepCount(
    prompt,
    "Choose the number of color steps",
    config.colorSteps,
  );
  const neutralSteps = await promptStepCount(
    prompt,
    "Choose the number of neutral steps",
    config.neutralSteps,
  );
  return { ...config, colorSteps, neutralSteps };
}

export async function exportPalette(
  prompt: PromptInterface,
  result: PaletteResult,
  writeJson: typeof writeJsonOutput = writeJsonOutput,
  writeCss: typeof writeCssOutput = writeCssOutput,
): Promise<"done" | "back"> {
  while (true) {
    const format = await promptExportFormat(prompt);
    if (format === "back") return "back";

    const destination = await promptExportDestination(prompt, format);
    if (destination.mode === "back") continue;
    if (format === "json") {
      if (destination.mode === "save") await writeJson(result, destination.path);
      else await writeJson(result);
    }
    if (format === "css") {
      if (destination.mode === "save") await writeCss(result, destination.path);
      else await writeCss(result);
    }

    const nextAction = await promptExportCompleteAction(prompt);
    if (nextAction === "done") return "done";
    if (nextAction === "back") return "back";
  }
}
