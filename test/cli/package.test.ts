import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const packageRoot = join(projectRoot, "apps", "cli");
const temporaryDirectory = mkdtempSync(join(tmpdir(), "color-palette-package-"));
const manifest = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8")) as {
  readonly name: string;
  readonly version: string;
  readonly bin: Record<string, string>;
};

afterAll(() => {
  rmSync(temporaryDirectory, { recursive: true, force: true });
});

describe("packed CLI", () => {
  it("installs and runs independently of the repository checkout", () => {
    const pack = spawnSync(
      "pnpm",
      ["pack", "--pack-destination", temporaryDirectory],
      { cwd: packageRoot, encoding: "utf8", timeout: 30_000 },
    );
    expect(pack.status, pack.stderr).toBe(0);

    const tarballName = `${manifest.name.replace(/^@/, "").replace("/", "-")}-${manifest.version}.tgz`;
    const tarball = join(temporaryDirectory, tarballName);
    expect(existsSync(tarball)).toBe(true);

    writeFileSync(join(temporaryDirectory, "package.json"), JSON.stringify({ private: true }));
    const install = spawnSync(
      "pnpm",
      ["add", "--offline", tarball],
      { cwd: temporaryDirectory, encoding: "utf8", timeout: 30_000 },
    );
    expect(install.status, `${install.stdout}\n${install.stderr}`).toBe(0);

    const installedPackage = join(temporaryDirectory, "node_modules", ...manifest.name.split("/"));
    const [binName, binPath] = Object.entries(manifest.bin)[0] ?? [];
    expect(binName).toBeDefined();
    expect(binPath).toBeDefined();
    const executable = join(temporaryDirectory, "node_modules", ".bin", binName as string);
    const result = spawnSync(
      executable,
      ["generate", "--seed", "8f3a21c4", "--format", "json"],
      { cwd: temporaryDirectory, encoding: "utf8", timeout: 10_000 },
    );

    expect(result.status, result.stderr).toBe(0);
    expect(() => JSON.parse(result.stdout)).not.toThrow();
    expect(existsSync(join(installedPackage, "src"))).toBe(false);
    expect(existsSync(join(installedPackage, "test"))).toBe(false);
    expect(readFileSync(join(installedPackage, binPath as string), "utf8"))
      .toMatch(/^#!\/usr\/bin\/env node/);
  }, 60_000);
});
