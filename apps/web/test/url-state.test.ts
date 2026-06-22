import { DEFAULT_PALETTE_CONFIG } from "@quick-palette/core";
import { describe, expect, it } from "vitest";
import { parseUrlState, serializeUrlState } from "../src/url-state.js";

describe("URL state", () => {
  it("round-trips supported configured fields", () => {
    const config = {
      ...DEFAULT_PALETTE_CONFIG,
      baseColor: "#AABBCC",
      harmony: "tetradic" as const,
      harmonyTuning: "branding" as const,
      neutralMode: "tinted" as const,
      colorSteps: 9 as const,
      neutralSteps: 7 as const,
      adjustments: { hueRotation: 15, chromaScale: 0.75 },
    };

    const parsed = parseUrlState(new URL(serializeUrlState("configure", config), location.origin).search);
    expect(parsed).toEqual({ mode: "configure", config });
  });

  it("falls back with a concise warning for invalid supported fields", () => {
    const parsed = parseUrlState("?mode=configure&base=bad");
    expect(parsed.config).toEqual(DEFAULT_PALETTE_CONFIG);
    expect(parsed.warning).toBe("The shared base color is invalid.");
  });

  it("ignores unknown fields", () => {
    const parsed = parseUrlState("?unknown=value");
    expect(parsed.mode).toBe("explore");
    expect(parsed.warning).toBeUndefined();
  });
});
