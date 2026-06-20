# CLI UX Flow

This document describes the user journey implemented by `src/cli/index.ts` and the modules involved at each stage.

## End-to-end flow

```mermaid
flowchart TD
  Start[Start CLI] --> BaseMethod[Choose how to select a base color]
  BaseMethod --> Hex[Enter HEX]
  BaseMethod --> Family[Choose color family and candidate]
  BaseMethod --> Mood[Choose mood and candidate]
  BaseMethod --> UseCase[Choose use case and candidate]

  Hex --> Harmony[Choose color harmony]
  Family --> Harmony
  Mood --> Harmony
  UseCase --> Harmony

  Harmony --> Neutral[Choose neutral palette]
  Neutral --> Initial[Generate initial palette with 5 color and 5 neutral steps]
  Initial --> Preview[Show terminal preview]
  Preview --> Review{Review action}

  Review -->|Choose base again| BaseMethod
  Review -->|Choose harmony again| Harmony
  Review -->|Choose neutrals again| Neutral
  Review -->|Continue| ColorSteps[Choose color lightness steps]

  ColorSteps --> NeutralSteps[Choose neutral lightness steps]
  NeutralSteps --> Final[Generate final palette]
  Final --> HexOutput[Print color and neutral HEX lists]
  HexOutput --> JsonPath{JSON output path?}
  JsonPath -->|Blank| PrintJson[Print JSON]
  JsonPath -->|Provided| SaveJson[Save JSON file]
  PrintJson --> End[Finish]
  SaveJson --> End
```

## Selection behavior

In a TTY, `src/cli/prompt.ts` renders a cursor beside the active option. Up and Down wrap around the available choices, and Enter returns the selected value. Step prompts start on their configured default, which is 5 for both colors and neutrals.

When standard input or output is not a TTY, selection falls back to numbered input. Invalid numbers are rejected and prompted again. Direct HEX input accepts `#RGB` and `#RRGGBB`; invalid values are also prompted again.

## Preview and revision loop

The first preview is generated only after the base color, harmony, and neutral style are known. `src/core/generate.ts` creates the palette, while `src/cli/preview.ts` formats it. True Color blocks are shown only when the output is a TTY and `NO_COLOR` is not set.

The review menu changes one decision at a time:

- Changing the base color returns to the base selection method.
- Changing harmony preserves the base color and neutral style.
- Changing neutrals preserves the base color and harmony.
- Continuing moves to the final lightness-step choices.

After any revision, the initial palette is regenerated and previewed again.

## Final generation and output

The selected color step count applies to every hue in the harmony. For example, analogous harmony has three hues, so 5 steps produce 15 color swatches. Neutral steps always describe the total number of neutral swatches.

`src/cli/output.ts` prints the final HEX lists with the same TTY True Color swatches used by the initial preview. It then either prints formatted JSON or writes it to the path entered by the user. Errors propagate to the CLI entry point, which prints a failure message and sets a non-zero exit code.

## Module responsibilities

```mermaid
flowchart LR
  Index[index.ts<br/>Flow control] --> Prompt[prompt.ts<br/>Input and selection]
  Index --> Generate[core/generate.ts<br/>Palette generation]
  Index --> Preview[preview.ts<br/>Terminal preview]
  Index --> Output[output.ts<br/>HEX and JSON output]
  Prompt --> Color[core/color.ts<br/>HEX normalization]
  Generate --> Color
  Generate --> Constants[core/constants.ts<br/>Fixed rules and defaults]
```
