# CLI UX Flow

This document describes the implemented interactive and non-interactive journeys.

## Startup and exploration

Running the CLI without a command opens a two-item menu with exploration selected:

```text
> Browse palettes - See a new random palette each time
  Build your own - Choose colors and settings
```

```mermaid
flowchart TD
  Start[Start CLI] --> Mode{Startup mode}
  Mode -->|Explore, default| Candidate[Generate seeded random config]
  Candidate --> Preview[Show preview, metadata, and seed]
  Preview --> Action{Exploration action}
  Action -->|Space: show another| Next[Advance seed until generated colors change]
  Next --> Candidate
  Action -->|Enter: use this palette| Hex[Print concise HEX]
  Hex --> Accepted{Finish / Export}
  Accepted -->|Export| Format[JSON or CSS export flow]
  Accepted -->|Finish| End
  Action -->|e: edit| Field[Open field picker with current values]
  Field --> Configure[Edit selected field]
  Action -->|q: quit| End[Finish without accepted output]
  Mode -->|Configure| Fresh[Prompt for initial configuration]
  Fresh --> Configure
```

Random exploration changes the curated base color, harmony, harmony adjustment, and neutral mode. Color and neutral step counts remain fixed at five. The displayed eight-digit seed reproduces the candidate through `generate --seed` within the same Quick Palette version; generated JSON output should be retained when exact colors are required across versions.

TTY exploration reads a single key and restores raw mode after success, cancellation, or error. It displays `Enter: use this palette / Space: show another / e: edit / q: quit`. Non-TTY input uses a numbered `Use this palette / Show another / Edit / Quit` menu and never waits for raw key events.

## Detailed configuration

Fresh configuration asks for base color, harmony, harmony adjustment, and neutral mode. The adjustment question is skipped for monochrome palettes because it has no visual effect. Editing an exploration candidate opens the field picker immediately and preserves its current values.

```mermaid
flowchart TD
  Config[Current config] --> Preview[Generate and show preview]
  Preview --> Final{Finish / Export / Fine-tune colors}
  Final -->|Finish| End[Finish]
  Final -->|Export| Format{JSON or CSS}
  Format --> Destination{Print / Save / Back}
  Destination -->|Print or save| Exported{Finish / Export another / Back}
  Destination -->|Back| Format
  Exported -->|Finish| End[Finish]
  Exported -->|Export another| Format
  Exported -->|Back| Final
  Final -->|Fine-tune colors| Field{Field to edit}
  Field --> Base[Base color]
  Field --> Harmony[Harmony and adjustment]
  Field --> Neutral[Neutral mode]
  Field --> Steps[Color and neutral steps]
  Base --> Preview
  Harmony --> Preview
  Neutral --> Preview
  Steps --> Preview
```

Finish keeps the palette and exits without repeating the HEX values already shown in the preview. The normal path keeps both step counts at five and asks no step-count or output questions. JSON is described as full palette data and settings; CSS as ready-to-use custom properties. Both use the same Print, Save, and Back choices, then offer Finish, Export another format, or Back to palette without reprinting the preview. Fine-tune colors preselects current values and changes only the selected field group.

## Non-interactive commands

```mermaid
flowchart LR
  Args[CLI arguments] --> Parse[Validate command and options]
  Parse -->|explore| Explore[Interactive exploration, optional seed]
  Parse -->|configure| Configure[Interactive detailed flow]
  Parse -->|generate| Resolve[Resolve defaults or seeded config]
  Resolve --> Generate[Generate palette]
  Generate --> Format[HEX, JSON, or CSS]
  Format -->|No output path| Stdout[stdout only]
  Format -->|Output path| File[File only]
  Parse -->|invalid| Stderr[stderr and exit 1]
```

`generate` creates no readline interface and prints no headings or prompts beyond the requested format. With no seed, omitted fields use `#2563EB`, analogous harmony, mechanical tuning, neutral gray, and five steps. With a seed, omitted configurable fields come from the deterministic random configuration; explicit flags pin their fields.

## Selection and terminal behavior

- TTY menus use Up and Down with wraparound and Enter to select.
- Exploration uses Enter, Space, `e`, and `q` as direct actions.
- Ctrl+C prints `Cancelled.`, exits with status 130, and restores raw terminal mode.
- Terminal palettes use **Color scales**, **Scale 1**, and **Neutral scale** headings with `100` through `900` labels in light-to-dark order.
- Tetradic and Pentadic harmonies produce four and five color groups respectively.
- Fine-tune colors is available from the edit menu without adding prompts before the first preview.
- Analogous distance, hue rotation, and chroma scale are validated at both CLI and core boundaries.
- Non-TTY menus use numbered input and reject invalid selections.
- True Color swatches appear only for TTY stdout when `NO_COLOR` is unset.
- Machine-readable generation writes content to stdout or a selected file, and errors to stderr.

## Interaction counts

The implemented paths were checked through automated process tests and timed non-TTY internal trials on 2026-06-21 using Node.js 26.3.0. Counts exclude typing the launch command; timings are local smoke measurements, not performance targets.

| Journey | First preview | Accept and finish | Internal wall time |
| --- | ---: | ---: | ---: |
| No arguments, default exploration | 1 selection | 3 key actions total | 0.11 s |
| `explore` command | 0 selections | 2 key actions total | Not timed |
| `explore --seed 8f3a21c4` | 0 selections | 2 key actions total | 0.12 s |
| `generate --seed 8f3a21c4` | No preview step | 0 interactive actions | 0.10 s |

Moving between exploration candidates requires one Space key. Accepting requires one Enter key followed by a **Finish** or **Export** selection; **Finish - Keep this palette and exit** is preselected. External first-time-user usability sessions have not yet been conducted.

## Module responsibilities

```mermaid
flowchart LR
  Index[index.ts<br/>Command dispatch and error boundary]
  Index --> Args[args.ts<br/>Argument parsing and help]
  Index --> Explore[explore.ts<br/>Exploration state loop]
  Index --> Configure[configure.ts<br/>Detailed flow]
  Index --> Command[generate-command.ts<br/>Non-interactive generation]
  Explore --> Random[core/random.ts<br/>Seeded random config]
  Explore --> Generate[core/generate.ts<br/>Palette generation]
  Configure --> Generate
  Command --> Random
  Command --> Generate
  Explore --> Prompt[prompt.ts<br/>TTY and numbered input]
  Configure --> Prompt
  Explore --> Output[output.ts and preview.ts<br/>Formatting]
  Configure --> Output
  Command --> Output
```
