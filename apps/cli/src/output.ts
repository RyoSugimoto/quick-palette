import { writeFile } from "node:fs/promises";
import { formatCssOutput, formatJsonOutput, STEP_LABELS } from "@quick-palette/format";
import type { PaletteResult } from "@quick-palette/core";
import { formatColorSwatch } from "./terminal-color.js";

export { formatCssOutput, formatJsonOutput } from "@quick-palette/format";

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

function formatScale(
  colors: readonly string[],
  labels: readonly number[],
  useColor: boolean,
): string[] {
  return colors.map((hex, index) => (
    `  ${String(labels[index]).padStart(3)}  ${formatColorSwatch(hex, useColor).trimStart()}`
  ));
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
