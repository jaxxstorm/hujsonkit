## Why

The repository needs an initial implementation plan for a JavaScript/TypeScript HuJSON library that is practically compatible with `github.com/tailscale/hujson` while remaining easy to consume from npm, Node.js, and GitHub Actions. Establishing the bootstrap shape now creates a stable foundation for implementation, compatibility testing, and future multi-language expansion without having to restructure the project later.

## What Changes

- Bootstrap the repository as a TypeScript/JavaScript library with a language-specific `js/ts` implementation area and shared repository-level space for fixtures and compatibility data.
- Define the initial HuJSON library surface for parsing, standardizing, minifying, formatting, and patching data in ways that map cleanly to the upstream Go package.
- Add compatibility-focused requirements and reusable golden fixtures so behavior can be checked against documented `tailscale/hujson` semantics, including byte-preserving round trips where supported.
- Define packaging expectations for npm publication and direct git consumption, including module layout suitable for Node.js projects and GitHub TypeScript Actions.
- Explicitly allow only documented, justified behavioral differences from upstream where Go-specific APIs or types do not translate directly to JavaScript/TypeScript.

## Capabilities

### New Capabilities
- `hujson-core`: Define the JavaScript/TypeScript API and behavior for HuJSON parsing, AST/value handling, formatting, standardizing, minifying, and patch application with compatibility expectations against `tailscale/hujson`.
- `repo-bootstrap`: Define the initial repository layout, packaging contract, and shared-fixture structure required to ship the first `js/ts` implementation and leave room for future language ports.
- `compatibility-fixtures`: Define reusable fixtures and verification expectations for upstream compatibility, byte preservation, and cross-environment consumption checks.

### Modified Capabilities
- None.

## Impact

- Affects the full initial repository structure under a future `js/ts` implementation directory plus shared fixture/test locations.
- Introduces the first public npm package and its module entrypoints for Node.js and GitHub Action consumers.
- Adds compatibility fixtures, golden outputs, and validation workflows that compare the implementation against `tailscale/hujson` behavior.
- No existing user-facing API is broken because this is the initial bootstrap; any differences from upstream will need to be documented in specs and design.
