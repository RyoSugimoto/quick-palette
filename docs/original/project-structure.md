# Project Structure

Quick Palette is a pnpm workspace containing a TypeScript CLI, a Preact browser application, and shared palette packages.

## Workspace layout

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

## Dependency boundaries

- Application packages may depend on shared packages.
- Shared packages must not depend on application packages.
- `packages/core` owns palette behavior and must not depend on the DOM, terminal, filesystem, network, time, AI services, or external runtime state.
- `packages/format` owns pure text serialization and may depend on `packages/core`.
- The CLI owns prompts, terminal control, command dispatch, and terminal output.
- The Web application owns DOM interaction, URL state, themes, clipboard access, and downloads.
- The published CLI is bundled into `apps/cli/dist/index.js`; the published `quick-palette` package must not require workspace package resolution at runtime.

## Runtime requirements

- Node.js 22 or later.
- pnpm 11 or later for repository development.

## Palette generation rules

- Palette calculations use OKLCH internally and produce sRGB HEX values.
- OKLCH is not a user-facing input or output format.
- User-facing input is HEX values and guided configuration choices.
- User-facing output is HEX, JSON, or CSS.
- Additional color input or output formats, including RGB, HSL, OKLCH, OKLAB, or wide-gamut CSS color formats, must be considered as part of a broader color-format design.
- Do not add color formats one at a time without defining parsing, validation, gamut handling, rounding, and compatibility behavior.
- Generation is deterministic for a given resolved configuration.
- Exploration uses a seeded, dependency-free PRNG to create reproducible configurations.
- Runtime generation must not use AI, external APIs, network access, time, or environment-specific data.
- Accepted step counts are 3, 5, 7, and 9.
- Color and neutral steps both default to 5.
- Every harmony hue receives the full selected set of color lightness steps.
- Neutral gray uses zero chroma.
- Base-tinted gray uses the base hue with chroma capped by `TINTED_NEUTRAL_MAX_CHROMA`.
- Out-of-gamut OKLCH colors are mapped to sRGB by progressively reducing chroma.
