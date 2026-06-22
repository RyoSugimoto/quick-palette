import { performance } from "node:perf_hooks";
import { hexToOklch, normalizeHue } from "../src/color.js";
import { HUE_OFFSETS, PERCEPTUAL_HUE_SHIFTS } from "../src/constants.js";
import { tuneHarmonyHues } from "../src/perceptual-harmony.js";
import type { HarmonyMode } from "../src/types.js";

const SAMPLE_COUNT = 100;
const PENTADIC_P95_LIMIT_MS = 200;
const harmonies = ["triadic", "tetradic", "pentadic"] as const;

console.log("Harmony tuning benchmark");
console.log(`Samples per harmony: ${SAMPLE_COUNT}`);

for (const harmony of harmonies) {
  const input = createInput(harmony);
  for (let index = 0; index < 5; index += 1) tuneHarmonyHues(input);

  const durations = Array.from({ length: SAMPLE_COUNT }, () => {
    const start = performance.now();
    tuneHarmonyHues(input);
    return performance.now() - start;
  }).sort((left, right) => left - right);
  const average = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  const p95 = durations[Math.ceil(durations.length * 0.95) - 1] ?? 0;

  console.log([
    harmony.padEnd(9),
    `hues=${HUE_OFFSETS[harmony].length}`,
    `max-evaluations=${maximumEvaluationCount(harmony)}`,
    `average=${average.toFixed(2)}ms`,
    `p95=${p95.toFixed(2)}ms`,
  ].join("  "));

  if (harmony === "pentadic" && p95 > PENTADIC_P95_LIMIT_MS) {
    throw new Error(`Pentadic tuning p95 ${p95.toFixed(2)}ms exceeds ${PENTADIC_P95_LIMIT_MS}ms.`);
  }
}

function createInput(harmony: HarmonyMode) {
  const base = hexToOklch("#2563EB");
  return {
    base,
    harmony,
    mechanicalHues: HUE_OFFSETS[harmony].map((offset) => normalizeHue(base.h + offset)),
    purpose: "data-visualization" as const,
  };
}

function maximumEvaluationCount(harmony: HarmonyMode): number {
  const adjustableCount = HUE_OFFSETS[harmony].length - 1;
  if (adjustableCount <= 2) return PERCEPTUAL_HUE_SHIFTS.length ** adjustableCount;
  return 3 * adjustableCount * (PERCEPTUAL_HUE_SHIFTS.length + 1);
}
