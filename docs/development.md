# Quick Palette Development Guide

## Overview

Quick Palette is a TypeScript CLI. Palette calculations use OKLCH internally and produce sRGB HEX values. The palette generator is deterministic for a given configuration; exploration uses a seeded, dependency-free PRNG to create reproducible configurations. Runtime generation does not use AI, external APIs, or network access.

The CLI layer owns prompts, terminal previews, and output. The core layer owns color normalization, conversion, gamut mapping, and palette generation.

```text
src/
  core/   Color rules, seeded random configuration, and generation
  cli/    Command parsing, application flows, prompts, and output
test/
  core/   Generation, harmony, and seeded random behavior
  cli/    Flow, process, packaging, prompt, and output behavior
```

The dependency direction is `cli -> core`. Code in `src/core` must not depend on terminal or filesystem behavior.

## Requirements

- Node.js 22 or later
- pnpm 11 or later

## Setup and commands

```bash
pnpm install
pnpm start
pnpm test
pnpm typecheck
pnpm build
```

`pnpm start` runs the TypeScript entry point with `tsx`. Pass CLI arguments directly after the script name, for example `pnpm start generate --seed 8f3a21c4`. `pnpm build` compiles the executable to `dist/cli/index.js`; `prepack` runs this build automatically.

## Generation rules

- Accepted step counts are 3, 5, 7, and 9.
- Color and neutral steps both default to 5.
- Every harmony hue receives the full selected set of color lightness steps.
- Neutral gray uses zero chroma.
- Base-tinted gray uses the base hue with chroma capped by `TINTED_NEUTRAL_MAX_CHROMA`.
- Out-of-gamut OKLCH colors are mapped to sRGB by progressively reducing chroma.

## Interaction behavior

TTY menus use an arrow-key selector. Exploration uses direct Enter, Space, `e`, and `q` actions. Ctrl+C exits with status 130, and raw terminal mode is restored on every exit path. Redirected or piped input falls back to numbered choices. Fully scripted use should use `generate`, which creates no prompt interface and keeps stdout machine-readable.

See [UX Flow](./ux-flow.md) for the end-to-end interaction and its implementation boundaries. See [Base Color Selection Development](./base-color-selection.md) before changing base-color choices or routing logic.

The opt-in perceptual harmony feature is documented in [Perceptual Harmony Implementation Plan](./perceptual-harmony-plan.md).

For versioning and publication, follow the [Release Guide](./releasing.md).
