import type { PaletteResult, StepCount } from "@quick-palette/core";

export const STEP_LABELS: Readonly<Record<StepCount, readonly number[]>> = {
  3: [100, 500, 900],
  5: [100, 300, 500, 700, 900],
  7: [100, 200, 300, 500, 700, 800, 900],
  9: [100, 200, 300, 400, 500, 600, 700, 800, 900],
};

export function formatJsonOutput(result: PaletteResult): string {
  return JSON.stringify(result, null, 2);
}

export function formatPlainHexOutput(result: PaletteResult): string {
  const colorLabels = STEP_LABELS[result.config.colorSteps];
  const neutralLabels = STEP_LABELS[result.config.neutralSteps];
  const colorGroups: string[] = [];

  for (let start = 0; start < result.colors.length; start += result.config.colorSteps) {
    const colors = [...result.colors.slice(start, start + result.config.colorSteps)].reverse();
    colorGroups.push([
      `Scale ${colorGroups.length + 1}`,
      ...colors.map((hex, index) => `  ${String(colorLabels[index]).padStart(3)}  ${hex}`),
    ].join("\n"));
  }

  return [
    "Color scales",
    colorGroups.join("\n\n"),
    "",
    "Neutral scale",
    ...result.neutrals.map((hex, index) => (
      `  ${String(neutralLabels[index]).padStart(3)}  ${hex}`
    )),
  ].join("\n");
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
