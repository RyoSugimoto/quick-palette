# Quick Palette

Explore reproducible OKLCH-based color palettes from the command line. The default flow shows a usable five-step palette after one selection, then lets you accept it or move to another candidate with one key.

Quick Palette uses OKLCH internally to build balanced scales. You enter HEX values and guided choices, and export HEX, JSON, or CSS; OKLCH is not an input or output format.

## Quick start

```bash
pnpm dlx quick-palette
```

Or use npm:

```bash
npx quick-palette
```

Press Enter to choose **Browse palettes - See a new random palette each time**. In the exploration view:

```text
Enter: use this palette / Space: show another / e: edit / q: quit
```

Every candidate displays a seed. Accepting prints concise HEX output under **Color scales** and **Neutral scale**, then lets you finish or export the accepted palette as JSON or CSS. Export is optional and the default remains **Finish - Keep this palette and exit**.

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
  --analogous-spread 45 \
  --hue-rotation 15 \
  --chroma-scale 0.75 \
  --color-steps 5 \
  --neutral-steps 5 \
  --format json
```

Supported values:

- Harmony: `monochrome`, `analogous`, `complementary`, `triadic`, `tetradic`, `pentadic`
- Tuning: `mechanical`, `ui`, `branding`, `data-visualization`
- Neutrals: `neutral`, `tinted`
- Step counts: `3`, `5`, `7`, `9`
- Formats: `hex`, `json`, `css`

Run `pnpm dlx quick-palette --help` for the complete command reference. For repeated use, install it globally with `npm install --global quick-palette` and run `quick-palette` directly.

## Detailed configuration

Choose **Build your own - Choose colors and settings** at startup, or run:

```bash
pnpm dlx quick-palette configure
```

The detailed flow selects a base color, harmony, harmony adjustment, and neutral style before showing a preview. Monochrome palettes skip the adjustment question because it would not change their colors. Its final actions are:

- **Finish - Keep this palette and exit** exits without repeating the HEX values already shown in the preview.
- **Export - Save full palette data or CSS** prints or saves a file, then lets you finish, export another format, or return to the palette.
- **Fine-tune colors - Spacing, hue, and intensity** opens settings while preserving other values.

Press `e` during exploration to open the field picker directly with the current candidate values preselected.

## Palette choices

### Base color

Enter `#RGB` or `#RRGGBB`, or select a curated color by family, mood, or use case. The **Muted** mood includes Slate, Dusty Rose, and Clay as lower-chroma starting points. Random exploration also draws from the deduplicated curated color set.

Base color chroma and generated palette chroma are related but not identical. Use the final chroma adjustment when the generated scales should be more subdued.

### Harmony

- **Single color - Focused shades of one hue** keeps the palette focused.
- **Neighboring colors - Similar, cohesive hues** creates cohesive variety.
- **Opposite colors - Two strongly contrasting hues** creates clear contrast.
- **Three-color balance - Evenly spaced, colorful hues** creates colorful balance.
- **Four-color contrast - Two pairs of opposite hues** creates broad contrast.
- **Five-color range - The widest variety of hues** creates the widest categorical variety.

### Harmony adjustment

- **Keep exact spacing - Most predictable** preserves color-theory angles.
- **Subtle for interfaces - Softer accents** favors restrained screen accents.
- **Bold for brands - Vivid accents** favors vivid, separated accents.
- **Distinct for charts - Easier to tell apart** prioritizes categorical separation.

Adjustments are deterministic and bounded to 12 degrees from each fixed harmony angle. Monochrome palettes do not ask for an adjustment because they contain no secondary hue.

### Fine-tune colors

Use **Fine-tune colors - Spacing, hue, and intensity** to refine a generated palette without restarting:

- Analogous hue distance: `15` to `60` degrees; the default is `30`.
- Hue shift: the CLI accepts `-180` to `180` degrees.
- Color intensity: `0` to `2`; `1` preserves the original chroma and `0` produces an achromatic color scale.

Hue rotation also rotates base-tinted neutrals. Chroma scale applies to color scales, not neutral scales. Tetradic and Pentadic output more color groups, so high step counts can produce up to 36 and 45 colors respectively.

### Neutrals and steps

**Pure gray - No color tint** has zero chroma. **Tinted gray - A hint of the starting color** carries a small amount of the starting hue into backgrounds, borders, and text colors.

Colors and neutrals default to **5 shades - Balanced (default)**. Terminal output labels them from `100` to `900` in light-to-dark order, matching CSS output. Wider harmonies display one separately labeled scale per hue. Use **Step counts** or non-interactive flags when 3, 7, or 9 shades are needed.
