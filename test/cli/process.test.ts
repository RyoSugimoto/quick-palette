import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { generatePalette } from "../../src/core/generate.js";
import { generateRandomPaletteConfig } from "../../src/core/random.js";

const projectRoot = process.cwd();
const temporaryDirectories: string[] = [];
const expectAvailable = spawnSync("expect", ["-v"], { encoding: "utf8" }).status === 0;

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function runCli(args: readonly string[], input?: string) {
  return spawnSync(
    process.execPath,
    ["--import", "tsx", "src/cli/index.ts", ...args],
    { cwd: projectRoot, encoding: "utf8", timeout: 10_000, input },
  );
}

describe("CLI process", () => {
  it("prints help and exits successfully", () => {
    const result = runCli(["--help"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Usage:");
    expect(result.stderr).toBe("");
  });

  it("reproduces the exact palette for a displayed seed", () => {
    const seed = "8f3a21c4";
    const result = runCli(["generate", "--seed", seed, "--format", "json"]);
    const expected = generatePalette(generateRandomPaletteConfig({ seed }).config);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual(expected);
    expect(result.stdout).not.toContain("Choose");
    expect(result.stderr).toBe("");
  });

  it("applies final adjustments without changing unpinned seeded fields", () => {
    const seed = "0000007b";
    const original = generateRandomPaletteConfig({ seed });
    const adjustments = { analogousSpread: 45, hueRotation: 30, chromaScale: 0 };
    const result = runCli([
      "generate", "--seed", seed,
      "--harmony", "analogous",
      "--analogous-spread", "45",
      "--hue-rotation", "30",
      "--chroma-scale", "0",
      "--format", "json",
    ]);

    expect(result.status).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.config).toEqual({
      ...original.config,
      harmony: "analogous",
      adjustments,
    });
    expect(new Set(output.colors)).toHaveLength(output.config.colorSteps);
    expect(result.stderr).toBe("");
  });

  it.each([
    ["hex", /^Color scales\n/],
    ["json", /^\{\n/],
    ["css", /^:root \{\n/],
  ] as const)("writes prompt-free %s output to stdout", (format, pattern) => {
    const result = runCli(["generate", "--base", "#2563EB", "--format", format]);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(pattern);
    expect(result.stdout).not.toContain("Quick Palette");
    expect(result.stdout).not.toContain("Choose");
    expect(result.stderr).toBe("");
  });

  it("writes only to the selected output file", () => {
    const directory = mkdtempSync(join(tmpdir(), "quick-palette-"));
    temporaryDirectories.push(directory);
    const outputPath = join(directory, "palette.json");
    const result = runCli([
      "generate",
      "--seed", "8f3a21c4",
      "--format", "json",
      "--output", outputPath,
    ]);

    expect(result.status).toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe("");
    expect(() => JSON.parse(readFileSync(outputPath, "utf8"))).not.toThrow();
  });

  it.each([
    [["generate", "--harmony", "square"], 'Unknown harmony "square"', "Example: --harmony analogous"],
    [["generate", "--format"], "Missing value for --format", "Example: --format hex"],
    [["generate", "--hue-rotation", "181"], 'Invalid hue rotation "181"', "Example: --hue-rotation 15"],
    [["generate", "--harmony", "triadic", "--analogous-spread", "30"], "only works with --harmony analogous", "Example: --harmony analogous"],
  ] as const)("reports actionable argument errors for %j", (args, cause, example) => {
    const result = runCli(args);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(cause);
    expect(result.stderr).toContain(example);
    expect(result.stderr).toContain("--help");
  });

  it("returns to the accepted palette actions after backing out of export", () => {
    const result = runCli(["explore", "--seed", "8f3a21c4"], "\n2\n3\n\n");
    const acceptedPrompt = "Palette accepted. What would you like to do?";

    expect(result.status).toBe(0);
    expect(result.stdout.split(acceptedPrompt)).toHaveLength(3);
    expect(result.stderr).toBe("");
  });

  it.skipIf(!expectAvailable)("handles Ctrl+C through a real TTY", () => {
    const executable = `{${process.execPath.replaceAll("}", "\\}")}}`;
    const script = [
      "set timeout 10",
      `spawn ${executable} --import tsx src/cli/index.ts`,
      'expect "How would you like to start?"',
      'send "\\003"',
      'expect "Cancelled."',
      "expect eof",
      "set result [wait]",
      "exit [lindex $result 3]",
    ].join("\n");

    const result = spawnSync("expect", ["-c", script], {
      cwd: projectRoot,
      encoding: "utf8",
      timeout: 15_000,
    });

    expect(result.status, result.stderr).toBe(130);
    expect(result.stdout).toContain("Cancelled.");
  });
});
