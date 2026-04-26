# Compatibility Fixture Provenance

- `valid/with-comments.hujson`, `format/messy.hujson`, and `roundtrip/comments.hujson` exercise JWCC semantics described by `tailscale/hujson`: line comments, block comments, trailing commas, and exact round-tripping.
- `invalid/unterminated-block-comment.hujson` documents a parser failure case for an unterminated block comment.
- `patch/*` verifies RFC 6902 patch behavior against the standardized JSON model used by this bootstrap.
- `upstream/parse-transform.json` is derived from the upstream `tailscale/hujson` parse, `Minimize`, and `Standardize` table tests. It preserves language-agnostic inputs, expected observable outputs, expected parse failures, and divergence notes where the JavaScript/TypeScript API intentionally exposes semantic JSON rather than Go's exact in-place whitespace-preserving standardization.
- `upstream/patch.json` is derived from upstream `Patch` tests, including RFC 6902 appendix cases. It records expected JSON results or expected public API errors, plus divergence notes for upstream comment-preserving patch cases and duplicate-member validation that are not observable through the current JavaScript/TypeScript patch API.
- `upstream/pointer-traversal.json` is derived from upstream `Find` and `All` tests. It covers JSON Pointer token escaping and traversal order through observable packed values.
- `upstream/format-fuzz.json` is derived from upstream `Format` examples and fuzz seeds. It keeps deterministic format cases that map to the bootstrap formatter and uses upstream fuzz seeds for invariant-style tests rather than runtime random fuzzing.

## Intentional bootstrap differences

- `format/*` expects deterministic standard JSON output. Unlike upstream `tailscale/hujson`, this bootstrap formatter does not preserve HuJSON comments or trailing commas.
- `patch/*` expects a clean JSON serialization after patch application. Comment placement is not preserved across patch operations in this bootstrap.
- Upstream format cases that depend on comment preservation, single-line spacing, or alignment are retained with explicit divergence metadata when included in the shared manifests.
- Upstream Go tests assert internal `Value` offsets and concrete struct layout. JavaScript/TypeScript compatibility tests assert equivalent public behavior: parse success or failure, exact pack output, transformation bytes, JSON Pointer results, patch results, and traversal order.
