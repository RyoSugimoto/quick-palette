import { formatColorSwatch } from "./terminal-color.js";
import type { PaletteResult } from "../core/types.js";

export function formatPreview(result: PaletteResult, useColor: boolean): string {
  return [
    "",
    "Palette preview",
    `Base color: ${result.config.baseColor}`,
    `Color harmony: ${result.config.harmony}`,
    `Neutral palette: ${result.config.neutralMode}`,
    "",
    "Colors",
    ...result.colors.map((hex) => formatColorSwatch(hex, useColor)),
    "",
    "Neutrals",
    ...result.neutrals.map((hex) => formatColorSwatch(hex, useColor)),
  ].join("\n");
}
