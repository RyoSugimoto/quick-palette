import {
  PERCEPTUAL_COLLAPSE_DISTANCE,
  PERCEPTUAL_HUE_SHIFTS,
  PERCEPTUAL_MIN_DISTANCE,
  PERCEPTUAL_REPRESENTATIVE_LIGHTNESS,
  PERCEPTUAL_SCORING_WEIGHTS,
} from "./constants.js";
import { mapToSrgb, normalizeHue } from "./color.js";
import type { HarmonyMode, HarmonyTuning, OklchColor } from "./types.js";

type PerceptualPurpose = Exclude<HarmonyTuning, "mechanical">;

export interface TuneHarmonyInput {
  readonly base: OklchColor;
  readonly harmony: HarmonyMode;
  readonly mechanicalHues: readonly number[];
  readonly purpose: PerceptualPurpose;
}

interface CandidateMetrics {
  readonly retainedChroma: number;
  readonly minimumDistance: number;
  readonly baseSeparation: number;
  readonly distanceShortfall: number;
  readonly collapsedPairs: number;
  readonly targetDeviation: number;
}

interface MappedColor {
  readonly l: number;
  readonly c: number;
  readonly h: number;
}

const SCORE_EPSILON = 1e-12;
const ACHROMATIC_CHROMA_THRESHOLD = 0.001;

export function tuneHarmonyHues(input: TuneHarmonyInput): readonly number[] {
  const mechanicalHues = input.mechanicalHues.map(normalizeHue);
  if (input.harmony === "monochrome" || mechanicalHues.length < 2) return mechanicalHues;

  const baseIndex = findBaseIndex(mechanicalHues, input.base.h);
  const adjustableIndexes = mechanicalHues
    .map((_, index) => index)
    .filter((index) => index !== baseIndex);
  const chroma = input.base.c < ACHROMATIC_CHROMA_THRESHOLD
    ? 0
    : Math.max(0.08, Math.min(input.base.c, 0.22));

  let best = mechanicalHues;
  let bestScore = Number.NEGATIVE_INFINITY;
  let bestDeviation = Number.POSITIVE_INFINITY;
  let bestMetrics: CandidateMetrics | undefined;

  for (const shifts of generateShiftSets(adjustableIndexes.length)) {
    const hues = [...mechanicalHues];
    adjustableIndexes.forEach((index, shiftIndex) => {
      hues[index] = normalizeHue(mechanicalHues[index]! + shifts[shiftIndex]!);
    });
    const metrics = measureCandidate(hues, mechanicalHues, baseIndex, chroma);
    if (input.purpose === "data-visualization") {
      if (!bestMetrics || isBetterDataVisualizationCandidate(metrics, bestMetrics)) {
        best = hues;
        bestMetrics = metrics;
      }
      continue;
    }
    const score = scoreCandidate(input.purpose, metrics);

    if (
      score > bestScore + SCORE_EPSILON
      || (Math.abs(score - bestScore) <= SCORE_EPSILON && metrics.targetDeviation < bestDeviation)
    ) {
      best = hues;
      bestScore = score;
      bestDeviation = metrics.targetDeviation;
    }
  }

  return best;
}

function generateShiftSets(count: number): readonly (readonly number[])[] {
  let sets: readonly (readonly number[])[] = [[]];
  for (let index = 0; index < count; index += 1) {
    sets = sets.flatMap((set) => PERCEPTUAL_HUE_SHIFTS.map((shift) => [...set, shift]));
  }
  return sets;
}

function measureCandidate(
  hues: readonly number[],
  mechanicalHues: readonly number[],
  baseIndex: number,
  chroma: number,
): CandidateMetrics {
  const mapped = hues.map((h) => mapForScoring({
    l: PERCEPTUAL_REPRESENTATIVE_LIGHTNESS,
    c: chroma,
    h,
  }));
  const distances: number[] = [];
  let baseSeparation = 0;

  for (let left = 0; left < mapped.length; left += 1) {
    for (let right = left + 1; right < mapped.length; right += 1) {
      const distance = oklchDistance(mapped[left]!, mapped[right]!);
      distances.push(distance);
      if (left === baseIndex || right === baseIndex) baseSeparation += distance;
    }
  }

  const minimumDistance = Math.min(...distances);
  return {
    retainedChroma: mapped.reduce((sum, color) => sum + color.c, 0),
    minimumDistance,
    baseSeparation,
    distanceShortfall: Math.max(0, PERCEPTUAL_MIN_DISTANCE - minimumDistance),
    collapsedPairs: distances.filter((distance) => distance < PERCEPTUAL_COLLAPSE_DISTANCE).length,
    targetDeviation: hues.reduce((sum, hue, index) => (
      sum + circularHueDistance(hue, mechanicalHues[index]!)
    ), 0),
  };
}

function scoreCandidate(
  purpose: Exclude<PerceptualPurpose, "data-visualization">,
  metrics: CandidateMetrics,
): number {
  if (purpose === "ui") {
    const weights = PERCEPTUAL_SCORING_WEIGHTS.ui;
    return (metrics.retainedChroma * weights.chromaRetention)
      + (metrics.minimumDistance * weights.minimumDistance)
      - (metrics.targetDeviation * weights.targetDeviation)
      - (metrics.collapsedPairs * weights.collapse);
  }
  const weights = PERCEPTUAL_SCORING_WEIGHTS.branding;
  return (metrics.retainedChroma * weights.chromaRetention)
    + (metrics.minimumDistance * weights.minimumDistance)
    + (metrics.baseSeparation * weights.baseSeparation)
    - (metrics.targetDeviation * weights.targetDeviation)
    - (metrics.collapsedPairs * weights.collapse);
}

function isBetterDataVisualizationCandidate(
  candidate: CandidateMetrics,
  current: CandidateMetrics,
): boolean {
  const comparisons = [
    candidate.minimumDistance - current.minimumDistance,
    current.distanceShortfall - candidate.distanceShortfall,
    candidate.retainedChroma - current.retainedChroma,
    current.targetDeviation - candidate.targetDeviation,
  ];
  const decisiveDifference = comparisons.find((difference) => Math.abs(difference) > SCORE_EPSILON);
  return decisiveDifference !== undefined && decisiveDifference > 0;
}

function mapForScoring(color: OklchColor): MappedColor {
  const [l, c, hue] = mapToSrgb(color).to("srgb").to("oklch").coords;
  return {
    l: l ?? 0,
    c: c ?? 0,
    h: Number.isFinite(hue) ? normalizeHue(hue as number) : 0,
  };
}

function oklchDistance(left: MappedColor, right: MappedColor): number {
  const leftRadians = (left.h * Math.PI) / 180;
  const rightRadians = (right.h * Math.PI) / 180;
  const deltaL = left.l - right.l;
  const deltaA = (left.c * Math.cos(leftRadians)) - (right.c * Math.cos(rightRadians));
  const deltaB = (left.c * Math.sin(leftRadians)) - (right.c * Math.sin(rightRadians));
  return Math.sqrt((deltaL ** 2) + (deltaA ** 2) + (deltaB ** 2));
}

function findBaseIndex(hues: readonly number[], baseHue: number): number {
  return hues.reduce((bestIndex, hue, index) => (
    circularHueDistance(hue, baseHue) < circularHueDistance(hues[bestIndex]!, baseHue)
      ? index
      : bestIndex
  ), 0);
}

function circularHueDistance(left: number, right: number): number {
  const difference = Math.abs(normalizeHue(left) - normalizeHue(right));
  return Math.min(difference, 360 - difference);
}
