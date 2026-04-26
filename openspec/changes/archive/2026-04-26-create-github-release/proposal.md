## Why

The tag-triggered release pipeline publishes to npm but does not create a GitHub Release, leaving repository consumers without a canonical release page, generated notes, or an obvious place to inspect released versions. Creating the GitHub Release from the same verified tag keeps npm publication and repository release metadata aligned.

## What Changes

- Update the tag-triggered publish workflow so a successful `v*` release also creates or updates a matching GitHub Release through `softprops/action-gh-release`.
- Ensure the GitHub Release uses the pushed tag and version metadata already validated by the workflow.
- Document the release process so maintainers know that pushing the version tag publishes npm and creates the GitHub Release.
- No changes to HuJSON parsing, formatting, patching, or upstream `tailscale/hujson` compatibility behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `release-automation`: Require tag-triggered releases to create a matching GitHub Release after verification and npm publication succeeds.

## Impact

- Affected systems: `.github/workflows/publish.yml`, release documentation, and release automation specs.
- GitHub Actions permissions may need `contents: write` so the workflow can create the release.
- Package consumers keep the same npm package and TypeScript/JavaScript entrypoints; this change only adds repository release metadata.
