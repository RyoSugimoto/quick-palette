import type { HarmonyMode, HarmonyTuning } from "../../src/core/types.js";

interface PerceptualHarmonyFixture {
  readonly baseColor: string;
  readonly harmony: HarmonyMode;
  readonly middleColors: Readonly<Record<HarmonyTuning, readonly string[]>>;
}

export const PERCEPTUAL_HARMONY_FIXTURES: readonly PerceptualHarmonyFixture[] = [
  {
    baseColor: "#2563EB",
    harmony: "analogous",
    middleColors: {
      mechanical: ["#0993C7", "#427FFF", "#9163FB"],
      ui: ["#078EDE", "#427FFF", "#9163FB"],
      branding: ["#078EDE", "#427FFF", "#A75AED"],
      "data-visualization": ["#0896B7", "#427FFF", "#A75AED"],
    },
  },
  {
    baseColor: "#FF00FF",
    harmony: "triadic",
    middleColors: {
      mechanical: ["#CA47C8", "#A78208", "#0B99A9"],
      ui: ["#CA47C8", "#A78208", "#0B99A9"],
      branding: ["#CA47C8", "#B37B05", "#0197B7"],
      "data-visualization": ["#CA47C8", "#B37B05", "#0197B7"],
    },
  },
  {
    baseColor: "#DC2626",
    harmony: "triadic",
    middleColors: {
      mechanical: ["#EE3B36", "#04A33D", "#537BFE"],
      ui: ["#EE3B36", "#07A41A", "#537BFE"],
      branding: ["#EE3B36", "#07A41A", "#0984FF"],
      "data-visualization": ["#EE3B36", "#07A41A", "#537BFE"],
    },
  },
  {
    baseColor: "#CA8A04",
    harmony: "analogous",
    middleColors: {
      mechanical: ["#CC6834", "#B47B05", "#938C04"],
      ui: ["#CC6834", "#B47B05", "#8E8E00"],
      branding: ["#CF634B", "#B47B05", "#81920C"],
      "data-visualization": ["#CF634B", "#B47B05", "#81920C"],
    },
  },
  {
    baseColor: "#0F766E",
    harmony: "analogous",
    middleColors: {
      mechanical: ["#5A9772", "#3F9890", "#4095A9"],
      ui: ["#5A9772", "#3F9890", "#4095A9"],
      branding: ["#679567", "#3F9890", "#4992B1"],
      "data-visualization": ["#679567", "#3F9890", "#4992B1"],
    },
  },
  {
    baseColor: "#808080",
    harmony: "triadic",
    middleColors: {
      mechanical: ["#878787", "#878787", "#878787"],
      ui: ["#878787", "#878787", "#878787"],
      branding: ["#878787", "#878787", "#878787"],
      "data-visualization": ["#878787", "#878787", "#878787"],
    },
  },
] as const;
