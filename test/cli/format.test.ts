import { describe, expect, it } from "vitest";
import { generatePalette } from "../../src/core/generate.js";
import { formatHexOutput, formatJsonOutput } from "../../src/cli/output.js";
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
    expect(preview).toContain("Base color: #2563EB");
    expect(preview).not.toContain("\u001B[");
  });

  it("formats HEX lists", () => {
    expect(formatHexOutput(result)).toContain("Colors");
    expect(formatHexOutput(result)).toContain("Neutrals");
    expect(formatHexOutput(result)).not.toContain("\u001B[");
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
});
