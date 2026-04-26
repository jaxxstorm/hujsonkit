## 1. Workflow

- [x] 1.1 Update `.github/workflows/publish.yml` permissions so the publish job can create GitHub Releases while preserving npm OIDC trusted publishing.
- [x] 1.2 Add a post-`npm publish` `softprops/action-gh-release` step that creates the GitHub Release for the validated pushed tag.
- [x] 1.3 Configure GitHub Release creation so workflow reruns update or reuse the existing release for the tag.

## 2. Documentation

- [x] 2.1 Update the README release process to state that pushing the matching `vX.Y.Z` tag publishes to npm and creates the GitHub Release.
- [x] 2.2 Document that npm publication remains tokenless through trusted publishing and GitHub Release creation uses repository workflow permissions.

## 3. Verification

- [x] 3.1 Validate the workflow YAML syntax and `softprops/action-gh-release` configuration without requiring a real tag push.
- [x] 3.2 Run `npm run verify` to confirm the repository verification contract still passes.
