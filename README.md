# Quick Palette

Explore reproducible OKLCH-based color palettes from the command line. The default flow shows a usable five-step palette after one selection, then lets you accept it or move to another candidate with one key.

## Quick start

```bash
pnpm dlx quick-palette
```

Or use npm:

```bash
npx quick-palette
```

Press Enter to choose **Explore random palettes**. In the exploration view:

```text
Enter: accept   Space: next   e: edit   q: quit
```

Every candidate displays a seed. Accepting prints concise HEX output without asking about step counts or export formats.

## Reproduce a palette

Use the seed shown below an exploration preview:

```bash
pnpm dlx quick-palette generate --seed 8f3a21c4
```

The same seed produces the same configuration and palette within the same Quick Palette version. Save the generated JSON output when exact colors must be retained across versions. JSON and CSS output are available without interactive prompts:

```bash
pnpm dlx quick-palette generate --seed 8f3a21c4 --format json
pnpm dlx quick-palette generate --seed 8f3a21c4 --format css --output palette.css
```

Non-interactive output goes only to stdout unless `--output` is supplied. Errors go to stderr and set a non-zero exit status.

## Generate an exact configuration

```bash
pnpm dlx quick-palette generate \
  --base '#2563EB' \
  --harmony analogous \
  --tuning ui \
  --neutral tinted \
  --color-steps 5 \
  --neutral-steps 5 \
  --format json
```

Supported values:

- Harmony: `monochrome`, `analogous`, `complementary`, `triadic`
- Tuning: `mechanical`, `ui`, `branding`, `data-visualization`
- Neutrals: `neutral`, `tinted`
- Step counts: `3`, `5`, `7`, `9`
- Formats: `hex`, `json`, `css`

Run `pnpm dlx quick-palette --help` for the complete command reference. For repeated use, install it globally with `npm install --global quick-palette` and run `quick-palette` directly.

## Detailed configuration

Choose **Create a custom palette** at startup, or run:

```bash
pnpm dlx quick-palette configure
```

The detailed flow selects a base color, harmony, harmony adjustment, and neutral style before showing a preview. Monochrome palettes skip the adjustment question because it would not change their colors. Its final actions are:

- **Finish and print HEX values** prints HEX and exits with the current scales.
- **Export as JSON or CSS** prints or saves a file, then lets you finish, export another format, or return to the palette.
- **Change palette settings** changes the base color, harmony, neutral style, or step counts while preserving other values.

Press `e` during exploration to open the field picker directly with the current candidate values preselected.

## Palette choices

### Base color

Enter `#RGB` or `#RRGGBB`, or select a curated color by family, mood, or use case. Random exploration also draws from the deduplicated curated color set.

### Harmony

- **Monochrome (1 hue + neutrals)** keeps the palette focused.
- **Analogous (3 neighboring hues + neutrals)** creates cohesive variety.
- **Complementary (2 opposite hues + neutrals)** creates clear contrast.
- **Triadic (3 evenly spaced hues + neutrals)** creates colorful balance.

### Harmony adjustment

- **Fixed angles** preserves predictable color-theory angles.
- **UI** favors restrained screen accents.
- **Branding** favors vivid, separated accents.
- **Data visualization** prioritizes categorical separation.

Adjustments are deterministic and bounded to 12 degrees from each fixed harmony angle. Monochrome palettes do not ask for an adjustment because they contain no secondary hue.

### Neutrals and steps

Neutral gray has zero chroma. Base-tinted gray carries a small amount of the base hue into backgrounds, borders, and text colors.

Colors and neutrals default to five lightness steps. Terminal output labels them from `100` to `900` in light-to-dark order, matching CSS output. Wider harmonies display one separately labeled scale per hue. Use **Change palette settings > Step counts** or non-interactive flags when 3, 7, or 9 steps are needed.
