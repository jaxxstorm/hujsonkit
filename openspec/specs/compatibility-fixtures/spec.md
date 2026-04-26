## Purpose

Define the shared fixture set and compatibility documentation needed to validate JavaScript/TypeScript behavior against upstream HuJSON semantics.

## Requirements

### Requirement: Compatibility fixtures SHALL cover upstream HuJSON semantics
The repository SHALL include shared fixtures and expected outputs that exercise the `tailscale/hujson` behavior being targeted, including comments, trailing commas, formatting behavior, patch behavior, valid standard JSON, invalid input handling, JSON Pointer lookup behavior, traversal order, and deterministic fuzz seed invariants. The shared fixture corpus SHALL include upstream-derived cases from the Go `hujson` tests where those cases map to language-agnostic behavior.

#### Scenario: Fixtures include HuJSON extension cases
- **WHEN** a maintainer inspects the shared fixture set
- **THEN** it contains examples that cover line comments, block comments, trailing commas, and mixed whitespace/comment placement

#### Scenario: Fixtures include failure cases
- **WHEN** a maintainer inspects the shared fixture set
- **THEN** it contains invalid-input cases with expected parse failures so parser behavior can be checked consistently

#### Scenario: Fixtures include upstream parse and transformation cases
- **WHEN** a maintainer inspects the shared fixture set
- **THEN** it contains upstream-derived parse, minimize, standardize, and format cases with expected outputs or documented divergence metadata

#### Scenario: Fixtures include upstream patch and pointer cases
- **WHEN** a maintainer inspects the shared fixture set
- **THEN** it contains upstream-derived RFC 6902 patch cases and JSON Pointer lookup cases with expected outputs, expected errors, or documented divergence metadata

### Requirement: Compatibility verification SHALL include byte-preserving round trips
The test strategy SHALL include shared cases that prove unchanged parsed values serialize back to the original bytes for supported inputs.

#### Scenario: Round-trip fixture validates exact preservation
- **WHEN** a shared round-trip fixture is parsed and then serialized without mutation
- **THEN** the serialized bytes match the original fixture bytes exactly

### Requirement: Fixture provenance and intentional deviations SHALL be documented
Any fixture derived from upstream `tailscale/hujson` tests or behavior SHALL record its source or rationale, and any intentional JavaScript/TypeScript divergence SHALL be documented alongside the affected compatibility case.

#### Scenario: Intentional divergence is discoverable
- **WHEN** the JavaScript/TypeScript implementation intentionally differs from upstream because of language constraints or documented bootstrap behavior
- **THEN** the related fixture or compatibility documentation explains the difference and why it is accepted

#### Scenario: Upstream-derived fixture source is discoverable
- **WHEN** a fixture is derived from an upstream `tailscale/hujson` test group
- **THEN** the fixture metadata or provenance documentation identifies the upstream test group and the kind of behavior being covered

### Requirement: Shared upstream fixtures SHALL remain reusable across implementations
The upstream-derived compatibility fixtures SHALL use language-agnostic data formats and expected observable behavior so JavaScript/TypeScript and future language implementations can consume the same corpus without copying implementation-specific test code.

#### Scenario: Future implementation consumes shared corpus
- **WHEN** a future language implementation adds compatibility tests
- **THEN** it can read the shared upstream-derived fixture files and evaluate the cases that map to its public API without depending on JavaScript test helpers
