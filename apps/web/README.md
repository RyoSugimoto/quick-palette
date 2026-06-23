# Quick Palette Web

Quick Palette Web is a local Preact application for exploring and configuring reproducible OKLCH-based color palettes in the browser.

It shares palette generation with the CLI and runs without a backend.

OKLCH is used internally to build balanced scales. The app accepts HEX values and guided choices, then provides HEX, JSON, and CSS output.

## Run locally

From the repository root:

```bash
pnpm install
pnpm web:dev
```

Or from this package:

```bash
pnpm dev
```

## What it does

- Explore starts with a reproducible palette and supports exact seed loading.
- Configure exposes harmony, tuning, neutral, step, and adjustment options.
- Generated HEX, JSON, and CSS output can be copied.
- JSON and CSS output can be downloaded.
- System, Light, and Dark themes are supported.

The selected theme preference is stored in local storage. Palette data stays in the URL and browser; no palette data is sent to a server.

## Useful commands

From the repository root:

```bash
pnpm web:dev
pnpm web:test
pnpm web:typecheck
pnpm web:build
pnpm css:validate
pnpm e2e
```

From this package:

```bash
pnpm dev
pnpm test
pnpm typecheck
pnpm build
pnpm css:validate
pnpm e2e
```

Install the Playwright browser once before running E2E tests:

```bash
pnpm --filter @quick-palette/web exec playwright install chromium
```

## Related documentation

- [Project Structure](../../docs/original/project-structure.md)
- [CLI UX Flow](../../docs/original/ux-flow.md)
- [Development Guide](../../docs/views/development.md)
