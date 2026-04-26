## MODIFIED Requirements

### Requirement: Core transformations SHALL match upstream HuJSON behavior
The library SHALL expose transformation operations equivalent in practical behavior to upstream `Minimize`, `Standardize`, `Format`, and `Patch`, with any JavaScript-specific API differences documented without changing the normative output semantics. `Format` output for supported HuJSON inputs SHALL be byte-compatible with upstream `tailscale/hujson.Format`, including cases whose bytes are used for formatter-dependent hashes or ETags. Implementation tests SHALL include upstream-derived transformation and patch cases where the behavior is supported, and SHALL explicitly document any accepted divergence.

#### Scenario: Standardize removes HuJSON-only syntax
- **WHEN** a consumer standardizes a value that contains comments or trailing commas
- **THEN** the resulting output is valid standard JSON with HuJSON-only syntax removed

#### Scenario: Format normalizes layout deterministically
- **WHEN** a consumer formats semantically identical HuJSON values multiple times
- **THEN** each formatting pass produces the same canonical output bytes

#### Scenario: Format matches upstream Go bytes
- **WHEN** a consumer formats a supported HuJSON input that has an upstream `tailscale/hujson.Format` golden output
- **THEN** the JavaScript/TypeScript formatter emits exactly the same bytes as the upstream Go formatter

#### Scenario: Formatter-dependent policy hash matches upstream GitOps behavior
- **WHEN** a Tailscale policy input is formatted locally and hashed with SHA-256 for ETag comparison
- **THEN** the hash is computed over bytes equivalent to upstream `hujson.Format(data)` so semantically equivalent policies do not force the JavaScript action onto a validate/update path when the Go action would no-op

#### Scenario: Patch applies RFC 6902 operations to the syntax tree
- **WHEN** a consumer applies a valid JSON Patch document to a parsed HuJSON value
- **THEN** the resulting value reflects the patch changes while remaining serializable through the library

#### Scenario: Upstream transformation cases are exercised
- **WHEN** implementation tests run against upstream-derived minimize, standardize, format, and patch cases
- **THEN** each supported case either matches the expected upstream-equivalent output or is marked with a documented intentional divergence
