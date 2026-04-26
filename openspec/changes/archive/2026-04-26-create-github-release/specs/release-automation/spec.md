## ADDED Requirements

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
