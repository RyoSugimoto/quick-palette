import { writeFile } from "node:fs/promises";
import type { PaletteResult } from "../core/types.js";
import { formatColorSwatch } from "./terminal-color.js";

export function formatHexOutput(result: PaletteResult, useColor = false): string {
  const colorLabels = STEP_LABELS[result.config.colorSteps];
  const neutralLabels = STEP_LABELS[result.config.neutralSteps];
  const colorGroups: string[] = [];

  for (let start = 0; start < result.colors.length; start += result.config.colorSteps) {
    const colors = [...result.colors.slice(start, start + result.config.colorSteps)].reverse();
    colorGroups.push([
      `Scale ${colorGroups.length + 1}`,
      ...formatScale(colors, colorLabels, useColor),
    ].join("\n"));
  }

  return [
    "Color scales",
    colorGroups.join("\n\n"),
    "",
    "Neutral scale",
    ...formatScale(result.neutrals, neutralLabels, useColor),
  ].join("\n");
}

export function formatJsonOutput(result: PaletteResult): string {
  return JSON.stringify(result, null, 2);
}

const STEP_LABELS = {
  3: [100, 500, 900],
  5: [100, 300, 500, 700, 900],
  7: [100, 200, 300, 500, 700, 800, 900],
  9: [100, 200, 300, 400, 500, 600, 700, 800, 900],
} as const;

function formatScale(
  colors: readonly string[],
  labels: readonly number[],
  useColor: boolean,
): string[] {
  return colors.map((hex, index) => (
    `  ${String(labels[index]).padStart(3)}  ${formatColorSwatch(hex, useColor).trimStart()}`
  ));
}

export function formatCssOutput(result: PaletteResult): string {
  const colorLabels = STEP_LABELS[result.config.colorSteps];
  const neutralLabels = STEP_LABELS[result.config.neutralSteps];
  const colorGroups: string[][] = [];

  for (let start = 0; start < result.colors.length; start += result.config.colorSteps) {
    const colors = [...result.colors.slice(start, start + result.config.colorSteps)].reverse();
    const groupNumber = colorGroups.length + 1;
    colorGroups.push(colors.map((hex, index) => (
      `  --palette-color-${groupNumber}-${colorLabels[index]}: ${hex};`
    )));
  }

  const neutrals = result.neutrals.map((hex, index) => (
    `  --palette-neutral-${neutralLabels[index]}: ${hex};`
  ));
  const declarations = [...colorGroups, neutrals]
    .map((group) => group.join("\n"))
    .join("\n\n");

  return `:root {\n${declarations}\n}\n`;
}

export async function writeJsonOutput(result: PaletteResult, outputPath?: string): Promise<void> {
  const json = `${formatJsonOutput(result)}\n`;
  if (!outputPath) {
    console.log(`\nJSON\n${json}`);
    return;
  }
  await writeFile(outputPath, json, "utf8");
  console.log(`JSON saved to ${outputPath}`);
}

export async function writeCssOutput(result: PaletteResult, outputPath?: string): Promise<void> {
  const css = formatCssOutput(result);
  if (!outputPath) {
    console.log(`\nCSS\n${css}`);
    return;
  }
  await writeFile(outputPath, css, "utf8");
  console.log(`CSS saved to ${outputPath}`);
}
