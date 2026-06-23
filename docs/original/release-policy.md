# Release Policy

Quick Palette uses Release Please for version selection, changelog generation, Git tags, and GitHub releases. npm publication is manual.

## Version ownership

- Release Please owns version changes, changelog entries, Git tags, and GitHub releases.
- Do not edit the version in `package.json` or `.release-please-manifest.json` manually during a normal release.
- The root `package.json`, `apps/cli/package.json`, and `.release-please-manifest.json` must agree on the released version.
- Never publish a package version that does not match the GitHub release tag.
- npm versions are immutable and must not be reused.

## Commit and bump rules

Release Please determines the next version from commits merged into `main`.

- `fix: ...` produces a patch release.
- `feat: ...` produces a minor release.
- `feat!: ...` or a `BREAKING CHANGE:` footer marks a breaking change.
- While the package is below `1.0.0`, this repository's `bump-minor-pre-major` setting keeps breaking-change bumps within the `0.x` series.
- `docs:`, `test:`, `chore:`, and similar changes do not normally cause a version bump by themselves.

Use a squash-merge title that follows Conventional Commits when a pull request contains commits that do not all follow the convention.

## Publication rules

- Publish only from the clean released commit.
- Run the repository's quality gates before publication.
- Inspect the packed CLI package before publication.
- The npm package must contain compiled `dist` files, `README.md`, `LICENSE`, and package metadata.
- The npm package must not contain source files, local configuration, or secrets.
- If publication fails because of authentication, network, or two-factor authentication, retry from the same clean release commit after fixing the cause.
- If npm reports that the version already exists, verify the existing package and do not try to overwrite it.
- If a published package is defective, deprecate that version when appropriate and release a new version through Release Please.
- Do not move existing Git tags or manually reuse npm versions.
