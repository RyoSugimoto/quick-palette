# Base Color Selection

Base color selection resolves user input into one normalized or predefined HEX string before palette generation starts.

## Selection methods

The CLI supports four base-color selection methods:

1. Enter a HEX value.
2. Choose a color family, then a candidate.
3. Choose a mood, then a candidate.
4. Choose a use case, then a candidate.

Every method returns a valid base-color HEX string. Palette generation receives only the final HEX value and does not know how it was selected.

## Data ownership

- Category keys and the `ColorCandidate` shape belong in `packages/core/src/types.ts`.
- Fixed category-to-candidate tables belong in `packages/core/src/constants.ts`.
- HEX validation and normalization belong in `packages/core/src/color.ts`.
- Method selection, category selection, candidate selection, and terminal labels belong in `apps/cli/src/prompt.ts`.
- Initial prompting and repeated base-color selection are called from `apps/cli/src/index.ts`.

Candidate data belongs in core because it is fixed product data. Terminal control flow belongs in the CLI because core generation must remain independent of standard input and output.

## Candidate rules

- Stored candidate colors use canonical uppercase `#RRGGBB`.
- Candidate names are short, user-facing labels.
- Category menu order follows property insertion order in the candidate table.
- Candidate table values are trusted constants and may bypass `normalizeHex`.
- External or generated candidate values must be normalized before they are returned as a base color.
- Fixed choices must remain deterministic and must not depend on network calls, time, randomness, AI, or runtime environment data.

The `muted` mood provides Slate (`#64748B`), Dusty Rose (`#9F6F7D`), and Clay (`#9A6F58`). These are lower-chroma starting colors selected to remain distinct from the existing curated set. Palette generation still applies its own chroma rules; use `chromaScale` when the generated scales themselves need to be muted.

## Routing rules

- `selectKeys` turns table keys into a category menu.
- `promptCandidate` turns candidate objects into labels such as `Quiet Blue (#3B82F6)`.
- `select` handles TTY cursor selection and non-TTY numbered selection.
- `normalizeHex` validates direct input and returns uppercase `#RRGGBB`.

Do not infer a color dynamically from free-form mood or use-case text. If free-form interpretation is introduced later, treat it as a new selection method with its own validation, failure behavior, tests, and UX documentation.
