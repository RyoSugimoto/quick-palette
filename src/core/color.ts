import Color from "colorjs.io";
import type { OklchColor } from "./types.js";

const HEX_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const CHROMA_DECREMENT = 0.002;

export class InvalidHexColorError extends Error {
  constructor(value: string) {
    super(`Invalid HEX color: ${value}`);
    this.name = "InvalidHexColorError";
  }
}

export function normalizeHex(value: string): string {
  const trimmed = value.trim();
  if (!HEX_PATTERN.test(trimmed)) {
    throw new InvalidHexColorError(value);
  }

  const digits = trimmed.slice(1);
  const expanded = digits.length === 3
    ? digits.split("").map((digit) => digit.repeat(2)).join("")
    : digits;
  return `#${expanded.toUpperCase()}`;
}

export function isValidHex(value: string): boolean {
  return HEX_PATTERN.test(value.trim());
}

export function hexToOklch(value: string): OklchColor {
  const [l, c, hue] = new Color(normalizeHex(value)).to("oklch").coords;
  return {
    l: l ?? 0,
    c: c ?? 0,
    h: Number.isFinite(hue) ? (hue as number) : 0,
  };
}

export function isInSrgb(color: OklchColor): boolean {
  return new Color("oklch", [color.l, color.c, normalizeHue(color.h)]).inGamut("srgb");
}

export function oklchToHex(color: OklchColor): string {
  const mapped = mapToSrgb(color).to("srgb");
  const channels = mapped.coords.map((channel) => {
    const value = Math.min(1, Math.max(0, channel ?? 0));
    return Math.round(value * 255).toString(16).padStart(2, "0");
  });
  return `#${channels.join("").toUpperCase()}`;
}

export function mapToSrgb(color: OklchColor): Color {
  const l = Math.min(1, Math.max(0, color.l));
  const h = normalizeHue(color.h);
  let c = Math.max(0, color.c);

  while (c > 0) {
    const candidate = new Color("oklch", [l, c, h]);
    if (candidate.inGamut("srgb")) {
      return candidate;
    }
    c = Math.max(0, c - CHROMA_DECREMENT);
  }

  return new Color("oklch", [l, 0, h]);
}

export function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360;
}
