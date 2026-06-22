import { useEffect, useMemo, useReducer } from "preact/hooks";
import { normalizeHex } from "@quick-palette/core";
import { generatePalette } from "@quick-palette/core";
import { ConfigPanel } from "./components/ConfigPanel.js";
import { ExplorePanel } from "./components/ExplorePanel.js";
import { ExportPanel } from "./components/ExportPanel.js";
import { PalettePreview } from "./components/PalettePreview.js";
import { ThemeControl } from "./components/ThemeControl.js";
import { copyText } from "./export.js";
import { appReducer, createInitialState } from "./state.js";
import { useTheme } from "./theme.js";
import { serializeUrlState } from "./url-state.js";

export function App() {
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialState);
  const [theme, setTheme] = useTheme();
  const result = useMemo(
    () => state.mode === "explore" ? state.candidate.result : generatePalette(state.config),
    [state.candidate, state.config, state.mode],
  );

  useEffect(() => {
    const url = serializeUrlState(
      state.mode,
      state.config,
      state.mode === "explore" ? state.candidate.seed : undefined,
    );
    window.history.replaceState(null, "", url);
  }, [state.candidate.seed, state.config, state.mode]);

  const copy = async (value: string, label: string) => {
    try {
      await copyText(value);
      dispatch({ type: "statusChanged", status: `Copied ${label}.` });
    } catch {
      dispatch({
        type: "statusChanged",
        status: "Could not access the clipboard. Select the export text and copy it manually.",
      });
    }
  };

  const commitBaseColor = (value: string) => {
    try {
      dispatch({ type: "baseCommitted", value: normalizeHex(value) });
    } catch {
      dispatch({ type: "baseRejected", message: "Enter #RGB or #RRGGBB." });
    }
  };

  return (
    <div class="app-shell">
      <header class="site-header">
        <a class="site-logo" href={window.location.pathname}>
          <p class="eyebrow">Balanced color scales, made easy</p>
          <h1>Quick Palette</h1>
        </a>
        <ThemeControl value={theme} onChange={setTheme} />
      </header>

      <nav class="mode-nav" aria-label="Palette mode">
        <button
          type="button"
          aria-pressed={state.mode === "explore"}
          onClick={() => dispatch({ type: "modeChanged", mode: "explore" })}
        >
          Explore
        </button>
        <button
          type="button"
          aria-pressed={state.mode === "configure"}
          onClick={() => dispatch({ type: "modeChanged", mode: "configure" })}
        >
          Configure
        </button>
      </nav>

      {state.warning && <p class="notice" role="status">{state.warning} Defaults were used.</p>}
      {state.status && <p class="status" aria-live="polite">{state.status}</p>}

      <main class="main-layout">
        <div class="controls-column">
          {state.mode === "explore" ? (
            <ExplorePanel
              seed={state.candidate.seed}
              seedError={state.seedError}
              onNext={() => dispatch({ type: "nextRequested" })}
              onSeed={(seed) => dispatch({ type: "seedSubmitted", seed })}
              onEdit={() => dispatch({ type: "candidateEditRequested" })}
            />
          ) : (
            <ConfigPanel
              config={state.config}
              draftBaseColor={state.draftBaseColor}
              baseColorError={state.baseColorError}
              onConfigChange={(config) => dispatch({ type: "configChanged", config })}
              onBaseDraftChange={(value) => dispatch({ type: "baseDraftChanged", value })}
              onBaseCommit={commitBaseColor}
            />
          )}
          <ExportPanel result={result} />
        </div>
        <PalettePreview
          result={result}
          seed={state.mode === "explore" ? state.candidate.seed : undefined}
          onCopy={copy}
        />
      </main>

      <footer>
        <p>Generated locally. No palette data leaves your browser.</p>
      </footer>
    </div>
  );
}
