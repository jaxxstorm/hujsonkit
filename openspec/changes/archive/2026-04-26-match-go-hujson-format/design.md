## Context

The current TypeScript formatter serializes the parsed semantic JSON model with `JSON.stringify(..., null, "  ")`. That is deterministic, but it is not byte-compatible with upstream `tailscale/hujson.Format`. Tailscale's GitOps pusher computes its local ETag by formatting policy bytes with the Go formatter and hashing those exact bytes, so formatter byte differences make equivalent policies look different to tools that compare local hashes with control-plane ETags.

The upstream GitOps pusher source reads the policy file, calls `hujson.Format(data)`, then hashes the formatted bytes with SHA-256 before deciding whether to short-circuit. This change is therefore about formatter bytes, not just semantic JSON equivalence.

## Goals / Non-Goals

**Goals:**

- Make `format` output match upstream Go `hujson.Format` bytes for supported language-agnostic HuJSON inputs.
- Preserve parse/pack exact round-tripping for unchanged parsed values.
- Add fixtures that prove formatter-dependent hashes match the upstream Go action for realistic Tailscale policy input.
- Remove the current accepted formatter divergence for ordinary upstream format cases such as duplicate object members, compact arrays, and comment/trailing-comma layout.
- Keep the public TypeScript/JavaScript API shape stable.

**Non-Goals:**

- Reimplementing Go-only internal AST structs or offsets as public JavaScript types.
- Changing `standardize`, `minimize`, or `patch` semantics unless formatter compatibility exposes a required shared helper fix.
- Adding a runtime dependency for formatting.
- Guaranteeing byte compatibility for unsupported malformed inputs that upstream rejects.

## Decisions

- Implement formatting over the HuJSON syntax tree instead of the semantic JSON value.
  - Rationale: `JSON.stringify` loses duplicate object members, comments, trailing commas, and whitespace/comment placement that upstream `Format` intentionally normalizes rather than discarding.
  - Alternative considered: keep semantic serialization and special-case hashes. That would leave the public `format` API incompatible and make downstream action code depend on a workaround.

- Use upstream-derived golden fixtures as the compatibility contract.
  - Rationale: formatter differences are byte-level, so tests need exact expected bytes and hash values produced by Tailscale's Go implementation.
  - Alternative considered: assert only parseability and idempotence. That misses the ETag mismatch that motivated this change.

- Treat formatter hash compatibility as part of `hujson-core`.
  - Rationale: the GitOps action can only compare local hashes fairly when the package formatter is byte-compatible with upstream formatter output.
  - Alternative considered: move hash behavior into a separate action-specific spec. The library is the source of formatted bytes, so the core capability should own the invariant.

- Keep fixtures language-agnostic.
  - Rationale: future implementations should be able to verify the same upstream bytes and hash outputs without copying TypeScript-specific test code.
  - Alternative considered: add only JavaScript unit tests. That would fix this package but not the shared compatibility corpus.

## Risks / Trade-offs

- Formatter implementation complexity increases -> Mitigation: drive implementation with small upstream golden cases and keep parser/packer behavior unchanged.
- Existing consumers may have snapshots based on current `JSON.stringify` pretty output -> Mitigation: this is a compatibility correction to match the documented upstream target; README/API docs should call out Go-compatible formatter bytes.
- Upstream formatter behavior may change -> Mitigation: record upstream source/provenance for fixtures and keep the corpus easy to refresh.
- Some current parser representation gaps may block exact formatting -> Mitigation: identify those gaps through fixtures first and adjust internal AST metadata only as needed, without changing public API shape.
