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

  it.each([
    ["hex", /^Colors\n/],
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

  it("reports invalid arguments on stderr with a non-zero status", () => {
    const result = runCli(["generate", "--harmony", "square"]);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Invalid harmony: square");
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
