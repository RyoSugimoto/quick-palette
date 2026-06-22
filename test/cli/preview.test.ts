import { describe, expect, it } from "vitest";
import { formatPreview } from "../../apps/cli/src/preview.js";
import { generatePalette } from "../../packages/core/src/generate.js";

describe("palette preview", () => {
  it("shows human-readable palette metadata", () => {
    const result = generatePalette({
      baseColor: "#2563EB",
      harmony: "analogous",
      harmonyTuning: "ui",
      neutralMode: "neutral",
      colorSteps: 3,
      neutralSteps: 3,
    });
    const preview = formatPreview(result, false);
    expect(preview).toContain("Starting color: #2563EB");
    expect(preview).toContain("Color relationship: Neighboring colors");
    expect(preview).toContain("Color balance: Subtle for interfaces");
    expect(preview).toContain("Gray style: Pure gray");
  });

  it("hides irrelevant harmony adjustment for monochrome", () => {
    const result = generatePalette({
      baseColor: "#2563EB",
      harmony: "monochrome",
      neutralMode: "neutral",
      colorSteps: 3,
      neutralSteps: 3,
    });
    const preview = formatPreview(result, false);
    expect(preview).toContain("Color relationship: Single color");
    expect(preview).not.toContain("Color balance:");
  });

  it("shows only non-default final adjustments", () => {
    const defaults = formatPreview(generatePalette({
      baseColor: "#2563EB",
      harmony: "analogous",
      neutralMode: "neutral",
      colorSteps: 3,
      neutralSteps: 3,
      adjustments: { analogousSpread: 30, hueRotation: 0, chromaScale: 1 },
    }), false);
    expect(defaults).not.toContain("Color spacing:");
    expect(defaults).not.toContain("Hue shift:");
    expect(defaults).not.toContain("Color intensity:");

    const adjusted = formatPreview(generatePalette({
      baseColor: "#2563EB",
      harmony: "analogous",
      neutralMode: "neutral",
      colorSteps: 3,
      neutralSteps: 3,
      adjustments: { analogousSpread: 45, hueRotation: 15, chromaScale: 0.75 },
    }), false);
    expect(adjusted).toContain("Color spacing: 45deg");
    expect(adjusted).toContain("Hue shift: +15deg");
    expect(adjusted).toContain("Color intensity: 0.75x");
  });
});
