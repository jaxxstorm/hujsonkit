## ADDED Requirements

### Requirement: Pull requests SHALL run repository verification in GitHub Actions
The repository SHALL define a GitHub Actions workflow that runs for pull requests against the main development branch and executes the existing TypeScript/JavaScript verification contract so maintainers receive automated feedback before merge. This automation is repository-specific and SHALL not change HuJSON parsing, formatting, patching, or byte-preservation behavior.

#### Scenario: Pull request triggers verification workflow
- **WHEN** a contributor opens or updates a pull request against the repository's primary branch
- **THEN** GitHub Actions installs dependencies and runs the repository verification command that covers unit tests, package checks, and consumer checks

#### Scenario: Verification failure blocks release confidence
- **WHEN** any build, test, packaging, or consumer verification step fails in the pull request workflow
- **THEN** the workflow reports a failing status so the change is not treated as release-ready

### Requirement: npm publication SHALL run from a controlled GitHub Actions workflow
The repository SHALL define a GitHub Actions workflow that publishes the package to npm only when a `v*` version tag is pushed, using npm authentication configured in GitHub and packaging the generated `dist/` output declared by the root package metadata.

#### Scenario: Controlled release publishes package tarball
- **WHEN** a maintainer pushes a `v*` version tag with valid npm credentials available to GitHub Actions
- **THEN** the workflow builds the package from repository sources and publishes the npm package that includes the generated `dist/` files and declared metadata

#### Scenario: Missing publish credentials prevents release
- **WHEN** the publish workflow runs without the required npm token or repository permissions
- **THEN** the workflow fails without publishing a package

### Requirement: Release automation SHALL preserve documented package consumption paths
The automation SHALL publish and verify the package through the documented root entrypoints so Node.js consumers and GitHub TypeScript Action consumers continue to install and import `hujsonkit` without referencing implementation-internal paths.

#### Scenario: Published package exposes root entrypoints
- **WHEN** the release workflow publishes a package and a consumer installs it from npm
- **THEN** the consumer resolves the same root JavaScript and type declaration entrypoints defined by the package metadata
