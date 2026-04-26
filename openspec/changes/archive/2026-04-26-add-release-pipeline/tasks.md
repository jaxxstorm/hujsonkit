## 1. Release Preparation Script

- [x] 1.1 Add a dependency-free Node.js release preparation script that accepts `patch`, `minor`, `major`, or an explicit semver version.
- [x] 1.2 Validate release preconditions before mutation: clean working tree, valid increasing target version, and no existing `v<version>` tag.
- [x] 1.3 Update the root `package.json` version through structured JSON parsing while preserving valid package metadata.
- [x] 1.4 Run the repository verification command before creating release git metadata.
- [x] 1.5 Create a release commit and annotated `v<version>` tag after verification succeeds.

## 2. Package and Workflow Integration

- [x] 2.1 Add an npm script in `package.json` for maintainers to invoke the local release preparation command.
- [x] 2.2 Add a publish workflow step that verifies `github.ref_name` equals `v<package.json version>` before npm publication.
- [x] 2.3 Keep the existing tag-triggered publish behavior and package verification steps intact while using npm trusted publishing through OIDC.

## 3. Release Documentation

- [x] 3.1 Document the maintainer release process, including choosing a version increment, running the local command, reviewing the release commit/tag, and pushing both.
- [x] 3.2 Document that npm publication starts only when the `v<version>` tag is pushed and that the workflow rejects tag/package version mismatches.

## 4. Validation

- [x] 4.1 Add or update tests for version calculation, invalid input rejection, and pre-mutation failure behavior where practical.
- [x] 4.2 Validate the release preparation command in a non-publishing path without creating a real npm release.
- [x] 4.3 Run the repository verification command and confirm release automation changes do not affect HuJSON compatibility behavior.
