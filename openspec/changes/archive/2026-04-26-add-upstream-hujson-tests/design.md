## Context

The repository currently has a small shared compatibility fixture set and JavaScript/TypeScript tests that exercise representative parsing, formatting, standardization, and patch behavior. Upstream `tailscale/hujson` has a larger Go test corpus covering parse offsets and errors, minimize/standardize outputs, RFC 6902 patch behavior, JSON Pointer lookup, formatting, fuzz seed invariants, and traversal. The change should convert the upstream cases into reusable repository fixtures where practical, then run the applicable cases through the current TypeScript/JavaScript implementation and leave future language implementations able to consume the same data.

## Goals / Non-Goals

**Goals:**
- Preserve upstream-derived test cases in language-agnostic fixture files with clear provenance.
- Add JavaScript/TypeScript test coverage for upstream parse, pack, minimize, standardize, patch, find, format, fuzz seed, and traversal behavior where the public API supports it.
- Explicitly document intentional deviations from upstream behavior, including bootstrap formatter and patch comment-placement differences.
- Keep the test data reusable for future implementations without binding it to JavaScript module structure.

**Non-Goals:**
- Recreate Go-only struct offset assertions exactly when the JavaScript/TypeScript AST does not expose the same shape.
- Add fuzzing infrastructure beyond deterministic seed/invariant tests.
- Change the public API solely to match every upstream test helper.
- Require future language implementations to pass cases for APIs they have not implemented yet.

## Decisions

### Store upstream cases as structured shared fixtures
The upstream tests should be represented as JSON fixture manifests under `fixtures/compatibility` rather than copied directly into JavaScript test code. Each case can include the input, expected packed/minimized/standardized/formatted/patch output, expected error substring, source upstream test group, and any implementation-specific skip or divergence note.

Alternative considered: translating the Go test arrays directly into JavaScript test files. Rejected because that would make future language reuse harder and would duplicate provenance details in implementation-specific code.

### Treat exact AST shape and Go offsets as compatibility references, not mandatory JavaScript assertions
The Go tests assert `Value` internals such as `BeforeExtra`, offsets, and concrete Go types. JavaScript/TypeScript tests should assert equivalent externally visible behavior: parse success/failure, exact pack round-trip, minimize/standardize/format bytes, JSON Pointer resolution, patch output, and traversal order where the JavaScript API exposes it.

Alternative considered: extending the JavaScript AST API to expose every Go internal field. Rejected because this change is about coverage, and expanding public API surface requires separate design and compatibility review.

### Encode intentional divergences close to the fixture case
Cases that are known not to match the bootstrap implementation, such as upstream format comment-preservation expectations or patch comment-splicing behavior, should be retained with an explicit divergence marker rather than omitted silently. Tests can either skip those cases with a reason or assert the documented JavaScript/TypeScript behavior if a separate expected output exists.

Alternative considered: excluding divergent cases entirely. Rejected because absent cases make it hard to distinguish unsupported behavior from accidentally omitted coverage.

### Use deterministic invariant tests instead of runtime fuzzing
The upstream fuzz tests should be converted into deterministic tests over the upstream seed corpus and local shared fixtures: valid inputs pack exactly, standardize produces valid JSON, format remains parsable and idempotent, and patch never crashes for the known patch corpus. Runtime fuzzing can be added later as a separate workflow if needed.

Alternative considered: adding a JavaScript fuzzing dependency or long-running random tests. Rejected because it would add dependency and CI complexity beyond the current verification contract.

## Risks / Trade-offs

- [Fixture manifests become large and hard to review] -> Group them by upstream test file and keep provenance comments or metadata concise.
- [Some upstream expectations conflict with documented bootstrap differences] -> Keep those cases present with explicit divergence metadata and avoid marking silent skips as passing compatibility.
- [Test coverage exposes real implementation gaps] -> Fix gaps that violate existing specs; if a gap reflects an accepted API difference, document it in provenance and specs.
- [Future language implementations interpret fixtures differently] -> Use simple JSON data shapes and avoid JavaScript-specific representations in shared fixtures.
