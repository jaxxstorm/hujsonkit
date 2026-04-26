## Why

The current compatibility fixtures cover representative HuJSON behavior, but they do not yet preserve the full upstream `tailscale/hujson` test corpus as a reusable contract for JavaScript/TypeScript and future language implementations. Capturing those upstream cases now improves confidence that parsing, round-tripping, formatting, patching, JSON Pointer lookup, traversal, and fuzz seeds stay aligned with upstream semantics where the APIs map cleanly.

## What Changes

- Add shared upstream-derived fixture data for the Go `hujson` parse/minimize/standardize, patch, find, format, fuzz seed, and traversal test cases.
- Update JavaScript/TypeScript tests to execute the applicable upstream-derived cases through the existing public API.
- Record provenance and any intentional JavaScript/TypeScript divergences, especially current formatter and patch comment-preservation differences.
- Keep the fixtures language-agnostic so future implementations can reuse the same test corpus rather than copying language-specific tests.
- No public API changes are intended; failures found while adding coverage should be fixed only where they reflect unsupported divergence from upstream behavior.

## Capabilities

### New Capabilities

### Modified Capabilities
- `compatibility-fixtures`: Expand shared fixture requirements to include the upstream `tailscale/hujson` test corpus and provenance for all covered cases.
- `hujson-core`: Require implementation tests to exercise upstream-equivalent parse, transform, patch, JSON Pointer lookup, traversal, and fuzz-seed behavior where those APIs exist.

## Impact

- Affected code: shared fixture files, JavaScript/TypeScript test files, fixture loading utilities, and provenance documentation.
- APIs: no intentional public API changes.
- Dependencies: no new runtime dependencies; test-only helpers should use the standard library unless a specific need is justified.
- Systems: `npm test` and `npm run verify` will run broader upstream compatibility coverage.
