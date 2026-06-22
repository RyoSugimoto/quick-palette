import { useMemo, useState } from "preact/hooks";
import {
  formatCssOutput,
  formatJsonOutput,
  formatPlainHexOutput,
} from "@quick-palette/format";
import type { PaletteResult } from "@quick-palette/core";
import { copyText, downloadText } from "../export.js";

type ExportFormat = "hex" | "json" | "css";

interface ExportPanelProps {
  readonly result: PaletteResult;
}

export function ExportPanel({ result }: ExportPanelProps) {
  const [format, setFormat] = useState<ExportFormat>("css");
  const [status, setStatus] = useState<string>();
  const content = useMemo(() => {
    if (format === "json") return formatJsonOutput(result);
    if (format === "css") return formatCssOutput(result);
    return formatPlainHexOutput(result);
  }, [format, result]);

  const download = () => {
    if (format === "hex") return;
    const filename = format === "json" ? "quick-palette.json" : "quick-palette.css";
    const type = format === "json" ? "application/json;charset=utf-8" : "text/css;charset=utf-8";
    try {
      downloadText(filename, `${content.trimEnd()}\n`, type);
      setStatus(`Downloaded ${filename}.`);
    } catch {
      setStatus("Could not create the download. Select the export text and save it manually.");
    }
  };

  const copy = async () => {
    try {
      await copyText(content);
      setStatus(`Copied ${format.toUpperCase()} output.`);
    } catch {
      setStatus("Could not access the clipboard. Select the export text and copy it manually.");
    }
  };

  return (
    <section class="export-panel" aria-labelledby="export-heading">
      <div class="section-heading">
        <p class="eyebrow">Export</p>
        <h2 id="export-heading">Use this palette</h2>
      </div>

      <div class="button-row" role="group" aria-label="Export format">
        {(["hex", "json", "css"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={format === value}
            onClick={() => {
              setFormat(value);
              setStatus(undefined);
            }}
          >
            {value.toUpperCase()}
          </button>
        ))}
      </div>

      <textarea aria-label={`${format.toUpperCase()} output`} value={content} readOnly rows={12} />

      <div class="button-row">
        <button class="primary-button" type="button" onClick={copy}>
          Copy {format.toUpperCase()}
        </button>
        {format !== "hex" && <button type="button" onClick={download}>Download file</button>}
      </div>
      {status && <p class="status" aria-live="polite">{status}</p>}
    </section>
  );
}
