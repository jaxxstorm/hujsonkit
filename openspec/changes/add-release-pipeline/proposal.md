## Why

The package can already be published from a pushed `v*` tag, but maintainers do not yet have a documented and automated local release step that bumps `package.json`, commits the version change, and creates the matching tag. This change makes releases repeatable and reduces the risk of publishing a tag whose package metadata does not match the intended npm version.

## What Changes

- Add a local release command that validates a requested semver increment or explicit version, updates the root package metadata, and creates a release commit and `v<version>` git tag.
- Document the maintainer release process from local version bump through pushing the commit and tag.
- Tighten the tag-triggered publish workflow so it verifies the pushed tag matches the package version before publishing.
- Preserve the existing `v*` tag-based npm publishing model and existing verification checks.
- No breaking changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `release-automation`: Add requirements for local version bumping, release commit/tag creation, documented release steps, and tag/package version consistency before npm publish.

## Impact

- Affected code: root `package.json`, release helper script(s), release documentation, and `.github/workflows/publish.yml`.
- APIs and HuJSON behavior are unaffected; this is TypeScript/JavaScript package release automation and does not diverge from `tailscale/hujson` parsing, formatting, patching, or byte-preservation behavior.
- Packaging impact: maintainers get a repeatable local release command, and npm publication remains controlled by GitHub Actions after a matching version tag is pushed.
- Dependencies: no external runtime or development dependencies are expected.
