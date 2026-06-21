# Quick Palette Release Guide

This guide covers the complete release process: selecting a version with Release Please, creating the GitHub release, and publishing `quick-palette` to npm manually.

Release Please owns version changes, the changelog, Git tags, and GitHub releases. It does not publish to npm. Do not edit the version in `package.json` or `.release-please-manifest.json` manually during a normal release.

## Prerequisites

- Write merge commit or pull request titles using [Conventional Commits](https://www.conventionalcommits.org/).
- Have permission to merge release pull requests and publish `quick-palette` on npm.
- Use Node.js 22 or later and pnpm 11 or later.
- Configure npm authentication locally. Run `npm whoami` before publishing; use `npm login` if it fails.
- Start publication from a clean working tree.

## 1. Merge changes into main

Release Please determines the next version from commits merged into `main`:

- `fix: ...` produces a patch release.
- `feat: ...` produces a minor release.
- `feat!: ...` or a `BREAKING CHANGE:` footer marks a breaking change. While the package is below `1.0.0`, this repository's `bump-minor-pre-major` setting keeps that bump within the `0.x` series.
- `docs:`, `test:`, `chore:`, and similar changes do not normally cause a version bump by themselves.

Use a squash-merge title that follows this format when a pull request contains commits that do not all follow Conventional Commits.

## 2. Review the release pull request

After changes reach `main`, the `release-please` GitHub Actions workflow opens or updates a release pull request. Review these generated changes:

- `package.json` contains the intended next version.
- `.release-please-manifest.json` contains the same version.
- `CHANGELOG.md` accurately summarizes the release.
- The release pull request contains every change intended for this version.

Do not publish from the release pull request branch. Merge it when the version and changelog are ready.

## 3. Confirm the GitHub release

Merging the release pull request triggers Release Please again. Wait until the workflow creates both the `vX.Y.Z` tag and the corresponding GitHub release.

Then update the local checkout and verify that it points to the released commit:

```bash
git switch main
git pull --ff-only
git fetch origin --tags
git status --short
git describe --tags --exact-match
node -p "require('./package.json').version"
```

`git status --short` must print nothing. The tag and package version must match, for example `v0.2.0` and `0.2.0`. Stop if they differ; do not repair generated version files manually.

## 4. Run publication checks

Install exactly the locked dependencies, run the quality gates, and inspect the package contents:

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm build
node dist/cli/index.js --help
npm pack --dry-run
```

Confirm that the package contains the compiled `dist` files, `README.md`, `LICENSE`, and package metadata, with no source files, local configuration, or secrets. The `prepack` script also rebuilds automatically when the package is packed or published.

## 5. Publish to npm

Verify the npm account and publish from the released commit:

```bash
npm whoami
npm publish
```

Complete the npm two-factor authentication prompt when required. `package.json` sets `publishConfig.access` to `public`, so no additional access flag is needed.

Never publish a version that does not match the GitHub release tag. npm versions are immutable and cannot be overwritten by publishing the same version again.

## 6. Verify the publication

Registry propagation can take a short time. Confirm the published version and executable:

```bash
npm view quick-palette version
npx quick-palette@X.Y.Z --help
```

Replace `X.Y.Z` with the released version. Both commands must resolve to the version represented by the GitHub release.

## If publication fails

- Fix authentication, network, or two-factor authentication issues and rerun `npm publish` from the same clean release commit.
- If npm reports that the version already exists, verify it with `npm view quick-palette@X.Y.Z version`; do not try to overwrite it.
- If the published package is defective, deprecate that version when appropriate, merge a corrective Conventional Commit, and release a new version through Release Please. Do not move an existing Git tag or manually reuse an npm version.
