export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}

export function formatColorSwatch(hex: string, useColor: boolean): string {
  if (!useColor) return `  ${hex}`;
  const { r, g, b } = hexToRgb(hex);
  return `  \u001B[48;2;${r};${g};${b}m    \u001B[0m  ${hex}`;
}
