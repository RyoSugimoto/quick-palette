#!/usr/bin/env node
import { argv, env, stdout } from "node:process";
import { CliArgumentError, HELP_TEXT, parseCliArgs } from "./args.js";
import { configurePalette, exportPalette } from "./configure.js";
import { explorePalettes } from "./explore.js";
import { runGenerateCommand } from "./generate-command.js";
import { assertSupportedNodeVersion } from "./node-version.js";
import {
  createPromptInterface,
  PromptCancelledError,
  promptAcceptedPaletteAction,
  promptStartupMode,
  type PromptInterface,
} from "./prompt.js";

async function finishAcceptedPalette(
  prompt: PromptInterface,
  result: Parameters<typeof exportPalette>[1],
): Promise<void> {
  while (await promptAcceptedPaletteAction(prompt) === "export") {
    if (await exportPalette(prompt, result) === "done") return;
  }
}

async function run(args: readonly string[]): Promise<void> {
  assertSupportedNodeVersion();
  const command = parseCliArgs(args);
  if (command.name === "help") {
    console.log(HELP_TEXT);
    return;
  }
  if (command.name === "generate") {
    await runGenerateCommand(command);
    return;
  }

  const rl = createPromptInterface();
  const useColor = Boolean(stdout.isTTY && env.NO_COLOR === undefined);
  console.log("Quick Palette");

  try {
    if (command.name === "explore") {
      const outcome = await explorePalettes(rl, useColor, {
        ...(command.seed === undefined ? {} : { initialSeed: command.seed }),
      });
      if (outcome.action === "edit") {
        await configurePalette(rl, useColor, outcome.config, { editImmediately: true });
      }
      if (outcome.action === "accept") {
        await finishAcceptedPalette(rl, outcome.candidate.result);
      }
      return;
    }
    if (command.name === "configure") {
      await configurePalette(rl, useColor);
      return;
    }

    const startupMode = await promptStartupMode(rl);
    if (startupMode === "explore") {
      const outcome = await explorePalettes(rl, useColor);
      if (outcome.action === "edit") {
        await configurePalette(rl, useColor, outcome.config, { editImmediately: true });
      }
      if (outcome.action === "accept") {
        await finishAcceptedPalette(rl, outcome.candidate.result);
      }
      return;
    }
    await configurePalette(rl, useColor);
  } finally {
    rl.close();
  }
}

run(argv.slice(2)).catch((error: unknown) => {
  if (error instanceof PromptCancelledError) {
    console.error("Cancelled.");
    process.exitCode = 130;
    return;
  }
  if (error instanceof CliArgumentError) {
    console.error(`Error: ${error.message}\nRun quick-palette --help for usage.`);
    process.exitCode = 1;
    return;
  }
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Could not complete the command: ${message}`);
  process.exitCode = 1;
});
