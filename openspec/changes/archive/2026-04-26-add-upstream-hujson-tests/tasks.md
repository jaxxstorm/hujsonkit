## 1. Shared Fixture Corpus

- [x] 1.1 Add language-agnostic upstream-derived fixture manifests under `fixtures/compatibility` for parse/minimize/standardize cases, including valid inputs, invalid inputs, expected outputs, expected error substrings, and provenance metadata.
- [x] 1.2 Add upstream-derived fixture manifests for patch, JSON Pointer find, format, traversal, and deterministic fuzz seed cases, marking unsupported or intentionally divergent cases with explicit reasons.
- [x] 1.3 Update `fixtures/compatibility/PROVENANCE.md` to identify the upstream `tailscale/hujson` test groups and summarize accepted JavaScript/TypeScript divergences.

## 2. JavaScript/TypeScript Test Coverage

- [x] 2.1 Update JavaScript/TypeScript fixture tests to load the shared upstream parse cases and assert parse success/failure, exact pack round-tripping, minimize output, and standardize output where applicable.
- [x] 2.2 Add JavaScript/TypeScript tests for upstream-derived patch cases, asserting expected output or expected errors through the public `patch` API.
- [x] 2.3 Add JavaScript/TypeScript tests for upstream-derived format cases and deterministic fuzz seed invariants, respecting documented divergence metadata.
- [x] 2.4 Add JavaScript/TypeScript tests or documented skips for upstream-derived JSON Pointer find and traversal cases based on the public API surface available in this package.

## 3. Validation

- [x] 3.1 Run `npm test` and fix any implementation issues that violate the existing compatibility specs.
- [x] 3.2 Run `npm run verify` to confirm the expanded upstream compatibility coverage passes the full package and consumer validation suite.
