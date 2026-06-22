import { describe, expect, it } from "vitest";
import { assertSupportedNodeVersion } from "../../apps/cli/src/node-version.js";

describe("Node.js version requirement", () => {
  it.each(["22.0.0", "24.1.0", "26.3.0"])("accepts supported version %s", (version) => {
    expect(() => assertSupportedNodeVersion(version)).not.toThrow();
  });

  it.each(["20.20.0", "18.0.0", "unknown"])("explains unsupported version %s", (version) => {
    expect(() => assertSupportedNodeVersion(version)).toThrow(
      `Node.js 22 or later is required (current: ${version}).`,
    );
  });
});
