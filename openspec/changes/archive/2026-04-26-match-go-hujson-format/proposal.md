## Why

Formatter byte compatibility now affects real GitOps behavior: Tailscale's Go action hashes `hujson.Format(data)` before comparing local policy state with the control-plane ETag, while the JavaScript action hashes this package's formatter output. Because the current JavaScript formatter emits different bytes for semantically equivalent policy input, the JavaScript action can take the validate/update path when the Go action correctly short-circuits as a no-op.

## What Changes

- Make the TypeScript/JavaScript `format` implementation semantically and byte-realistic with upstream `tailscale/hujson.Format` for supported HuJSON inputs.
- Add compatibility fixtures that include the policy-hash mismatch case and upstream-derived formatter outputs, including duplicate object member handling and array/object spacing.
- Replace the current documented formatter divergence with a requirement that formatter output used for local ETag calculation matches upstream Go bytes where the upstream behavior maps to JavaScript/TypeScript.
- Preserve parse/pack byte round-tripping and existing standardize/minimize behavior unless a fixture proves a change is required for Go formatter compatibility.
- No breaking public API shape changes are intended.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `hujson-core`: Strengthen `Format` requirements so JavaScript/TypeScript formatter bytes match upstream `tailscale/hujson.Format` for supported cases, including formatter-dependent hash/ETag use.
- `compatibility-fixtures`: Update shared fixture expectations and provenance so upstream formatter byte compatibility is tested rather than documented as an accepted bootstrap divergence.

## Impact

- Affected code: TypeScript formatter implementation, formatter fixtures, compatibility tests, and provenance documentation.
- Compatibility impact: improves compatibility with `tailscale/hujson` and the Tailscale GitOps pusher behavior that formats policy bytes before hashing.
- Behavioral differences from upstream should become explicit exceptions only for unsupported or intentionally unmapped edge cases; the known local ETag mismatch for semantically equivalent policy input must be resolved.
- Packaging impact: downstream Node.js and GitHub TypeScript Action consumers keep the same import surface, but formatter output bytes may change to match upstream Go.
