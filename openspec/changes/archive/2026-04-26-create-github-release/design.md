## Context

The current `publish` workflow runs on `v*` tag pushes, validates that the tag matches `package.json`, verifies the package, and publishes to npm using trusted publishing through GitHub Actions OIDC. The repository release process stops there, so GitHub does not get a corresponding Release object for the tag.

This change is specific to repository release automation. It does not affect HuJSON runtime behavior, shared compatibility fixtures, package entrypoints, or upstream `tailscale/hujson` byte-compatibility expectations.

## Goals / Non-Goals

**Goals:**

- Create a GitHub Release for the same `vX.Y.Z` tag that successfully publishes to npm.
- Keep npm publication and GitHub Release creation in one controlled tag-triggered workflow.
- Use `softprops/action-gh-release` for GitHub Release creation rather than a raw GitHub CLI script.
- Document that pushing the release tag is the single release trigger for both npm and GitHub release metadata.

**Non-Goals:**

- Generating a custom changelog format beyond GitHub's generated release notes.
- Uploading npm tarballs or additional binary artifacts to the GitHub Release.
- Changing the local version-bump command or package entrypoints.
- Changing HuJSON parser, formatter, patch, or fixture behavior.

## Decisions

- Create the GitHub Release after `npm publish` succeeds.
  - Rationale: the GitHub Release should represent a completed package publication, not a tag that later fails validation or npm publishing.
  - Alternative considered: create the release before publish. That risks leaving a published GitHub Release for a failed npm release.

- Use the pushed tag as the Release tag and the package version as the Release name.
  - Rationale: the workflow already validates `GITHUB_REF_NAME == v${package.version}`, so this keeps repository metadata aligned with npm package metadata.
  - Alternative considered: derive release names from commit messages. That adds inconsistency without improving release traceability.

- Use `softprops/action-gh-release@v3` with GitHub generated release notes.
  - Rationale: generated notes provide useful repository context without adding a changelog generator dependency or a new release-note maintenance process.
  - Alternative considered: call `gh release create` directly. The action is purpose-built for this workflow, supports generated release notes, defaults to the GitHub token, and updates an existing release for the same tag rather than requiring custom shell idempotency.

- Grant the publish workflow `contents: write`.
  - Rationale: GitHub Release creation requires write access to repository contents/releases, while npm trusted publishing still requires `id-token: write`.
  - Alternative considered: use a personal access token. That would add secret management and weaken the existing tokenless release posture.

## Risks / Trade-offs

- [GitHub Release creation fails after npm publish] -> The workflow should fail visibly so maintainers can rerun the job or create the release manually for the already-published tag.
- [Release already exists for the tag] -> The implementation should be idempotent or update/reuse the existing release so reruns do not fail unnecessarily.
- [Generated notes are too generic] -> Maintainers can edit the GitHub Release after creation; custom release-note generation can be a later change if needed.
- [Broader workflow permission] -> Limit the expanded permission to `contents: write` in the publish workflow and keep npm publishing on OIDC without npm tokens.
