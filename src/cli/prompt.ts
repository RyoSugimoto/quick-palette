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
export type ReviewAction = "continue" | "base" | "harmony" | "neutral";
export type CssOutputChoice =
  | { readonly mode: "skip" }
  | { readonly mode: "print" }
  | { readonly mode: "save"; readonly path: string };

export interface PromptInterface {
  question(prompt: string): Promise<string>;
  choose?<Value>(
    question: string,
    options: readonly { readonly label: string; readonly value: Value }[],
    defaultValue?: Value,
  ): Promise<Value>;
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
  }
  return prompt;
}

export async function promptBaseColor(rl: PromptInterface): Promise<string> {
  const method = await select(rl, "How would you like to choose the base color?", [
    { label: "Enter a HEX value", value: "hex" },
    { label: "Choose a color family", value: "family" },
    { label: "Choose a mood", value: "mood" },
    { label: "Choose a use case", value: "use-case" },
  ] as const);

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

export function promptHarmony(rl: PromptInterface): Promise<HarmonyMode> {
  return select(rl, "Choose a color harmony:", [
    { label: "Monochrome", value: "monochrome" },
    { label: "Analogous", value: "analogous" },
    { label: "Complementary", value: "complementary" },
    { label: "Triadic", value: "triadic" },
  ] as const);
}

export function promptHarmonyTuning(rl: PromptInterface): Promise<HarmonyTuning> {
  return select(rl, "Choose harmony tuning:", [
    { label: "Mechanical (current behavior)", value: "mechanical" },
    { label: "UI", value: "ui" },
    { label: "Branding", value: "branding" },
    { label: "Data visualization", value: "data-visualization" },
  ] as const, "mechanical");
}

export function promptNeutralMode(rl: PromptInterface): Promise<NeutralMode> {
  return select(rl, "Choose a neutral palette:", [
    { label: "Neutral gray", value: "neutral" },
    { label: "Base-tinted gray", value: "tinted" },
  ] as const);
}

export function promptReviewAction(rl: PromptInterface): Promise<ReviewAction> {
  return select(rl, "What would you like to do?", [
    { label: "Continue", value: "continue" },
    { label: "Choose the base color again", value: "base" },
    { label: "Choose the color harmony again", value: "harmony" },
    { label: "Choose the neutral palette again", value: "neutral" },
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

export async function promptOutputPath(rl: PromptInterface): Promise<string | undefined> {
  const answer = (await rl.question("JSON output path (leave blank to print to the terminal): ")).trim();
  return answer || undefined;
}

export async function promptCssOutput(rl: PromptInterface): Promise<CssOutputChoice> {
  const mode = await select(rl, "Choose CSS output:", [
    { label: "Skip CSS output", value: "skip" },
    { label: "Print CSS", value: "print" },
    { label: "Save CSS to a file", value: "save" },
  ] as const, "skip");

  if (mode !== "save") return { mode };

  while (true) {
    const path = (await rl.question("CSS output path: ")).trim();
    if (path) return { mode, path };
    console.log("Enter a path for the CSS output file.");
  }
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
          reject(new Error("Prompt cancelled."));
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
