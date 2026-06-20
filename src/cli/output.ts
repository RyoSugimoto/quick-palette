import { writeFile } from "node:fs/promises";
import type { PaletteResult } from "../core/types.js";
import { formatColorSwatch } from "./terminal-color.js";

export function formatHexOutput(result: PaletteResult, useColor = false): string {
  return [
    "Colors",
    ...result.colors.map((hex) => formatColorSwatch(hex, useColor)),
    "",
    "Neutrals",
    ...result.neutrals.map((hex) => formatColorSwatch(hex, useColor)),
  ].join("\n");
}

export function formatJsonOutput(result: PaletteResult): string {
  return JSON.stringify(result, null, 2);
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
