# Quick Palette Development Guide

## Overview

Quick Palette is a pnpm workspace containing a TypeScript CLI, a Preact browser application, and shared palette packages. Palette calculations use OKLCH internally and produce sRGB HEX values. The palette generator is deterministic for a given configuration; exploration uses a seeded, dependency-free PRNG to create reproducible configurations. Runtime generation does not use AI, external APIs, or network access.

The CLI layer owns prompts and terminal output. The Web layer owns DOM interaction, URL state, themes, clipboard access, and downloads. Core owns palette behavior, while Format owns pure text serialization.

```text
apps/
  cli/    Published CLI package and bundled executable
  web/    Vite and Preact browser application
packages/
  core/   Color rules, seeded random configuration, and generation
  format/ Pure HEX, JSON, and CSS formatting
test/
  core/   Generation, harmony, and seeded random behavior
  cli/    Flow, process, packaging, prompt, and output behavior
```

The dependency direction is `apps -> packages` and `format -> core`. Shared packages must not depend on the DOM, terminal, or filesystem. The CLI is bundled into `apps/cli/dist/index.js`, so the published `quick-palette` package has no runtime workspace dependency.

## Requirements

- Node.js 22 or later
- pnpm 11 or later

## Setup and commands

```bash
pnpm install
pnpm start
pnpm test
pnpm web:test
pnpm e2e
pnpm css:validate
pnpm typecheck
pnpm build
pnpm test:all
```

`pnpm start` runs the CLI TypeScript entry point with `tsx`. Pass CLI arguments directly after the script name, for example `pnpm start generate --seed 8f3a21c4`. `pnpm web:dev` starts Vite. `pnpm build` bundles the CLI and builds the production Web application. `pnpm test:all` is the CI-equivalent gate covering CLI/core tests, Web component tests, CSS policy, typechecking, builds, Playwright flows, axe checks, and responsive overflow checks.

Install the Playwright browser once on a development machine before running E2E tests:

```bash
pnpm --filter @quick-palette/web exec playwright install chromium
```

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
