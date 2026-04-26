## ADDED Requirements

### Requirement: HuJSON parsing SHALL preserve exact syntax structure
The JavaScript/TypeScript library SHALL parse HuJSON input into an AST-oriented representation that preserves comments, whitespace, trailing commas, and value ordering closely enough to reproduce the original bytes when no transformations are applied.

#### Scenario: Unchanged HuJSON round-trips byte-for-byte
- **WHEN** a consumer parses valid HuJSON input and immediately packs or serializes the returned value without mutating it
- **THEN** the emitted bytes match the original input exactly

#### Scenario: Standard JSON remains valid input
- **WHEN** a consumer parses standard RFC 8259 JSON that contains no HuJSON extensions
- **THEN** the input is accepted and represented as a valid HuJSON AST without compatibility loss

### Requirement: Core transformations SHALL match upstream HuJSON behavior
The library SHALL expose transformation operations equivalent in practical behavior to upstream `Minimize`, `Standardize`, `Format`, and `Patch`, with any JavaScript-specific API differences documented without changing the normative output semantics.

#### Scenario: Standardize removes HuJSON-only syntax
- **WHEN** a consumer standardizes a value that contains comments or trailing commas
- **THEN** the resulting output is valid standard JSON with HuJSON-only syntax removed

#### Scenario: Format normalizes layout deterministically
- **WHEN** a consumer formats semantically identical HuJSON values multiple times
- **THEN** each formatting pass produces the same canonical output bytes

#### Scenario: Patch applies RFC 6902 operations to the syntax tree
- **WHEN** a consumer applies a valid JSON Patch document to a parsed HuJSON value
- **THEN** the resulting value reflects the patch changes while remaining serializable through the library

### Requirement: Public API differences from upstream SHALL be explicit and minimal
The library SHALL preserve the practical upstream feature set while documenting any differences that arise from JavaScript and TypeScript language constraints, including type modeling and mutation style.

#### Scenario: Go-specific constructs are adapted without hiding the difference
- **WHEN** an upstream capability depends on a Go-specific type or calling pattern that does not map directly to JavaScript/TypeScript
- **THEN** the JavaScript/TypeScript API documents the adapted form and preserves the same user-visible behavior where practical
