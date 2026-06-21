import { createInterface } from "node:readline/promises";
import { clearScreenDown, cursorTo, emitKeypressEvents, moveCursor } from "node:readline";
import { stdin, stdout } from "node:process";
import { normalizeHex } from "../core/color.js";
import {
  COLOR_FAMILY_CANDIDATES,
  MOOD_CANDIDATES,
  USE_CASE_CANDIDATES,
} from "../core/constants.js";
import type {
  ColorCandidate,
  ColorFamily,
  HarmonyMode,
  HarmonyTuning,
  Mood,
  NeutralMode,
  StepCount,
  UseCase,
} from "../core/types.js";

export type BaseColorMethod = "hex" | "family" | "mood" | "use-case";
export type StartupMode = "explore" | "configure";
export type ExplorationAction = "accept" | "next" | "edit" | "quit";
export type AcceptedPaletteAction = "done" | "export";
export type ConfigurationAction = "done" | "export" | "edit";
export type ConfigurationEditAction = "base" | "harmony" | "neutral" | "steps" | "cancel";
export type ExportFormat = "json" | "css" | "back";
export type ExportDestination =
  | { readonly mode: "back" }
  | { readonly mode: "print" }
  | { readonly mode: "save"; readonly path: string };
export type ExportCompleteAction = "done" | "another" | "back";

export class PromptCancelledError extends Error {
  constructor() {
    super("Prompt cancelled.");
    this.name = "PromptCancelledError";
  }
}

export interface PromptInterface {
  question(prompt: string): Promise<string>;
  choose?<Value>(
    question: string,
    options: readonly { readonly label: string; readonly value: Value }[],
    defaultValue?: Value,
  ): Promise<Value>;
  readExplorationAction?(): Promise<ExplorationAction>;
  close(): void;
}

export function createPromptInterface(): PromptInterface {
  const rl = createInterface({ input: stdin, output: stdout, terminal: Boolean(stdin.isTTY) });
  const lines = stdin.isTTY ? undefined : rl[Symbol.asyncIterator]();
  const prompt: PromptInterface = {
    async question(message): Promise<string> {
      if (!lines) return rl.question(message);
      stdout.write(message);
      const line = await lines.next();
      if (line.done) throw new Error("Input was closed before the prompts were completed.");
      return line.value;
    },
    close: () => rl.close(),
  };
  if (stdin.isTTY && stdout.isTTY) {
    prompt.choose = (question, options, defaultValue) => (
      selectWithCursor(question, options, defaultValue)
    );
    prompt.readExplorationAction = readExplorationAction;
  }
  return prompt;
}

export function promptStartupMode(rl: PromptInterface): Promise<StartupMode> {
  return select(rl, "How would you like to start?", [
    { label: "Explore random palettes", value: "explore" },
    { label: "Create a custom palette", value: "configure" },
  ] as const, "explore");
}

export function promptExplorationAction(rl: PromptInterface): Promise<ExplorationAction> {
  if (rl.readExplorationAction) {
    console.log("\nEnter: accept   Space: next   e: edit   q: quit");
    return rl.readExplorationAction();
  }
  return select(rl, "What would you like to do?", [
    { label: "Accept this palette", value: "accept" },
    { label: "Show the next palette", value: "next" },
    { label: "Edit this palette", value: "edit" },
    { label: "Quit", value: "quit" },
  ] as const, "accept");
}

export function promptAcceptedPaletteAction(
  rl: PromptInterface,
): Promise<AcceptedPaletteAction> {
  return select(rl, "Palette accepted. What would you like to do?", [
    { label: "Done", value: "done" },
    { label: "Export as JSON or CSS", value: "export" },
  ] as const, "done");
}

export async function promptBaseColor(
  rl: PromptInterface,
  currentValue?: string,
): Promise<string> {
  const currentOption = currentValue === undefined
    ? []
    : [{ label: `Keep current base color (${currentValue})`, value: "current" as const }];
  const method = await select(rl, "How would you like to choose the base color?", [
    ...currentOption,
    { label: "Enter a HEX value", value: "hex" },
    { label: "Choose a color family", value: "family" },
    { label: "Choose a mood", value: "mood" },
    { label: "Choose a use case", value: "use-case" },
  ] as const, currentValue === undefined ? undefined : "current");

  if (method === "current") return currentValue as string;
  if (method === "hex") return promptHex(rl);
  if (method === "family") {
    const family = await selectKeys<ColorFamily>(rl, "Choose a color family:", COLOR_FAMILY_CANDIDATES);
    return promptCandidate(rl, COLOR_FAMILY_CANDIDATES[family]);
  }
  if (method === "mood") {
    const mood = await selectKeys<Mood>(rl, "Choose a mood:", MOOD_CANDIDATES);
    return promptCandidate(rl, MOOD_CANDIDATES[mood]);
  }
  const useCase = await selectKeys<UseCase>(rl, "Choose a use case:", USE_CASE_CANDIDATES);
  return promptCandidate(rl, USE_CASE_CANDIDATES[useCase]);
}

export function promptHarmony(rl: PromptInterface, defaultValue?: HarmonyMode): Promise<HarmonyMode> {
  return select(rl, "Choose a color harmony:", [
    { label: "Monochrome (1 hue + neutrals)", value: "monochrome" },
    { label: "Analogous (3 neighboring hues + neutrals)", value: "analogous" },
    { label: "Complementary (2 opposite hues + neutrals)", value: "complementary" },
    { label: "Triadic (3 evenly spaced hues + neutrals)", value: "triadic" },
  ] as const, defaultValue);
}

export function promptHarmonyTuning(
  rl: PromptInterface,
  defaultValue: HarmonyTuning = "mechanical",
): Promise<HarmonyTuning> {
  return select(rl, "How should the harmony colors be adjusted?", [
    { label: "Fixed angles (predictable)", value: "mechanical" },
    { label: "UI (restrained accents)", value: "ui" },
    { label: "Branding (vivid accents)", value: "branding" },
    { label: "Data visualization (separated colors)", value: "data-visualization" },
  ] as const, defaultValue);
}

export function promptNeutralMode(rl: PromptInterface, defaultValue?: NeutralMode): Promise<NeutralMode> {
  return select(rl, "Choose a neutral palette:", [
    { label: "Neutral gray", value: "neutral" },
    { label: "Base-tinted gray", value: "tinted" },
  ] as const, defaultValue);
}

export function promptConfigurationAction(rl: PromptInterface): Promise<ConfigurationAction> {
  return select(rl, "Choose an action:", [
    { label: "Done", value: "done" },
    { label: "Export as JSON or CSS", value: "export" },
    { label: "Change palette settings", value: "edit" },
  ] as const, "done");
}

export function promptConfigurationEditAction(
  rl: PromptInterface,
): Promise<ConfigurationEditAction> {
  return select(rl, "What would you like to edit?", [
    { label: "Base color", value: "base" },
    { label: "Color harmony", value: "harmony" },
    { label: "Neutral palette", value: "neutral" },
    { label: "Step counts", value: "steps" },
    { label: "Cancel editing", value: "cancel" },
  ] as const);
}

export function promptExportFormat(rl: PromptInterface): Promise<ExportFormat> {
  return select(rl, "Choose an export format:", [
    { label: "JSON", value: "json" },
    { label: "CSS", value: "css" },
    { label: "Back to palette", value: "back" },
  ] as const);
}

export function promptStepCount(rl: PromptInterface, label: string, defaultValue: StepCount): Promise<StepCount> {
  return select(rl, `${label} (default: ${defaultValue}):`, [
    { label: "3 steps", value: 3 },
    { label: "5 steps", value: 5 },
    { label: "7 steps", value: 7 },
    { label: "9 steps", value: 9 },
  ] as const, defaultValue);
}

export async function promptExportDestination(
  rl: PromptInterface,
  format: Exclude<ExportFormat, "back">,
): Promise<ExportDestination> {
  const label = format.toUpperCase();
  const mode = await select(rl, `Where should the ${label} output go?`, [
    { label: "Print to the terminal", value: "print" },
    { label: "Save to a file", value: "save" },
    { label: "Back to format selection", value: "back" },
  ] as const, "print");

  if (mode !== "save") return { mode };

  while (true) {
    const path = (await rl.question(`${label} output path: `)).trim();
    if (path) return { mode, path };
    console.log(`Enter a path for the ${label} output file.`);
  }
}

export function promptExportCompleteAction(rl: PromptInterface): Promise<ExportCompleteAction> {
  return select(rl, "Export complete. What would you like to do?", [
    { label: "Done", value: "done" },
    { label: "Export another format", value: "another" },
    { label: "Back to palette", value: "back" },
  ] as const, "done");
}

async function promptHex(rl: PromptInterface): Promise<string> {
  while (true) {
    const answer = await rl.question("Enter a HEX color (#RGB or #RRGGBB): ");
    try {
      return normalizeHex(answer);
    } catch {
      console.log("Enter a valid HEX color, such as #2563EB or #F80.");
    }
  }
}

async function promptCandidate(rl: PromptInterface, candidates: readonly ColorCandidate[]): Promise<string> {
  return select(rl, "Choose a base color:", candidates.map((candidate) => ({
    label: `${candidate.name} (${candidate.hex})`,
    value: candidate.hex,
  })));
}

async function selectKeys<Key extends string>(
  rl: PromptInterface,
  question: string,
  values: Readonly<Record<Key, unknown>>,
): Promise<Key> {
  return select(rl, question, Object.keys(values).map((key) => ({
    label: titleCase(key),
    value: key as Key,
  })));
}

export async function select<Value>(
  rl: PromptInterface,
  question: string,
  options: readonly { readonly label: string; readonly value: Value }[],
  defaultValue?: Value,
): Promise<Value> {
  if (rl.choose) return rl.choose(question, options, defaultValue);

  while (true) {
    console.log(`\n${question}`);
    options.forEach((option, index) => console.log(`  ${index + 1}. ${option.label}`));
    const answer = (await rl.question("> ")).trim();
    if (answer === "" && defaultValue !== undefined) return defaultValue;
    const selected = Number(answer) - 1;
    const option = options[selected];
    if (Number.isInteger(selected) && option) return option.value;
    console.log(`Enter a number from 1 to ${options.length}.`);
  }
}

async function selectWithCursor<Value>(
  question: string,
  options: readonly { readonly label: string; readonly value: Value }[],
  defaultValue?: Value,
): Promise<Value> {
  if (options.length === 0) throw new Error("At least one option is required.");

  const defaultIndex = defaultValue === undefined
    ? -1
    : options.findIndex((option) => Object.is(option.value, defaultValue));
  let selectedIndex = defaultIndex >= 0 ? defaultIndex : 0;

  console.log(`\n${question}`);
  renderCursorOptions(options, selectedIndex, false);
  emitKeypressEvents(stdin);
  const wasRaw = stdin.isRaw;
  stdin.setRawMode(true);
  stdin.resume();

  try {
    return await new Promise<Value>((resolve, reject) => {
      const onKeypress = (_input: string, key: { name?: string; ctrl?: boolean }): void => {
        if (key.ctrl && key.name === "c") {
          stdin.off("keypress", onKeypress);
          reject(new PromptCancelledError());
          return;
        }
        if (key.name === "up" || key.name === "down") {
          const direction = key.name === "up" ? -1 : 1;
          selectedIndex = (selectedIndex + direction + options.length) % options.length;
          renderCursorOptions(options, selectedIndex, true);
          return;
        }
        if (key.name === "return" || key.name === "enter") {
          stdin.off("keypress", onKeypress);
          resolve(options[selectedIndex]!.value);
        }
      };

      stdin.on("keypress", onKeypress);
    });
  } finally {
    stdin.setRawMode(Boolean(wasRaw));
  }
}

async function readExplorationAction(): Promise<ExplorationAction> {
  emitKeypressEvents(stdin);
  const wasRaw = stdin.isRaw;
  stdin.setRawMode(true);
  stdin.resume();

  try {
    return await new Promise<ExplorationAction>((resolve, reject) => {
      const onKeypress = (input: string, key: { name?: string; ctrl?: boolean }): void => {
        if (key.ctrl && key.name === "c") {
          stdin.off("keypress", onKeypress);
          reject(new PromptCancelledError());
          return;
        }

        const action = explorationActionForKey(input, key.name);
        if (action) {
          stdin.off("keypress", onKeypress);
          stdout.write("\n");
          resolve(action);
        }
      };
      stdin.on("keypress", onKeypress);
    });
  } finally {
    stdin.setRawMode(Boolean(wasRaw));
  }
}

export function explorationActionForKey(
  input: string,
  keyName?: string,
): ExplorationAction | undefined {
  if (keyName === "return" || keyName === "enter") return "accept";
  if (keyName === "space" || input === " ") return "next";
  if (input.toLowerCase() === "e") return "edit";
  if (input.toLowerCase() === "q") return "quit";
  return undefined;
}

function renderCursorOptions<Value>(
  options: readonly { readonly label: string; readonly value: Value }[],
  selectedIndex: number,
  redraw: boolean,
): void {
  if (redraw) {
    moveCursor(stdout, 0, -options.length);
    cursorTo(stdout, 0);
    clearScreenDown(stdout);
  }
  stdout.write(`${options.map((option, index) => (
    `${index === selectedIndex ? ">" : " "} ${option.label}`
  )).join("\n")}\n`);
}

function titleCase(value: string): string {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
