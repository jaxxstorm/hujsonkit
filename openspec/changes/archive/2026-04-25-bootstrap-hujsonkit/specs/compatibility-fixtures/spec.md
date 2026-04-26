## ADDED Requirements

### Requirement: Compatibility fixtures SHALL cover upstream HuJSON semantics
The repository SHALL include shared fixtures and expected outputs that exercise the `tailscale/hujson` behavior being targeted, including comments, trailing commas, formatting behavior, patch behavior, valid standard JSON, and invalid input handling.

#### Scenario: Fixtures include HuJSON extension cases
- **WHEN** a maintainer inspects the shared fixture set
- **THEN** it contains examples that cover line comments, block comments, trailing commas, and mixed whitespace/comment placement

#### Scenario: Fixtures include failure cases
- **WHEN** a maintainer inspects the shared fixture set
- **THEN** it contains invalid-input cases with expected parse failures so parser behavior can be checked consistently

### Requirement: Compatibility verification SHALL include byte-preserving round trips
The test strategy SHALL include shared cases that prove unchanged parsed values serialize back to the original bytes for supported inputs.

#### Scenario: Round-trip fixture validates exact preservation
- **WHEN** a shared round-trip fixture is parsed and then serialized without mutation
- **THEN** the serialized bytes match the original fixture bytes exactly

### Requirement: Fixture provenance and intentional deviations SHALL be documented
Any fixture derived from upstream `tailscale/hujson` tests or behavior SHALL record its source or rationale, and any intentional JavaScript/TypeScript divergence SHALL be documented alongside the affected compatibility case.

#### Scenario: Intentional divergence is discoverable
- **WHEN** the JavaScript/TypeScript implementation intentionally differs from upstream because of language constraints
- **THEN** the related fixture or compatibility documentation explains the difference and why it is accepted
