# Base Color Selection Development

This guide is for changing the Base color step.

Source documents:

- [Base Color Selection](../original/base-color-selection.md) for behavior, data ownership, candidate rules, and routing rules.
- [CLI UX Flow](../original/ux-flow.md) for the implemented user journey.

## Where to start

- Change candidate data in `packages/core/src/constants.ts`.
- Change category or candidate types in `packages/core/src/types.ts`.
- Change terminal prompts and menu routing in `apps/cli/src/prompt.ts`.
- Change initial or repeated base-color prompting in `apps/cli/src/index.ts`.
- Update user-facing examples in `README.md` when users will see a new choice.

## Add a candidate

1. Add the `{ name, hex }` entry to the right candidate table.
2. Keep the name short and readable in the CLI.
3. Use uppercase `#RRGGBB`.
4. Run the focused tests and type check.
5. Open the route manually in the CLI and inspect the generated palette.

Example:

```ts
calm: [
  { name: "Quiet Blue", hex: "#3B82F6" },
  { name: "Soft Teal", hex: "#0D9488" },
  { name: "Mist Green", hex: "#4D9C86" },
],
```

## Add a category

1. Add the new key to the relevant union type.
2. Add the matching candidate table entry.
3. Put the new table entry where it should appear in the menu.
4. Run `pnpm typecheck`.
5. Confirm the category appears and returns a candidate.
6. Update `README.md` if the public examples should mention it.

## Add a selection method

This is a larger UX change.

1. Add the method to `BaseColorMethod`.
2. Add the menu option in `promptBaseColor`.
3. Add any fixed data to core types and constants.
4. Return one valid HEX string from the new branch.
5. Keep terminal interaction in the CLI.
6. Update [CLI UX Flow](../original/ux-flow.md).
7. Add prompt tests for the route.

## Validate the change

Run the narrowest useful checks first:

```bash
pnpm test
pnpm typecheck
pnpm build
```

Then try the changed path manually:

1. Open the changed Base color route.
2. Move through choices with Up and Down.
3. Confirm with Enter.
4. Check the selected name and HEX value.
5. Complete harmony and neutral selection.
6. Inspect the preview.
7. Choose `Choose the base color again` and confirm the route still works.

Also test numbered input if shared selection behavior changed.
