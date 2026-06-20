# Development Guide

## Overview

Color Palette Generator is a deterministic TypeScript CLI. Palette calculations use OKLCH internally and produce sRGB HEX values. Generation does not use AI, randomness, external APIs, the current time, or runtime network access.

The CLI layer owns prompts, terminal previews, and output. The core layer owns color normalization, conversion, gamut mapping, and palette generation.

```text
src/
  core/   Color types, constants, conversion, and generation
  cli/    Interactive prompts, preview formatting, and output
test/
  core/   Generation and color behavior
  cli/    Prompt delegation and output formatting
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

`pnpm start` runs the TypeScript entry point with `tsx`. `pnpm build` compiles the executable to `dist/cli/index.js`.

## Generation rules

- Accepted step counts are 3, 5, 7, and 9.
- Color and neutral steps both default to 5.
- Every harmony hue receives the full selected set of color lightness steps.
- Neutral gray uses zero chroma.
- Base-tinted gray uses the base hue with chroma capped by `TINTED_NEUTRAL_MAX_CHROMA`.
- Out-of-gamut OKLCH colors are mapped to sRGB by progressively reducing chroma.

## Interaction behavior

TTY sessions use an arrow-key selector. Up and Down move the active option, Enter confirms it, and Ctrl+C cancels the prompt. Redirected or piped input falls back to numbered choices so the CLI remains scriptable.

See [UX Flow](./ux-flow.md) for the end-to-end interaction and its implementation boundaries. See [Base Color Selection Development](./base-color-selection.md) before changing base-color choices or routing logic.

The opt-in perceptual harmony feature is documented in [Perceptual Harmony Implementation Plan](./perceptual-harmony-plan.md).
