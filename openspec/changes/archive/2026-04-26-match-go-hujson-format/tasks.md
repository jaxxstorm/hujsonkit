## 1. Upstream Formatter Fixtures

- [x] 1.1 Add language-agnostic fixtures for upstream `tailscale/hujson.Format` outputs that currently diverge, including duplicate object members and compact array/object spacing.
- [x] 1.2 Add a realistic Tailscale policy fixture with upstream Go formatted bytes and the expected SHA-256 hash `bb56d706b5246ba38a8427768948eca9cc116158badc0c216282fd2f19f5af29`.
- [x] 1.3 Update fixture provenance to cite the upstream formatter and GitOps pusher hash behavior, and remove formatter divergence notes for supported format cases.

## 2. Formatter Implementation

- [x] 2.1 Replace the `JSON.stringify`-based formatter with syntax-tree formatting that preserves duplicate object members and normalizes comments, commas, and whitespace in the upstream-compatible shape.
- [x] 2.2 Preserve parse/pack byte-for-byte round-trip behavior for unchanged values while changing only explicit `format` output.
- [x] 2.3 Keep the public TypeScript/JavaScript `format` API shape stable.

## 3. Compatibility Tests

- [x] 3.1 Update format fixture tests so supported format cases assert exact upstream Go formatter bytes instead of bootstrap pretty JSON output.
- [x] 3.2 Add a formatter hash test that computes SHA-256 over `format(policyInput)` and matches the upstream Go GitOps pusher hash.
- [x] 3.3 Keep deterministic fuzz invariants for formatted output: formatted bytes parse successfully and formatting is idempotent.

## 4. Documentation and Validation

- [x] 4.1 Update README/API documentation to state that `format` aims to match upstream `tailscale/hujson.Format` bytes for supported inputs.
- [x] 4.2 Run the full repository verification command and confirm no package or consumer regressions.
- [x] 4.3 Confirm the local JavaScript formatter no longer produces the previous mismatched hash `9c98a06f82762ac86c349a74679db2213e85d7fd4c43d464e90e3741d113c490` for the policy fixture.
