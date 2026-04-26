## Purpose

Define the core HuJSON parsing and transformation behavior the library must preserve while adapting the API for JavaScript and TypeScript consumers.

## Requirements

### Requirement: HuJSON parsing SHALL preserve exact syntax structure
The JavaScript/TypeScript library SHALL parse HuJSON input into an AST-oriented representation that preserves comments, whitespace, trailing commas, and value ordering closely enough to reproduce the original bytes when no transformations are applied. Implementation tests SHALL include upstream-derived valid and invalid parse cases that assert externally visible behavior such as parse success, parse failure, and exact pack round-tripping.

#### Scenario: Unchanged HuJSON round-trips byte-for-byte
- **WHEN** a consumer parses valid HuJSON input and immediately packs or serializes the returned value without mutating it
- **THEN** the emitted bytes match the original input exactly

#### Scenario: Standard JSON remains valid input
- **WHEN** a consumer parses standard RFC 8259 JSON that contains no HuJSON extensions
- **THEN** the input is accepted and represented as a valid HuJSON AST without compatibility loss

#### Scenario: Upstream invalid parse cases fail predictably
- **WHEN** an implementation parses an upstream-derived invalid HuJSON case that maps to its parser API
- **THEN** parsing fails with an error that identifies the expected failure class or message substring

### Requirement: Core transformations SHALL match upstream HuJSON behavior
The library SHALL expose transformation operations equivalent in practical behavior to upstream `Minimize`, `Standardize`, `Format`, and `Patch`, with any JavaScript-specific API differences documented without changing the normative output semantics. Implementation tests SHALL include upstream-derived transformation and patch cases where the behavior is supported, and SHALL explicitly document any accepted divergence.

#### Scenario: Standardize removes HuJSON-only syntax
- **WHEN** a consumer standardizes a value that contains comments or trailing commas
- **THEN** the resulting output is valid standard JSON with HuJSON-only syntax removed

#### Scenario: Format normalizes layout deterministically
- **WHEN** a consumer formats semantically identical HuJSON values multiple times
- **THEN** each formatting pass produces the same canonical output bytes

#### Scenario: Patch applies RFC 6902 operations to the syntax tree
- **WHEN** a consumer applies a valid JSON Patch document to a parsed HuJSON value
- **THEN** the resulting value reflects the patch changes while remaining serializable through the library

#### Scenario: Upstream transformation cases are exercised
- **WHEN** implementation tests run against upstream-derived minimize, standardize, format, and patch cases
- **THEN** each supported case either matches the expected upstream-equivalent output or is marked with a documented intentional divergence

### Requirement: Pointer lookup and traversal behavior SHALL be covered where exposed
Implementations SHALL test upstream-derived JSON Pointer lookup and value traversal behavior when their public API exposes equivalent operations, and SHALL document unsupported upstream helpers when no equivalent API exists.

#### Scenario: JSON Pointer lookup matches upstream cases
- **WHEN** an implementation exposes JSON Pointer lookup behavior and runs the upstream-derived pointer fixture cases
- **THEN** valid pointers resolve to the expected values and invalid pointers report no match or an equivalent failure result

#### Scenario: Traversal order matches upstream cases
- **WHEN** an implementation exposes traversal over all values and runs the upstream-derived traversal fixture cases
- **THEN** values are visited in the same observable order as the upstream traversal case

### Requirement: Deterministic fuzz seed invariants SHALL be covered
Implementations SHALL use upstream fuzz seed inputs as deterministic tests for core invariants instead of relying only on random fuzzing.

#### Scenario: Valid fuzz seeds preserve core invariants
- **WHEN** an implementation runs deterministic fuzz seed cases derived from upstream tests
- **THEN** valid inputs pack exactly, standardized outputs are valid JSON, formatted outputs are parsable and idempotent, and patch seed cases do not crash

### Requirement: Public API differences from upstream SHALL be explicit and minimal
The library SHALL preserve the practical upstream feature set while documenting any differences that arise from JavaScript and TypeScript language constraints, including type modeling and mutation style.

#### Scenario: Go-specific constructs are adapted without hiding the difference
- **WHEN** an upstream capability depends on a Go-specific type or calling pattern that does not map directly to JavaScript/TypeScript
- **THEN** the JavaScript/TypeScript API documents the adapted form and preserves the same user-visible behavior where practical
