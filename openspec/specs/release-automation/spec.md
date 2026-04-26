## Purpose

Define repository release and verification automation expectations for pull request checks and npm publication.

## Requirements

### Requirement: Pull requests SHALL run repository verification in GitHub Actions
The repository SHALL define a GitHub Actions workflow that runs for pull requests against the main development branch and executes the existing TypeScript/JavaScript verification contract so maintainers receive automated feedback before merge. This automation is repository-specific and SHALL not change HuJSON parsing, formatting, patching, or byte-preservation behavior.

#### Scenario: Pull request triggers verification workflow
- **WHEN** a contributor opens or updates a pull request against the repository's primary branch
- **THEN** GitHub Actions installs dependencies and runs the repository verification command that covers unit tests, package checks, and consumer checks

#### Scenario: Verification failure blocks release confidence
- **WHEN** any build, test, packaging, or consumer verification step fails in the pull request workflow
- **THEN** the workflow reports a failing status so the change is not treated as release-ready

### Requirement: npm publication SHALL run from a controlled GitHub Actions workflow
The repository SHALL define a GitHub Actions workflow that publishes the package to npm only when a `v*` version tag is pushed, using npm trusted publishing with GitHub Actions OIDC and packaging the generated `dist/` output declared by the root package metadata.

#### Scenario: Controlled release publishes package tarball
- **WHEN** a maintainer pushes a `v*` version tag from the configured repository and workflow with npm trusted publishing enabled
- **THEN** the workflow builds the package from repository sources and publishes the npm package through OIDC without requiring `NPM_TOKEN` or `NODE_AUTH_TOKEN`

#### Scenario: Missing trusted publisher configuration prevents release
- **WHEN** the publish workflow runs without OIDC permission, matching npm trusted publisher configuration, or required repository permissions
- **THEN** the workflow fails without publishing a package

### Requirement: Maintainers SHALL prepare releases with a local version bump command
The repository SHALL provide a local maintainer command that validates a requested release version, updates the root package metadata version, and reports the exact commit and tag commands needed to trigger publication. The command SHALL not publish to npm directly.

#### Scenario: Maintainer prepares a patch release
- **WHEN** a maintainer runs the release preparation command with a `patch` release argument
- **THEN** the root package version is incremented by one patch version and the command reports the matching `vX.Y.Z` tag to create after committing the version bump

#### Scenario: Maintainer prepares an explicit release version
- **WHEN** a maintainer runs the release preparation command with an explicit semantic version
- **THEN** the root package version is set to that version and the command reports the matching `vX.Y.Z` tag to create after committing the version bump

#### Scenario: Invalid release argument fails before changing package metadata
- **WHEN** a maintainer runs the release preparation command with an invalid release argument
- **THEN** the command fails without changing `package.json`

### Requirement: Release documentation SHALL describe the manual push trigger
The repository documentation SHALL describe a maintainer release process that runs verification locally, prepares the package version locally, commits the version bump, creates a matching version tag, and pushes the commit and tag to GitHub so the publish workflow is triggered by the tag.

#### Scenario: Maintainer follows documented process
- **WHEN** a maintainer follows the release documentation for version `X.Y.Z`
- **THEN** the maintainer produces a commit that updates package metadata and pushes tag `vX.Y.Z`, which is the only event that triggers npm publication

#### Scenario: Maintainer reviews before publishing
- **WHEN** the local preparation command completes
- **THEN** the documentation instructs the maintainer to inspect the diff and run verification before pushing the release tag

### Requirement: Tag-triggered publication SHALL verify tag and package version consistency
The publish workflow SHALL compare the pushed `v*` tag with the root package version before publishing, and SHALL refuse to publish when they differ.

#### Scenario: Matching tag and package version publishes
- **WHEN** the pushed tag is `vX.Y.Z` and the root package version is `X.Y.Z`
- **THEN** the workflow continues to package verification and npm publication

#### Scenario: Mismatched tag and package version fails before publishing
- **WHEN** the pushed tag version differs from the root package version
- **THEN** the workflow fails before running `npm publish`

### Requirement: Tag-triggered publication SHALL create a GitHub Release
The publish workflow SHALL create a GitHub Release for the pushed `v*` tag after release verification and npm publication succeed. GitHub Release creation SHALL use `softprops/action-gh-release` with the validated tag and package version metadata so repository release records match the npm package version being published.

#### Scenario: Successful tag publication creates GitHub Release
- **WHEN** the publish workflow runs for tag `vX.Y.Z`, verifies that `package.json` version is `X.Y.Z`, and publishes the package to npm successfully
- **THEN** the workflow uses `softprops/action-gh-release` to create a GitHub Release for tag `vX.Y.Z` named for version `vX.Y.Z`

#### Scenario: Failed npm publication does not create GitHub Release
- **WHEN** release verification or npm publication fails for a pushed `v*` tag
- **THEN** the workflow fails without creating a GitHub Release for that tag

#### Scenario: Existing GitHub Release supports workflow reruns
- **WHEN** the publish workflow is rerun for a tag that already has a GitHub Release
- **THEN** `softprops/action-gh-release` updates or reuses the existing release without creating a duplicate release for the same tag

### Requirement: Release documentation SHALL describe GitHub Release creation
The release documentation SHALL explain that pushing the validated `vX.Y.Z` tag triggers both npm publication and GitHub Release creation from the same workflow.

#### Scenario: Maintainer follows documented release process
- **WHEN** a maintainer follows the documented release process and pushes tag `vX.Y.Z`
- **THEN** the documentation makes clear that the publish workflow publishes the npm package and creates the matching GitHub Release

### Requirement: Release automation SHALL preserve documented package consumption paths
The automation SHALL publish and verify the package through the documented root entrypoints so Node.js consumers and GitHub TypeScript Action consumers continue to install and import `hujsonkit` without referencing implementation-internal paths.

#### Scenario: Published package exposes root entrypoints
- **WHEN** the release workflow publishes a package and a consumer installs it from npm
- **THEN** the consumer resolves the same root JavaScript and type declaration entrypoints defined by the package metadata
