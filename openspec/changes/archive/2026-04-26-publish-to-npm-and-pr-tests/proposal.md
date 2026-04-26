## Why

The repository can already build and verify the package locally, but it does not yet define the GitHub automation needed to publish npm releases or to run unit and packaging checks on pull requests. Adding those workflows now makes the package releasable and gives contributors fast feedback before changes land.

## What Changes

- Add GitHub Actions workflows to run the repository verification commands for pull requests and other integration branches.
- Add a release workflow that publishes the npm package from the repository's generated `dist/` output using the existing package entrypoints and packaging checks.
- Document the release expectations, trigger conditions, and required repository secrets or permissions for npm publishing.
- Keep the library's runtime behavior and HuJSON compatibility unchanged; this change only adds TypeScript/JavaScript repository automation around build, test, and packaging.

## Capabilities

### New Capabilities
- `release-automation`: Define CI and release automation for pull request verification and npm publishing of the TypeScript/JavaScript package.

### Modified Capabilities
- `repo-bootstrap`: Clarify the repository bootstrap requirements so the package remains consumable from npm and from git-backed installs that rely on the existing build lifecycle.

## Impact

- Affected code: `.github/workflows/*`, release documentation, and package metadata only if workflow integration needs it.
- APIs: no public runtime API changes.
- Dependencies: no new runtime dependencies; GitHub-hosted actions and npm authentication configuration for publishing.
- Systems: GitHub Actions CI, npm publishing pipeline, and the TypeScript/JavaScript package release process.
