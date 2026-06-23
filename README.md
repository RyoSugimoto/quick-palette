# Quick Palette

Quick Palette is a local, reproducible OKLCH color palette generator with a browser application and a command-line application.

Both applications share the same palette generation and formatting packages.

> [!NOTE]
> OKLCH is used internally for palette generation. User input is HEX values and guided choices; output is HEX, JSON, or CSS.
> For color-format policy and future format expansion, see [Project Structure](./docs/original/project-structure.md).

## Applications

- [Command-line application](./apps/cli/README.md): npm package documentation for `quick-palette`.
- [Web application](./apps/web/README.md): local Preact application for exploring, configuring, copying, and downloading palettes in the browser.

## Documentation

- [Documentation rules and index](./docs/README.md)
- [Development guide](./docs/views/development.md)
- [Base color selection development](./docs/views/base-color-selection.md)
- [Release guide](./docs/views/releasing.md)

Authoritative project documents are under [docs/original](./docs/original/).

## Workspace

```text
apps/
  cli/    Published CLI package and bundled executable
  web/    Vite and Preact browser application
packages/
  core/   Color rules, seeded random configuration, and generation
  format/ HEX, JSON, and CSS formatting
```

For package boundaries, runtime requirements, and generation rules, see [Project Structure](./docs/original/project-structure.md).
