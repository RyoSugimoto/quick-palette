import { describe, expect, it } from "vitest";
import { CliArgumentError, HELP_TEXT, parseCliArgs } from "../../src/cli/args.js";

describe("CLI argument parsing", () => {
  it("keeps no-argument startup interactive", () => {
    expect(parseCliArgs([])).toEqual({ name: "interactive" });
  });

  it("parses seeded exploration", () => {
    expect(parseCliArgs(["explore", "--seed", "8f3a21c4"]))
      .toEqual({ name: "explore", seed: "8f3a21c4" });
  });

  it("parses and normalizes generation options", () => {
    expect(parseCliArgs([
      "generate",
      "--base", "#abc",
      "--harmony", "triadic",
      "--tuning", "branding",
      "--neutral", "tinted",
      "--color-steps", "7",
      "--neutral-steps", "9",
      "--hue-rotation", "-15",
      "--chroma-scale", "0.75",
      "--format", "css",
      "--output", "palette.css",
    ])).toEqual({
      name: "generate",
      baseColor: "#AABBCC",
      harmony: "triadic",
      harmonyTuning: "branding",
      neutralMode: "tinted",
      colorSteps: 7,
      neutralSteps: 9,
      hueRotation: -15,
      chromaScale: 0.75,
      format: "css",
      outputPath: "palette.css",
    });
  });

  it.each([
    ["unknown"],
    ["configure", "--seed", "1"],
    ["explore", "--format", "json"],
    ["generate", "--harmony", "square"],
    ["generate", "--format", "yaml"],
    ["generate", "--color-steps", "4"],
    ["generate", "--seed"],
    ["generate", "--analogous-spread", "61"],
    ["generate", "--harmony", "triadic", "--analogous-spread", "30"],
    ["generate", "--hue-rotation", "Infinity"],
    ["generate", "--chroma-scale", "-0.1"],
    ["generate", "--format", "json", "--format", "css"],
  ])("rejects invalid arguments %j", (...args) => {
    expect(() => parseCliArgs(args)).toThrow(CliArgumentError);
  });

  it.each([
    [["generate", "--harmony", "square"], 'Unknown harmony "square"', "Example: --harmony analogous"],
    [["generate", "--format"], "Missing value for --format", "Example: --format hex"],
    [["generate", "--color-steps", "4"], 'Invalid color steps "4"', "Example: --color-steps 5"],
    [["generate", "--hue-rotation", "181"], 'Invalid hue rotation "181"', "Example: --hue-rotation 15"],
    [["generate", "--harmony", "triadic", "--analogous-spread", "30"], "only works with --harmony analogous", "Example: --harmony analogous"],
  ] as const)("explains how to fix invalid arguments", (args, cause, example) => {
    expect(() => parseCliArgs(args)).toThrow(expect.objectContaining({
      message: expect.stringContaining(cause),
    }));
    expect(() => parseCliArgs(args)).toThrow(expect.objectContaining({
      message: expect.stringContaining(example),
    }));
  });
});

describe("CLI help", () => {
  it.each(["Commands:", "Palette options:", "Fine tuning:", "Output:"])(
    "includes the %s section",
    (section) => expect(HELP_TEXT).toContain(section),
  );

  it.each([
    "explore", "configure", "generate",
    "monochrome (Single color)", "analogous (Neighboring colors)",
    "complementary (Opposite colors)", "triadic (Three-color balance)",
    "tetradic (Four-color contrast)", "pentadic (Five-color range)",
    "mechanical (Keep exact spacing)", "ui (Subtle for interfaces)",
    "branding (Bold for brands)", "data-visualization (Distinct for charts)",
    "neutral (Pure gray)", "tinted (Tinted gray)",
    "stdout", "--output",
  ])("documents %s", (value) => expect(HELP_TEXT).toContain(value));
});
