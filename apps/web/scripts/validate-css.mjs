import { readFile } from "node:fs/promises";

const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
const errors = [];

for (const [label, pattern] of [
  ["gradient", /gradient\s*\(/i],
  [":hover", /:hover\b/],
  ["letter-spacing", /\bletter-spacing\s*:/],
  ["text-transform", /\btext-transform\s*:/],
]) {
  if (pattern.test(css)) errors.push(`Forbidden ${label} declaration found.`);
}

for (const match of css.matchAll(/(-?\d+(?:\.\d+)?)rem\b/g)) {
  const value = Number(match[1]);
  if (!Number.isInteger(value * 4)) errors.push(`rem value is not on the 0.25rem scale: ${match[0]}`);
}

for (const line of css.split("\n")) {
  for (const match of line.matchAll(/\d+(?:\.\d+)?px\b/g)) {
    const allowed = line.includes("--content-max: 1280px") || /border(?:-width)?\s*:/.test(line);
    if (!allowed) errors.push(`px value is not allowed: ${line.trim()}`);
  }
}

const stack = [];
for (const rawLine of css.split("\n")) {
  const line = rawLine.trim();
  if (line.endsWith("{")) stack.push(line.slice(0, -1).trim());
  if (line === "}") {
    stack.pop();
    continue;
  }
  const declaration = line.match(/^(border(?:-[\w-]+)?|font-size)\s*:\s*([^;]+);/);
  if (!declaration) continue;
  const selector = [...stack].reverse().find((entry) => !entry.startsWith("@")) ?? "";
  const [property, value] = declaration.slice(1);
  if (property === "font-size" && !/\bh[123]\b/.test(selector)) {
    errors.push(`font-size is restricted to headings: ${selector}`);
  }
  if (property.startsWith("border") && value !== "0" && !selector.includes("button") && !selector.includes(".text-link")) {
    errors.push(`visible border is not allowed on ${selector}`);
  }
}

for (const match of css.matchAll(/--[\w-]+:\s*(#[0-9a-f]{6})/gi)) {
  const hex = match[1].slice(1);
  if (hex.slice(0, 2) !== hex.slice(2, 4) || hex.slice(2, 4) !== hex.slice(4, 6)) {
    errors.push(`Application token is not achromatic: ${match[0]}`);
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("CSS policy checks passed.");
}
