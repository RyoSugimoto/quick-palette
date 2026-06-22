import {
  DEFAULT_ANALOGOUS_SPREAD,
  DEFAULT_CHROMA_SCALE,
  DEFAULT_HUE_ROTATION,
  MAX_ANALOGOUS_SPREAD,
  MAX_CHROMA_SCALE,
  MAX_HUE_ROTATION,
  MIN_ANALOGOUS_SPREAD,
  MIN_CHROMA_SCALE,
  MIN_HUE_ROTATION,
} from "@quick-palette/core";
import {
  HARMONY_MODES,
  HARMONY_TUNINGS,
  NEUTRAL_MODES,
  STEP_COUNTS,
  type HarmonyMode,
  type HarmonyTuning,
  type NeutralMode,
  type PaletteAdjustments,
  type PaletteConfig,
  type StepCount,
} from "@quick-palette/core";

interface ConfigPanelProps {
  readonly config: PaletteConfig;
  readonly draftBaseColor: string;
  readonly baseColorError?: string | undefined;
  readonly onConfigChange: (config: PaletteConfig) => void;
  readonly onBaseDraftChange: (value: string) => void;
  readonly onBaseCommit: (value: string) => void;
}

const HARMONY_LABELS: Readonly<Record<HarmonyMode, string>> = {
  monochrome: "Single color",
  analogous: "Neighboring colors",
  complementary: "Opposite colors",
  triadic: "Three-color balance",
  tetradic: "Four-color contrast",
  pentadic: "Five-color range",
};

const TUNING_LABELS: Readonly<Record<HarmonyTuning, string>> = {
  mechanical: "Exact spacing",
  ui: "Interfaces",
  branding: "Branding",
  "data-visualization": "Charts",
};

export function ConfigPanel(props: ConfigPanelProps) {
  const { config } = props;
  const adjustment = <Key extends keyof PaletteAdjustments>(
    key: Key,
    value: PaletteAdjustments[Key],
  ) => props.onConfigChange({
    ...config,
    adjustments: { ...config.adjustments, [key]: value },
  });

  return (
    <section class="panel" aria-labelledby="configure-heading">
      <div class="section-heading">
        <p class="eyebrow">Configure</p>
        <h2 id="configure-heading">Build your palette</h2>
        <p>Every valid change updates the preview immediately.</p>
      </div>

      <form class="config-form">
        <fieldset>
          <legend>Starting color</legend>
          <div class="base-color-fields">
            <input
              class="color-input"
              type="color"
              aria-label="Choose starting color"
              value={config.baseColor}
              onInput={(event) => props.onBaseCommit(event.currentTarget.value)}
            />
            <div class="field-group">
              <label for="base-color">HEX color</label>
              <input
                id="base-color"
                value={props.draftBaseColor}
                aria-invalid={Boolean(props.baseColorError)}
                aria-describedby={props.baseColorError ? "base-color-error" : undefined}
                onInput={(event) => props.onBaseDraftChange(event.currentTarget.value)}
                onBlur={(event) => props.onBaseCommit(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  props.onBaseCommit(event.currentTarget.value);
                }}
                autocomplete="off"
                spellcheck={false}
              />
              {props.baseColorError && <p class="field-error" id="base-color-error">{props.baseColorError}</p>}
            </div>
          </div>
        </fieldset>

        <SelectField
          id="harmony"
          label="Color relationship"
          value={config.harmony}
          onChange={(value) => props.onConfigChange({ ...config, harmony: value as HarmonyMode })}
          options={HARMONY_MODES.map((value) => ({ value, label: HARMONY_LABELS[value] }))}
        />

        <SelectField
          id="tuning"
          label="Color balance"
          value={config.harmonyTuning ?? "mechanical"}
          disabled={config.harmony === "monochrome"}
          onChange={(value) => props.onConfigChange({ ...config, harmonyTuning: value as HarmonyTuning })}
          options={HARMONY_TUNINGS.map((value) => ({ value, label: TUNING_LABELS[value] }))}
          note={config.harmony === "monochrome" ? "Single-color palettes use exact spacing." : undefined}
        />

        <SelectField
          id="neutral"
          label="Neutral scale"
          value={config.neutralMode}
          onChange={(value) => props.onConfigChange({ ...config, neutralMode: value as NeutralMode })}
          options={NEUTRAL_MODES.map((value) => ({
            value,
            label: value === "neutral" ? "Pure gray" : "Tinted gray",
          }))}
        />

        <div class="field-pair">
          <SelectField
            id="color-steps"
            label="Color steps"
            value={String(config.colorSteps)}
            onChange={(value) => props.onConfigChange({ ...config, colorSteps: Number(value) as StepCount })}
            options={STEP_COUNTS.map((value) => ({ value: String(value), label: String(value) }))}
          />
          <SelectField
            id="neutral-steps"
            label="Neutral steps"
            value={String(config.neutralSteps)}
            onChange={(value) => props.onConfigChange({ ...config, neutralSteps: Number(value) as StepCount })}
            options={STEP_COUNTS.map((value) => ({ value: String(value), label: String(value) }))}
          />
        </div>

        <fieldset>
          <legend>Fine tuning</legend>
          {config.harmony === "analogous" && (
            <RangeField
              id="spread"
              label="Analogous spacing"
              value={config.adjustments?.analogousSpread ?? DEFAULT_ANALOGOUS_SPREAD}
              min={MIN_ANALOGOUS_SPREAD}
              max={MAX_ANALOGOUS_SPREAD}
              step={1}
              suffix="deg"
              onChange={(value) => adjustment("analogousSpread", value)}
            />
          )}
          <RangeField
            id="hue"
            label="Hue shift"
            value={config.adjustments?.hueRotation ?? DEFAULT_HUE_ROTATION}
            min={MIN_HUE_ROTATION}
            max={MAX_HUE_ROTATION}
            step={1}
            suffix="deg"
            onChange={(value) => adjustment("hueRotation", value)}
          />
          <RangeField
            id="chroma"
            label="Color intensity"
            value={config.adjustments?.chromaScale ?? DEFAULT_CHROMA_SCALE}
            min={MIN_CHROMA_SCALE}
            max={MAX_CHROMA_SCALE}
            step={0.05}
            suffix="x"
            onChange={(value) => adjustment("chromaScale", value)}
          />
        </fieldset>
      </form>

      <a class="text-link" href="#palette-preview">View palette</a>
    </section>
  );
}

interface SelectFieldProps {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly disabled?: boolean | undefined;
  readonly note?: string | undefined;
  readonly onChange: (value: string) => void;
}

function SelectField(props: SelectFieldProps) {
  return (
    <div class="field-group">
      <label for={props.id}>{props.label}</label>
      <select
        id={props.id}
        value={props.value}
        disabled={props.disabled}
        onChange={(event) => props.onChange(event.currentTarget.value)}
      >
        {props.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {props.note && <p class="field-note">{props.note}</p>}
    </div>
  );
}

interface RangeFieldProps {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly suffix: string;
  readonly onChange: (value: number) => void;
}

function RangeField(props: RangeFieldProps) {
  return (
    <div class="field-group range-field">
      <label for={props.id}>{props.label} <output>{props.value}{props.suffix}</output></label>
      <input
        id={props.id}
        type="range"
        value={props.value}
        min={props.min}
        max={props.max}
        step={props.step}
        onInput={(event) => props.onChange(Number(event.currentTarget.value))}
      />
    </div>
  );
}
