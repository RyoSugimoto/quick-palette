import {
  MAX_ANALOGOUS_SPREAD,
  MAX_CHROMA_SCALE,
  MAX_HUE_ROTATION,
  MIN_ANALOGOUS_SPREAD,
  MIN_CHROMA_SCALE,
  MIN_HUE_ROTATION,
} from "@quick-palette/core";
import { resolvePaletteConfig } from "@quick-palette/core";
import { isValidHex, normalizeHex } from "@quick-palette/core";
import {
  HARMONY_MODES,
  HARMONY_TUNINGS,
  NEUTRAL_MODES,
  STEP_COUNTS,
  type HarmonyMode,
  type PaletteAdjustments,
  type PaletteConfig,
  type StepCount,
} from "@quick-palette/core";

export interface ParsedUrlState {
  readonly mode: "explore" | "configure";
  readonly seed?: string;
  readonly config: PaletteConfig;
  readonly warning?: string;
}

export function parseUrlState(search: string): ParsedUrlState {
  const params = new URLSearchParams(search);
  const requestedMode = params.get("mode");
  const mode = requestedMode === "configure" ? "configure" : "explore";
  const seed = params.get("seed")?.trim() || undefined;

  try {
    const seeded = resolvePaletteConfig(seed === undefined ? {} : { seed });
    if (mode === "explore") {
      return { mode, ...(seed === undefined ? {} : { seed }), config: seeded };
    }

    const base = params.get("base");
    if (base !== null && !isValidHex(base)) throw new Error("The shared base color is invalid.");
    const harmony = parseChoice(params.get("harmony"), HARMONY_MODES, "harmony");
    const tuning = parseChoice(params.get("tuning"), HARMONY_TUNINGS, "tuning");
    const neutral = parseChoice(params.get("neutral"), NEUTRAL_MODES, "neutral mode");
    const colorSteps = parseStep(params.get("colorSteps"), "color steps");
    const neutralSteps = parseStep(params.get("neutralSteps"), "neutral steps");
    const adjustments = parseAdjustments(params, harmony ?? seeded.harmony);

    const config: PaletteConfig = {
      ...seeded,
      ...(base === null ? {} : { baseColor: normalizeHex(base) }),
      ...(harmony === undefined ? {} : { harmony }),
      ...(tuning === undefined ? {} : { harmonyTuning: tuning }),
      ...(neutral === undefined ? {} : { neutralMode: neutral }),
      ...(colorSteps === undefined ? {} : { colorSteps }),
      ...(neutralSteps === undefined ? {} : { neutralSteps }),
      ...(adjustments === undefined ? {} : { adjustments }),
    };
    return {
      mode,
      ...(seed === undefined ? {} : { seed }),
      config: normalizeDependentFields(config),
    };
  } catch (error) {
    return {
      mode,
      config: resolvePaletteConfig(),
      warning: error instanceof Error ? error.message : "The shared settings are invalid.",
    };
  }
}

export function serializeUrlState(
  mode: "explore" | "configure",
  config: PaletteConfig,
  seed?: string,
): string {
  const params = new URLSearchParams();
  if (mode === "explore") {
    if (seed) params.set("seed", seed);
  } else {
    params.set("mode", "configure");
    params.set("base", config.baseColor);
    params.set("harmony", config.harmony);
    if (config.harmony !== "monochrome") {
      params.set("tuning", config.harmonyTuning ?? "mechanical");
    }
    params.set("neutral", config.neutralMode);
    params.set("colorSteps", String(config.colorSteps));
    params.set("neutralSteps", String(config.neutralSteps));
    if (config.harmony === "analogous" && config.adjustments?.analogousSpread !== undefined) {
      params.set("spread", String(config.adjustments.analogousSpread));
    }
    if (config.adjustments?.hueRotation !== undefined) {
      params.set("hue", String(config.adjustments.hueRotation));
    }
    if (config.adjustments?.chromaScale !== undefined) {
      params.set("chroma", String(config.adjustments.chromaScale));
    }
  }
  const query = params.toString();
  return query.length === 0 ? window.location.pathname : `${window.location.pathname}?${query}`;
}

export function normalizeDependentFields(config: PaletteConfig): PaletteConfig {
  const adjustments = config.harmony === "analogous"
    ? config.adjustments
    : withoutAnalogousSpread(config.adjustments);
  const { adjustments: _adjustments, ...withoutAdjustments } = config;
  return {
    ...withoutAdjustments,
    harmonyTuning: config.harmony === "monochrome"
      ? "mechanical"
      : (config.harmonyTuning ?? "mechanical"),
    ...(adjustments === undefined ? {} : { adjustments }),
  };
}

function parseChoice<const Values extends readonly string[]>(
  value: string | null,
  values: Values,
  label: string,
): Values[number] | undefined {
  if (value === null) return undefined;
  if ((values as readonly string[]).includes(value)) return value as Values[number];
  throw new Error(`The shared ${label} is invalid.`);
}

function parseStep(value: string | null, label: string): StepCount | undefined {
  if (value === null) return undefined;
  const parsed = Number(value);
  if ((STEP_COUNTS as readonly number[]).includes(parsed)) return parsed as StepCount;
  throw new Error(`The shared ${label} are invalid.`);
}

function parseAdjustments(
  params: URLSearchParams,
  harmony: HarmonyMode,
): PaletteAdjustments | undefined {
  const analogousSpread = parseNumber(
    params.get("spread"), "analogous spread", MIN_ANALOGOUS_SPREAD, MAX_ANALOGOUS_SPREAD,
  );
  if (analogousSpread !== undefined && harmony !== "analogous") {
    throw new Error("Shared analogous spacing requires analogous harmony.");
  }
  const hueRotation = parseNumber(
    params.get("hue"), "hue rotation", MIN_HUE_ROTATION, MAX_HUE_ROTATION,
  );
  const chromaScale = parseNumber(
    params.get("chroma"), "chroma scale", MIN_CHROMA_SCALE, MAX_CHROMA_SCALE,
  );
  const adjustments = {
    ...(analogousSpread === undefined ? {} : { analogousSpread }),
    ...(hueRotation === undefined ? {} : { hueRotation }),
    ...(chromaScale === undefined ? {} : { chromaScale }),
  };
  return Object.keys(adjustments).length === 0 ? undefined : adjustments;
}

function parseNumber(
  value: string | null,
  label: string,
  min: number,
  max: number,
): number | undefined {
  if (value === null) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`The shared ${label} is invalid.`);
  }
  return parsed;
}

function withoutAnalogousSpread(
  adjustments: PaletteAdjustments | undefined,
): PaletteAdjustments | undefined {
  if (adjustments?.analogousSpread === undefined) return adjustments;
  const { analogousSpread: _spread, ...remaining } = adjustments;
  return Object.keys(remaining).length === 0 ? undefined : remaining;
}
