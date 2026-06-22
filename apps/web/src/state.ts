import {
  createPaletteCandidate,
  InvalidRandomSeedError,
  nextPaletteCandidate,
  type PaletteCandidate,
} from "@quick-palette/core";
import type { PaletteConfig } from "@quick-palette/core";
import { normalizeDependentFields, parseUrlState } from "./url-state.js";

export interface AppState {
  readonly mode: "explore" | "configure";
  readonly candidate: PaletteCandidate;
  readonly config: PaletteConfig;
  readonly draftBaseColor: string;
  readonly baseColorError?: string | undefined;
  readonly seedError?: string | undefined;
  readonly status?: string | undefined;
  readonly warning?: string | undefined;
}

export type AppAction =
  | { readonly type: "modeChanged"; readonly mode: AppState["mode"] }
  | { readonly type: "candidateEditRequested" }
  | { readonly type: "nextRequested" }
  | { readonly type: "seedSubmitted"; readonly seed: string }
  | { readonly type: "configChanged"; readonly config: PaletteConfig }
  | { readonly type: "baseDraftChanged"; readonly value: string }
  | { readonly type: "baseCommitted"; readonly value: string }
  | { readonly type: "baseRejected"; readonly message: string }
  | { readonly type: "statusChanged"; readonly status?: string };

export function createInitialState(): AppState {
  const parsed = parseUrlState(window.location.search);
  const candidate = createPaletteCandidate(parsed.seed);
  return {
    mode: parsed.mode,
    candidate,
    config: parsed.mode === "explore" ? candidate.config : parsed.config,
    draftBaseColor: parsed.mode === "explore" ? candidate.config.baseColor : parsed.config.baseColor,
    ...(parsed.warning === undefined ? {} : { warning: parsed.warning }),
  };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  if (action.type === "modeChanged") {
    return {
      ...state,
      mode: action.mode,
      draftBaseColor: state.config.baseColor,
      baseColorError: undefined,
      seedError: undefined,
      status: undefined,
    };
  }
  if (action.type === "candidateEditRequested") {
    return {
      ...state,
      mode: "configure",
      config: state.candidate.config,
      draftBaseColor: state.candidate.config.baseColor,
      baseColorError: undefined,
      seedError: undefined,
      status: undefined,
    };
  }
  if (action.type === "nextRequested") {
    const candidate = nextPaletteCandidate(state.candidate);
    return {
      ...state,
      mode: "explore",
      candidate,
      seedError: undefined,
      status: undefined,
    };
  }
  if (action.type === "seedSubmitted") {
    try {
      const candidate = createPaletteCandidate(action.seed);
      return {
        ...state,
        mode: "explore",
        candidate,
        seedError: undefined,
        status: `Loaded seed ${candidate.seed}.`,
      };
    } catch (error) {
      if (!(error instanceof InvalidRandomSeedError)) throw error;
      return {
        ...state,
        seedError: "Enter a non-empty seed.",
        status: undefined,
      };
    }
  }
  if (action.type === "configChanged") {
    const config = normalizeDependentFields(action.config);
    return { ...state, config, draftBaseColor: config.baseColor, status: undefined };
  }
  if (action.type === "baseDraftChanged") {
    return { ...state, draftBaseColor: action.value, baseColorError: undefined };
  }
  if (action.type === "baseCommitted") {
    return {
      ...state,
      config: { ...state.config, baseColor: action.value },
      draftBaseColor: action.value,
      baseColorError: undefined,
      status: undefined,
    };
  }
  if (action.type === "baseRejected") {
    return {
      ...state,
      draftBaseColor: state.config.baseColor,
      baseColorError: action.message,
    };
  }
  return { ...state, status: action.status };
}
