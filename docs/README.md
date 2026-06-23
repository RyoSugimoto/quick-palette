# Documents

Documents under `docs/` are split into two categories.

This file is the entry point for the documentation rules.

## `original/`

`original/` stores the authoritative documents for the project.

- Write objective, strict descriptions.
- Keep implementation and operational details here.
- Prefer decisions, specifications, and rules over informal notes.
- If implementation already exists, update the document to match the verified implementation.
- If the implementation is incorrect, fix the implementation instead of normalizing the document.
- Keep ambiguity to a minimum so procedural documents can rely on these sources.
- Use file splitting and links when that improves clarity, but do not force a fixed split rule.

### Current documents

- [Project Structure](./original/project-structure.md)
- [Base Color Selection](./original/base-color-selection.md)
- [CLI UX Flow](./original/ux-flow.md)
- [Perceptual Harmony](./original/perceptual-harmony.md)
- [Release Policy](./original/release-policy.md)

## `views/`

`views/` stores documents derived from `original/` and optimized for a specific audience or purpose.

- Use any safe document format, including Markdown, HTML, Microsoft Office files, and PDF.
- Do not store executables or other risky files here.
- Overlap with other documents is allowed.
- Create documents only when there is a concrete need.
- Remove documents when they are no longer useful.
- Do not let a `views/` document contradict `original/`; summarize, rephrase, or reorganize only.
- Procedural guides belong here, but the source rules and facts must remain in `original/`.

### Current documents

- [Quick Palette Development Guide](./views/development.md)
- [Base Color Selection Development](./views/base-color-selection.md)
- [Quick Palette Release Guide](./views/releasing.md)
