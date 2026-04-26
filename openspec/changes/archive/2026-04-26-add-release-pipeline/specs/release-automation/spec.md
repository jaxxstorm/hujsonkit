## ADDED Requirements

### Requirement: Maintainers SHALL prepare releases with a local version bump command
The repository SHALL provide a local maintainer command that accepts a semver increment or explicit semver version, updates the root package version metadata, verifies the package, creates a release commit, and creates an annotated git tag named `v<version>`. This automation SHALL be specific to TypeScript/JavaScript npm packaging and SHALL not change HuJSON parsing, formatting, patching, or byte-preservation behavior.

#### Scenario: Patch release preparation succeeds
- **WHEN** a maintainer runs the release preparation command with `patch` from a clean working tree
- **THEN** the command updates the root package version to the next patch version, runs repository verification, creates a release commit for the version change, and creates an annotated `v<version>` tag

#### Scenario: Explicit release version succeeds
- **WHEN** a maintainer runs the release preparation command with an explicit valid semver version greater than the current root package version
- **THEN** the command updates the root package version to that exact version and creates matching release commit and tag metadata

#### Scenario: Invalid release input fails before mutation
- **WHEN** a maintainer runs the release preparation command with an unsupported increment, invalid version, non-increasing version, dirty working tree, or existing target tag
- **THEN** the command fails before updating package metadata, creating a commit, or creating a tag

### Requirement: Release documentation SHALL describe the manual push trigger
The repository SHALL document the maintainer release process from local version preparation through pushing the release commit and `v<version>` tag that triggers npm publication.

#### Scenario: Maintainer follows documented release process
- **WHEN** a maintainer is ready to publish a new npm package version
- **THEN** the documentation identifies the local release command to run, the expected commit and tag outputs, and the git push command needed to publish the commit and tag

#### Scenario: Maintainer reviews before publishing
- **WHEN** the local release command completes
- **THEN** the documentation makes clear that npm publication does not begin until the maintainer pushes the resulting `v<version>` tag

### Requirement: Tag-triggered publication SHALL verify tag and package version consistency
The publish workflow SHALL verify that the pushed release tag exactly matches the root package version before running `npm publish`.

#### Scenario: Matching tag permits publication
- **WHEN** the publish workflow runs for tag `v1.2.3` and the checked-out root package version is `1.2.3`
- **THEN** the workflow continues through verification and npm publication

#### Scenario: Mismatched tag blocks publication
- **WHEN** the publish workflow runs for tag `v1.2.3` and the checked-out root package version is not `1.2.3`
- **THEN** the workflow fails before publishing to npm

## MODIFIED Requirements

### Requirement: npm publication SHALL run from a controlled GitHub Actions workflow
The repository SHALL define a GitHub Actions workflow that publishes the package to npm only when a `v*` version tag is pushed, using npm trusted publishing with GitHub Actions OIDC and packaging the generated `dist/` output declared by the root package metadata.

#### Scenario: Controlled release publishes package tarball
- **WHEN** a maintainer pushes a `v*` version tag from the configured repository and workflow with npm trusted publishing enabled
- **THEN** the workflow builds the package from repository sources and publishes the npm package through OIDC without `NPM_TOKEN` or `NODE_AUTH_TOKEN`

#### Scenario: Missing trusted publisher configuration prevents release
- **WHEN** the publish workflow runs without the required OIDC permission, matching npm trusted publisher configuration, or repository permissions
- **THEN** the workflow fails without publishing a package
