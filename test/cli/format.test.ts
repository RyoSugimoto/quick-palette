import { describe, expect, it } from "vitest";
import { generatePalette } from "../../src/core/generate.js";
import { formatCssOutput, formatHexOutput, formatJsonOutput } from "../../src/cli/output.js";
import { formatPreview } from "../../src/cli/preview.js";

const result = generatePalette({
  baseColor: "#2563EB",
  harmony: "analogous",
  neutralMode: "tinted",
  colorSteps: 3,
  neutralSteps: 3,
});

describe("CLI formatting", () => {
  it("formats a color-free English preview", () => {
    const preview = formatPreview(result, false);
    expect(preview).toContain("Palette preview");
    expect(preview).toContain("Starting color: #2563EB");
    expect(preview).not.toContain("\u001B[");
  });

  it("formats HEX lists", () => {
    const output = formatHexOutput(result);
    expect(output).toContain("Color scales");
    expect(output).toContain("Scale 1");
    expect(output).toContain("Scale 2");
    expect(output).toContain("Scale 3");
    expect(output).toContain("Neutral scale");
    expect(output).not.toContain("\u001B[");
  });

  it("labels terminal scales from light to dark", () => {
    const output = formatHexOutput(result);
    expect(output.indexOf(`100  ${result.colors[2]}`))
      .toBeLessThan(output.indexOf(`900  ${result.colors[0]}`));
    expect(output.indexOf(`100  ${result.neutrals[0]}`))
      .toBeLessThan(output.indexOf(`900  ${result.neutrals[2]}`));
  });

  it("adds color swatches to HEX lists when color is enabled", () => {
    const output = formatHexOutput(result, true);
    expect(output).toContain("\u001B[48;2;");
    expect(output).toContain(result.colors[0]);
    expect(output).toContain(result.neutrals[0]);
  });

  it("formats parseable JSON", () => {
    expect(JSON.parse(formatJsonOutput(result))).toEqual(result);
  });

  it.each([
    [3, [100, 500, 900]],
    [5, [100, 300, 500, 700, 900]],
    [7, [100, 200, 300, 500, 700, 800, 900]],
    [9, [100, 200, 300, 400, 500, 600, 700, 800, 900]],
  ] as const)("uses CSS lightness labels for %i steps", (steps, labels) => {
    const palette = generatePalette({ ...result.config, harmony: "monochrome", colorSteps: steps, neutralSteps: steps });
    const css = formatCssOutput(palette);
    expect(labels.map((label) => css.includes(`--palette-color-1-${label}:`))).toEqual(labels.map(() => true));
    expect(labels.map((label) => css.includes(`--palette-neutral-${label}:`))).toEqual(labels.map(() => true));
  });

  it("maps dark-first colors and light-first neutrals to light-to-dark CSS labels", () => {
    const css = formatCssOutput(result);
    expect(css).toContain(`--palette-color-1-100: ${result.colors[2]};`);
    expect(css).toContain(`--palette-color-1-900: ${result.colors[0]};`);
    expect(css).toContain(`--palette-neutral-100: ${result.neutrals[0]};`);
    expect(css).toContain(`--palette-neutral-900: ${result.neutrals[2]};`);
  });

  it("keeps harmony hues in separate CSS groups", () => {
    const css = formatCssOutput(result);
    expect(css).toContain(`--palette-color-1-100: ${result.colors[2]};`);
    expect(css).toContain(`--palette-color-2-100: ${result.colors[5]};`);
    expect(css).toContain(`--palette-color-3-100: ${result.colors[8]};`);
  });

  it("formats a complete CSS root block with a trailing newline", () => {
    const css = formatCssOutput(result);
    expect(css).toMatch(/^:root \{\n/);
    expect(css).toMatch(/;\n\}\n$/);
  });
});
