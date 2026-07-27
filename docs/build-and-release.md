# Build and Release Guide

This document describes the recommended process for building and releasing Scopa Companion.

## Scope

Use this guide when you are preparing a versioned release, creating a git tag, and pushing the release to GitHub.

## Prerequisites

- Node.js installed
- npm installed
- Git configured with push access to the repository
- Supabase environment variables available if cloud sync should be active in the deployed environment

## Repository Setup

From the project root:

```bash
npm install
```

If you need local cloud-sync configuration during testing, create a local `.env` file based on `.env.example`.

## Pre-Release Checklist

Before creating a release:

1. Confirm the working tree is in the expected state.
2. Confirm the app version in `package.json` is correct.
3. Run a production build.
4. Review any user-facing changes.
5. Confirm Supabase configuration and policies if the release depends on cloud sync.

## Build Verification

Run the normal validation commands from the project root:

```bash
npm run build
```

Optional additional checks:

```bash
npm run lint
```

If the build fails, do not create a release tag until the issue is fixed.

## Versioning

The app version is read from `package.json` and is displayed in the UI header.

Update the version field in `package.json` before release.

Example:

```json
"version": "0.2.0"
```

If you want npm to update the version field for you without auto-tagging, use one of these commands:

```bash
npm version patch --no-git-tag-version
npm version minor --no-git-tag-version
npm version major --no-git-tag-version
```

Examples:

- `patch`: `0.1.0` -> `0.1.1`
- `minor`: `0.1.0` -> `0.2.0`
- `major`: `0.1.0` -> `1.0.0`

After changing the version, rerun the build:

```bash
npm run build
```

## Review Changes Before Commit

Check the changed files:

```bash
git status --short
git diff --stat
```

If needed, inspect the full diff:

```bash
git diff
```

## Commit the Release

Stage the release changes:

```bash
git add .
```

Create a release commit:

```bash
git commit -m "Release v0.2.0"
```

Replace `v0.2.0` with the actual version being released.

## Create a Git Tag

Create an annotated tag for the release:

```bash
git tag -a v0.2.0 -m "Release v0.2.0"
```

Verify the tag:

```bash
git tag --list
git show v0.2.0 --no-patch
```

## Push the Release

Push the branch first:

```bash
git push origin main
```

Push the tag:

```bash
git push origin v0.2.0
```

If you prefer to push all local tags:

```bash
git push origin --tags
```

## Post-Release Verification

After pushing:

1. Confirm the commit is visible on GitHub.
2. Confirm the tag is visible on GitHub.
3. If using GitHub Releases, create or update the release notes for the tag.
4. Confirm the deployed environment has the required env vars if cloud sync is expected.

## Example End-to-End Release Flow

```bash
npm version patch --no-git-tag-version
npm run build
git status --short
git add .
git commit -m "Release v0.1.1"
git tag -a v0.1.1 -m "Release v0.1.1"
git push origin main
git push origin v0.1.1
```

## If You Need to Fix the Release Before Pushing the Tag

If the release commit exists but the tag should be recreated locally before pushing:

```bash
git tag -d v0.2.0
git tag -a v0.2.0 -m "Release v0.2.0"
```

If the tag was already pushed and must be replaced, coordinate carefully before force-updating shared tags.

## Notes for This Project

- The production build output is generated in `dist/`.
- The app version shown in the header comes from `package.json`.
- Cloud sync is optional at runtime, but deployed environments should define Supabase variables if sync is intended.