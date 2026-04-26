## Context

The repository already has a `publish` GitHub Actions workflow that runs on pushed `v*` tags, installs dependencies, verifies the package, and publishes to npm with `NPM_TOKEN`. The missing piece is the maintainer-facing local release process: updating `package.json`, producing a release commit, creating a matching tag, and documenting the push sequence that triggers the existing workflow.

This change is specific to TypeScript/JavaScript npm packaging and GitHub Actions. It does not change HuJSON parsing, formatting, patching, or byte-level compatibility behavior relative to `tailscale/hujson`.

## Goals / Non-Goals

**Goals:**

- Provide a local release command that bumps the root package version using semver-compatible increments or an explicit version.
- Ensure the command creates a predictable release commit and annotated `v<version>` tag after verification passes.
- Document the maintainer release flow, including how to push the commit and tag that starts GitHub Actions publication.
- Add a publish-time guard that fails before npm publication when the pushed tag and `package.json` version disagree.
- Keep release automation dependency-free and compatible with ordinary Node.js environments.

**Non-Goals:**

- Changing package entrypoints, module format, or npm package contents beyond version metadata.
- Publishing from local machines.
- Replacing GitHub Actions with another release system.
- Changing HuJSON runtime behavior or compatibility fixtures.

## Decisions

- Use a small repository-local Node.js script for release preparation.
  - Rationale: the repo already depends on Node.js for build and verification, and a script can update JSON through structured parsing without adding supply-chain surface.
  - Alternative considered: use `npm version`. That handles version bumps and tags, but it is harder to tailor preflight checks and release instructions around this repository's verification contract.

- Support `patch`, `minor`, `major`, and explicit `x.y.z` inputs.
  - Rationale: maintainers need the common semver release increments plus an escape hatch for exact versions.
  - Alternative considered: only accept explicit versions. That is precise, but less ergonomic for routine patch releases.

- Create the release commit and annotated tag locally, but leave pushing explicit.
  - Rationale: maintainers can inspect the resulting commit and tag before publishing, while still getting a repeatable process. Pushing the tag remains the intentional release trigger.
  - Alternative considered: have the script push automatically. That couples local script execution directly to publication and leaves less room to catch mistakes.

- Verify tag/package consistency in the publish workflow before publishing.
  - Rationale: GitHub Actions should fail early if someone pushes a tag that does not match package metadata, preventing an unintended npm version from being published.
  - Alternative considered: trust the local script. That does not protect manual tags or future workflow invocations.

## Risks / Trade-offs

- Release script could fail on a dirty working tree or missing git identity -> Mitigation: perform explicit preflight checks and emit actionable errors before changing files.
- Maintainer could push only the tag and not the version commit -> Mitigation: document pushing the release commit and tag together, and rely on the publish workflow checkout of the tagged commit.
- Manual tag creation could bypass the local process -> Mitigation: publish workflow checks the `v<package.json version>` invariant before `npm publish`.
- Running full verification locally can make release preparation slower -> Mitigation: keep it aligned with the repository's existing `npm run verify` release confidence contract.
