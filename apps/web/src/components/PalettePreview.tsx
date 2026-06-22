import { STEP_LABELS } from "@quick-palette/format";
import type { PaletteResult } from "@quick-palette/core";

interface PalettePreviewProps {
  readonly result: PaletteResult;
  readonly seed?: string | undefined;
  readonly onCopy: (value: string, label: string) => void;
}

export function PalettePreview({ result, seed, onCopy }: PalettePreviewProps) {
  const groups: string[][] = [];
  for (let start = 0; start < result.colors.length; start += result.config.colorSteps) {
    groups.push([...result.colors.slice(start, start + result.config.colorSteps)].reverse());
  }

  return (
    <section class="preview" id="palette-preview" aria-labelledby="preview-heading">
      <div class="section-heading preview-heading">
        <div>
          <p class="eyebrow">Output</p>
          <h2 id="preview-heading">Palette preview</h2>
        </div>
        {seed && <p class="seed-label">Seed <code>{seed}</code></p>}
      </div>

      <dl class="config-summary">
        <div><dt>Base</dt><dd>{result.config.baseColor}</dd></div>
        <div><dt>Harmony</dt><dd>{result.config.harmony}</dd></div>
        <div><dt>Tuning</dt><dd>{result.config.harmonyTuning ?? "mechanical"}</dd></div>
        <div><dt>Neutrals</dt><dd>{result.config.neutralMode}</dd></div>
      </dl>

      <div class="scale-list">
        {groups.map((colors, groupIndex) => (
          <PaletteScale
            key={`color-${groupIndex + 1}`}
            title={`Color scale ${groupIndex + 1}`}
            colors={colors}
            labels={STEP_LABELS[result.config.colorSteps]}
            onCopy={onCopy}
          />
        ))}
        <PaletteScale
          title="Neutral scale"
          colors={result.neutrals}
          labels={STEP_LABELS[result.config.neutralSteps]}
          onCopy={onCopy}
        />
      </div>
    </section>
  );
}

interface PaletteScaleProps {
  readonly title: string;
  readonly colors: readonly string[];
  readonly labels: readonly number[];
  readonly onCopy: (value: string, label: string) => void;
}

function PaletteScale({ title, colors, labels, onCopy }: PaletteScaleProps) {
  return (
    <section class="scale" aria-label={title}>
      <h3>{title}</h3>
      <div class="swatch-list">
        {colors.map((hex, index) => (
          <div class="swatch-row" key={`${labels[index]}-${hex}`}>
            <div class="swatch" style={{ backgroundColor: hex }} aria-hidden="true" />
            <span class="step-label">{labels[index]}</span>
            <code>{hex}</code>
            <button type="button" onClick={() => onCopy(hex, hex)}>Copy</button>
          </div>
        ))}
      </div>
    </section>
  );
}
