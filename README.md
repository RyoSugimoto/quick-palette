# Color Palette Generator

Create a color palette by answering a few simple questions. Start from a color you already love, a mood, or the kind of project you are making, then preview and adjust the result before saving it.

## Requirements

- Node.js 22 or later
- pnpm 11 or later

## Usage

```bash
pnpm install
pnpm start
```

The CLI guides you through choosing a base color, color harmony, neutral style, and number of lightness steps. At the end, you receive a HEX list and JSON that you can use in a design tool or project.

Use the Up and Down arrow keys to move through choices and press Enter to select one. For step-count prompts, pressing Enter selects the displayed default.

## Choosing your palette

### Base color

Think of the base color as the personality of your palette. It may be a color you already use, or simply a direction you want to explore.

- **HEX value** is useful when you already have a brand color, a favorite color, or a color picked from a design. Values such as `#2563EB` and `#F80` are accepted.
- **Color family** is a good place to start when your idea is still broad, such as "something blue" or "a warm orange."
- **Mood** helps when you know how the result should feel. Try calm for a quiet, approachable look; energetic for something lively; elegant for a more refined tone; or playful for a cheerful impression.
- **Use case** starts from what you are making. For example, a dashboard benefits from clear, dependable colors, while wellness content often works well with softer, nature-inspired colors.

There is no wrong starting point. You can preview the result and come back to choose again before creating the final palette.

### Color harmony

Harmony changes how quiet or varied the palette feels.

- **Monochrome** keeps everything in one color family. It feels consistent and calm, and works well for focused interfaces, landing pages, or a simple brand system.
- **Analogous** adds neighboring colors for gentle variety. It often feels natural and cohesive, making it useful for gradients, illustrations, and interfaces that need more warmth without strong contrast.
- **Complementary** pairs the base color with a contrasting color. Choose it when buttons, calls to action, highlights, or important states need to stand out clearly.
- **Triadic** brings together three distinct color families. It creates a lively, balanced palette suited to playful brands, colorful illustrations, or categories that need to be easy to tell apart.

When in doubt, start with monochrome or analogous. Complementary and triadic palettes offer more contrast and usually benefit from choosing one color as the main color and using the others as accents.

### Neutral palette

Neutrals are the supporting colors for backgrounds, text, borders, cards, and disabled states. They give the main colors room to stand out.

- **Neutral gray** has a clean, familiar appearance. It is a dependable choice for dashboards, utilities, editorial layouts, and designs where content should take priority.
- **Base-tinted gray** gently carries the character of the base color into the neutral shades. It can make backgrounds and interface elements feel softer and more connected to the rest of the palette.

### Lightness steps

Steps are the number of light-to-dark variations available for each color. More steps give you finer control; fewer steps keep the palette compact and easier to manage.

- **3 steps** is enough for a quick concept or a simple light, regular, and dark set.
- **5 steps** is a flexible default for most small sites, apps, and brand explorations.
- **7 steps** gives a growing interface more room for hover states, subtle surfaces, and emphasis.
- **9 steps** suits detailed UI work and design systems that need a broad range from very light backgrounds to strong text and accents.

Colors and neutrals both default to 5 steps. Wider harmonies generate a full set of steps for each of their colors, so an analogous or triadic palette will contain more swatches than a monochrome palette.

### Preview and output

The preview is a chance to check the overall direction, not a final commitment. If the palette feels too quiet, too colorful, or disconnected from your project, go back and try a different base color, harmony, or neutral style.

The final HEX list is convenient for quickly trying colors in a design tool or stylesheet. The JSON output is useful when you want to bring the complete palette into code, a token-building script, or another tool. Enter a file path to save it, or leave the path blank to print it in the terminal.
