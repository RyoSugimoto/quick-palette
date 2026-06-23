# Quick Palette Development Guide

This guide is a quick start for working on the repository.

Source documents:

- [Project Structure](../original/project-structure.md) for package layout, boundaries, requirements, and generation rules.
- [CLI UX Flow](../original/ux-flow.md) for implemented CLI behavior.
- [Perceptual Harmony](../original/perceptual-harmony.md) for harmony tuning behavior.

## Setup

Use Node.js 22 or later and pnpm 11 or later.

```bash
pnpm install
```

Install the Playwright browser once before running E2E tests:

```bash
pnpm --filter @quick-palette/web exec playwright install chromium
```

## Common commands

```bash
pnpm start
pnpm web:dev
pnpm test
pnpm web:test
pnpm e2e
pnpm css:validate
pnpm typecheck
pnpm build
pnpm test:all
```

`pnpm start` runs the CLI TypeScript entry point. Pass CLI arguments after the script name:

```bash
pnpm start generate --seed 8f3a21c4
```

Use `pnpm test:all` before treating a change as CI-ready.

## Before changing behavior

- Check [Project Structure](../original/project-structure.md) for ownership boundaries.
- Check [CLI UX Flow](../original/ux-flow.md) before changing CLI interaction.
- Check [Base Color Selection Development](./base-color-selection.md) before changing base-color choices or routing.
- Check [Perceptual Harmony](../original/perceptual-harmony.md) before changing harmony tuning.
- Check [Quick Palette Release Guide](./releasing.md) before preparing a release.
