# Quick Palette

Generate polished, reproducible color palettes from your terminal.

**Common color-palette problems:**

- **Picking colors** from scratch takes too long.
- **One accent color** keeps getting **reused everywhere.**
- **Tones are hard to keep consistent** across the palette.
- **Copying**, **rearranging**, and **reformatting** color values gets **tedious fast.**

**"Quick Palette"** turns one HEX color, one seed, or one random pick into balanced color scales you can copy straight into a UI, design token file, chart theme, or brand concept.

```bash
pnpm dlx quick-palette
```

```text
Pick a palette -> preview HEX scales -> tweak if needed -> export JSON or CSS
```

## Why use it?

- **Start without a blank canvas:** browse ready palette candidates instead of choosing every color by hand.
- **Move beyond one accent color:** generate harmonies with multiple coordinated color scales.
- **Keep tones consistent:** color spacing and intensity are handled in OKLCH internally, while you keep working with familiar HEX values.
- **Get useful defaults quickly:** the first flow gives you a ready five-step color palette.
- **Recreate palettes later:** every random palette has a seed you can rerun when you need the same result.
- **Practical exports:** print clean HEX, JSON, or CSS, or save CSS to a file.
- **Configurable depth:** choose harmony, tuning, neutral style, hue shifts, intensity, and 3/5/7/9-step scales.

## Quick start

Run the CLI:

```bash
pnpm dlx quick-palette
```

Or with npm:

```bash
npx quick-palette
```

Press Enter on **Browse palettes - See a new random palette each time**.

In the palette browser:

```text
Enter: use this palette / Space: show another / e: edit / q: quit
```

When you accept a palette, Quick Palette prints concise HEX output under **Color scales** and **Neutral scale**. You can finish there, or export the accepted palette as JSON or CSS.

## Common flows

### Browse until something clicks

```bash
pnpm dlx quick-palette explore
```

Use Space for the next candidate. Use `e` to fine-tune the current one before accepting it.

### Recreate a saved palette

Use the seed shown below an exploration preview:

```bash
pnpm dlx quick-palette generate --seed 8f3a21c4
```

The same seed produces the same configuration and palette within the same Quick Palette version. Save generated JSON when exact colors must survive future version changes.

### Export without prompts

```bash
pnpm dlx quick-palette generate --seed 8f3a21c4 --format json
pnpm dlx quick-palette generate --seed 8f3a21c4 --format css --output palette.css
```

Without `--output`, generated output goes to stdout. Errors go to stderr and return a non-zero exit status.

### Build from an exact configuration

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

## Guided configuration

Start the guided builder:

```bash
pnpm dlx quick-palette configure
```

Or choose **Build your own - Choose colors and settings** at startup.

The guided flow asks for a base color, harmony, harmony tuning, neutral style, and step count before showing a preview. Monochrome palettes skip harmony tuning because there is no secondary hue to adjust.

Final actions:

- **Finish - Keep this palette and exit** exits without repeating the HEX values already shown in the preview.
- **Export - Save full palette data or CSS** prints or saves a file, then lets you finish, export another format, or return to the palette.
- **Fine-tune colors - Spacing, hue, and intensity** opens detailed settings while preserving the rest of the palette.

## Options at a glance

| Area | Choices |
| --- | --- |
| Harmony | `monochrome`, `analogous`, `complementary`, `triadic`, `tetradic`, `pentadic` |
| Tuning | `mechanical`, `ui`, `branding`, `data-visualization` |
| Neutrals | `neutral`, `tinted` |
| Step counts | `3`, `5`, `7`, `9` |
| Formats | `hex`, `json`, `css` |

Run the full help:

```bash
pnpm dlx quick-palette --help
```

For repeated use:

```bash
npm install --global quick-palette
quick-palette
```

## Palette controls

### Base color

Enter `#RGB` or `#RRGGBB`, or pick a curated color by family, mood, or use case. The **Muted** mood includes Slate, Dusty Rose, and Clay as lower-chroma starting points. Random exploration also uses the deduplicated curated color set.

Base color chroma and generated palette chroma are related but not identical. Use the chroma adjustment when generated scales should be more subdued or more vivid.

### Harmony

- **Single color - Focused shades of one hue** keeps the palette focused.
- **Neighboring colors - Similar, cohesive hues** creates cohesive variety.
- **Opposite colors - Two strongly contrasting hues** creates clear contrast.
- **Three-color balance - Evenly spaced, colorful hues** creates colorful balance.
- **Four-color contrast - Two pairs of opposite hues** creates broad contrast.
- **Five-color range - The widest variety of hues** creates the widest categorical variety.

### Harmony tuning

- **Keep exact spacing - Most predictable** preserves color-theory angles.
- **Subtle for interfaces - Softer accents** favors restrained screen accents.
- **Bold for brands - Vivid accents** favors vivid, separated accents.
- **Distinct for charts - Easier to tell apart** prioritizes categorical separation.

Tuning is deterministic and bounded to 12 degrees from each fixed harmony angle.

### Fine-tuning

Use **Fine-tune colors - Spacing, hue, and intensity** to refine a generated palette without restarting:

- Analogous hue distance: `15` to `60` degrees; default is `30`.
- Hue shift: `-180` to `180` degrees.
- Color intensity: `0` to `2`; `1` preserves the original chroma and `0` produces an achromatic color scale.

Hue rotation also rotates base-tinted neutrals. Chroma scale applies to color scales, not neutral scales. Tetradic and Pentadic palettes output more color groups, so high step counts can produce up to 36 and 45 colors respectively.

### Neutrals and steps

**Pure gray - No color tint** has zero chroma. **Tinted gray - A hint of the starting color** carries a small amount of the starting hue into backgrounds, borders, and text colors.

Colors and neutrals default to **5 shades - Balanced (default)**. Terminal output labels them from `100` to `900` in light-to-dark order, matching CSS output. Wider harmonies display one separately labeled scale per hue.
