#!/usr/bin/env node
import { env, stdout } from "node:process";
import { DEFAULT_COLOR_STEPS, DEFAULT_NEUTRAL_STEPS } from "../core/constants.js";
import { generatePalette } from "../core/generate.js";
import type { HarmonyMode, HarmonyTuning, NeutralMode, PaletteConfig } from "../core/types.js";
import { formatHexOutput, writeCssOutput, writeJsonOutput } from "./output.js";
import {
  createPromptInterface,
  promptBaseColor,
  promptCssOutput,
  promptHarmony,
  promptHarmonyTuning,
  promptNeutralMode,
  promptOutputPath,
  promptReviewAction,
  promptStepCount,
} from "./prompt.js";
import { formatPreview } from "./preview.js";

async function run(): Promise<void> {
  const rl = createPromptInterface();
  const useColor = Boolean(stdout.isTTY && env.NO_COLOR === undefined);
  console.log("Color Palette Generator");

  try {
    let baseColor = await promptBaseColor(rl);
    let harmony: HarmonyMode = await promptHarmony(rl);
    let harmonyTuning: HarmonyTuning = await promptHarmonyTuning(rl);
    let neutralMode: NeutralMode = await promptNeutralMode(rl);

    while (true) {
      const preview = generatePalette({
        baseColor,
        harmony,
        harmonyTuning,
        neutralMode,
        colorSteps: DEFAULT_COLOR_STEPS,
        neutralSteps: DEFAULT_NEUTRAL_STEPS,
      });
      console.log(formatPreview(preview, useColor));

      const action = await promptReviewAction(rl);
      if (action === "continue") break;
      if (action === "base") baseColor = await promptBaseColor(rl);
      if (action === "harmony") {
        harmony = await promptHarmony(rl);
        harmonyTuning = await promptHarmonyTuning(rl);
      }
      if (action === "neutral") neutralMode = await promptNeutralMode(rl);
    }

    const colorSteps = await promptStepCount(rl, "Choose the number of color steps", DEFAULT_COLOR_STEPS);
    const neutralSteps = await promptStepCount(rl, "Choose the number of neutral steps", DEFAULT_NEUTRAL_STEPS);
    const config: PaletteConfig = {
      baseColor,
      harmony,
      harmonyTuning,
      neutralMode,
      colorSteps,
      neutralSteps,
    };
    const result = generatePalette(config);

    console.log(`\n${formatHexOutput(result, useColor)}`);
    await writeJsonOutput(result, await promptOutputPath(rl));
    const cssOutput = await promptCssOutput(rl);
    if (cssOutput.mode === "print") await writeCssOutput(result);
    if (cssOutput.mode === "save") await writeCssOutput(result, cssOutput.path);
  } finally {
    rl.close();
  }
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to generate the palette: ${message}`);
  process.exitCode = 1;
});
