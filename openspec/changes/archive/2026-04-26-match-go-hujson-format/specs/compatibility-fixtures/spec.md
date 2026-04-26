## MODIFIED Requirements

### Requirement: Compatibility fixtures SHALL cover upstream HuJSON semantics
The repository SHALL include shared fixtures and expected outputs that exercise the `tailscale/hujson` behavior being targeted, including comments, trailing commas, formatting behavior, formatter-dependent hash behavior, patch behavior, valid standard JSON, invalid input handling, JSON Pointer lookup behavior, traversal order, and deterministic fuzz seed invariants. The shared fixture corpus SHALL include upstream-derived cases from the Go `hujson` tests where those cases map to language-agnostic behavior.

#### Scenario: Fixtures include HuJSON extension cases
- **WHEN** a maintainer inspects the shared fixture set
- **THEN** it contains examples that cover line comments, block comments, trailing commas, and mixed whitespace/comment placement

#### Scenario: Fixtures include failure cases
- **WHEN** a maintainer inspects the shared fixture set
- **THEN** it contains invalid-input cases with expected parse failures so parser behavior can be checked consistently

#### Scenario: Fixtures include upstream parse and transformation cases
- **WHEN** a maintainer inspects the shared fixture set
- **THEN** it contains upstream-derived parse, minimize, standardize, and format cases with expected outputs or documented divergence metadata

#### Scenario: Fixtures include upstream formatter hash cases
- **WHEN** a maintainer inspects the shared fixture set
- **THEN** it contains at least one realistic Tailscale policy input with the upstream Go `hujson.Format` output and SHA-256 hash used to validate formatter-dependent ETag behavior

#### Scenario: Fixtures include upstream patch and pointer cases
- **WHEN** a maintainer inspects the shared fixture set
- **THEN** it contains upstream-derived RFC 6902 patch cases and JSON Pointer lookup cases with expected outputs, expected errors, or documented divergence metadata

### Requirement: Fixture provenance and intentional deviations SHALL be documented
Any fixture derived from upstream `tailscale/hujson` tests or behavior SHALL record its source or rationale, and any intentional JavaScript/TypeScript divergence SHALL be documented alongside the affected compatibility case. Formatter fixtures that represent supported upstream behavior SHALL use upstream Go bytes as the expected output rather than documenting the current JavaScript formatter output as an accepted divergence.

#### Scenario: Intentional divergence is discoverable
- **WHEN** the JavaScript/TypeScript implementation intentionally differs from upstream because of language constraints or documented unsupported behavior
- **THEN** the related fixture or compatibility documentation explains the difference and why it is accepted

#### Scenario: Upstream-derived fixture source is discoverable
- **WHEN** a fixture is derived from an upstream `tailscale/hujson` test group or GitOps formatter/hash behavior
- **THEN** the fixture metadata or provenance documentation identifies the upstream source and the kind of behavior being covered

#### Scenario: Formatter divergence is not accepted for supported cases
- **WHEN** a format fixture covers supported upstream `tailscale/hujson.Format` behavior
- **THEN** fixture provenance does not mark differing JavaScript `JSON.stringify` pretty output as an accepted compatibility divergence
