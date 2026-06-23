# Quick Palette Release Guide

This guide is the release checklist for publishing `quick-palette`.

Source document:

- [Release Policy](../original/release-policy.md) for versioning and publication rules.

## Prerequisites

- Use Conventional Commit titles for merged changes.
- Have permission to merge the release pull request and publish to npm.
- Make sure `RELEASE_PLEASE_TOKEN` is configured for the GitHub Actions workflow.
- Configure npm authentication locally.
- Start publication from a clean working tree.

## 1. Merge changes into `main`

Release Please determines the next version from commits merged into `main`. Use a squash-merge title that follows Conventional Commits when needed.

## 2. Review the release pull request

Check the generated release pull request:

- Root `package.json`, `apps/cli/package.json`, and `.release-please-manifest.json` use the same version.
- `apps/cli/CHANGELOG.md` describes the release accurately.
- The release pull request includes the intended changes.

Merge the release pull request only after those items look correct.

## 3. Confirm the GitHub release

After merging the release pull request, wait for Release Please to create the tag and GitHub release.

Then update the local checkout and verify the release:

```bash
git switch main
git pull --ff-only
git fetch origin --tags
git status --short
git describe --tags --exact-match
node -p "require('./package.json').version"
node -p "require('./apps/cli/package.json').version"
```

`git status --short` should print nothing. The tag and package version should match.

## 4. Run publication checks

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm web:test
pnpm css:validate
pnpm typecheck
pnpm build
pnpm e2e
node apps/cli/dist/index.js --help
(cd apps/cli && npm pack --dry-run)
```

Inspect the dry-run package output before publishing.

## 5. Publish to npm

```bash
npm whoami
(cd apps/cli && npm publish)
```

Complete two-factor authentication when npm asks for it.

## 6. Verify the publication

```bash
npm view quick-palette version
(cd "$(mktemp -d)" && npx --yes quick-palette@X.Y.Z --help)
```

Replace `X.Y.Z` with the released version. Run the `npx` check outside this repository.

## If publication fails

Fix the cause and retry from the same clean release commit. If the version already exists or a defective package was published, follow [Release Policy](../original/release-policy.md) rather than manually reusing a version or moving a tag.
