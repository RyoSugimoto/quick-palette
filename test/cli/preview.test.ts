import { describe, expect, it } from "vitest";
import { formatPreview } from "../../src/cli/preview.js";
import { generatePalette } from "../../src/core/generate.js";

describe("palette preview", () => {
  it("shows the selected harmony tuning", () => {
    const result = generatePalette({
      baseColor: "#2563EB",
      harmony: "analogous",
      harmonyTuning: "ui",
      neutralMode: "neutral",
      colorSteps: 3,
      neutralSteps: 3,
    });
    expect(formatPreview(result, false)).toContain("Harmony tuning: ui");
  });

  it("labels omitted tuning as mechanical", () => {
    const result = generatePalette({
      baseColor: "#2563EB",
      harmony: "monochrome",
      neutralMode: "neutral",
      colorSteps: 3,
      neutralSteps: 3,
    });
    expect(formatPreview(result, false)).toContain("Harmony tuning: mechanical");
  });
});
