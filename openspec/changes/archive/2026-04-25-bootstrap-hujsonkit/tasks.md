## 1. Repository bootstrap

- [x] 1.1 Create the root package-manager metadata and build scripts needed to install the library from the repository root while keeping implementation code under `js/ts`.
- [x] 1.2 Add the initial `js/ts` source, test, and TypeScript configuration layout plus shared top-level fixture directories for future language reuse.
- [x] 1.3 Define package entrypoints and type declaration outputs so documented root imports do not expose internal `js/ts/src` paths.

## 2. AST and parser foundation

- [x] 2.1 Implement the core AST/value model for literals, arrays, objects, and preserved extra syntax such as comments and whitespace.
- [x] 2.2 Implement a HuJSON parser that accepts standard JSON plus comments and trailing commas and records enough syntax detail for exact round-tripping.
- [x] 2.3 Implement packing/serialization for parsed values and add tests proving unchanged inputs serialize byte-for-byte.

## 3. Transformation and compatibility behavior

- [x] 3.1 Implement `standardize` and `minimize` behavior that removes HuJSON-only syntax while producing valid standard JSON output.
- [x] 3.2 Implement deterministic `format` behavior and tests that prove repeated formatting produces stable output.
- [x] 3.3 Implement RFC 6902 patch application on the HuJSON AST and verify patched values remain serializable.
- [x] 3.4 Document any intentional JavaScript/TypeScript API differences from `tailscale/hujson` in the package API surface and compatibility notes.

## 4. Shared fixtures and verification

- [x] 4.1 Add shared compatibility fixtures for valid HuJSON, standard JSON, invalid inputs, formatting cases, and patch cases with documented provenance where applicable.
- [x] 4.2 Add shared round-trip fixture coverage that proves byte-preserving serialization for unchanged parsed values.
- [x] 4.3 Wire the JavaScript/TypeScript test suite to consume the shared fixtures instead of duplicating implementation-local copies.

## 5. Packaging validation

- [x] 5.1 Add npm packaging checks that confirm the published artifact exposes the intended root entrypoints and generated type declarations.
- [x] 5.2 Validate installation and import from a Node.js consumer scenario and a GitHub TypeScript Action-like scenario.
- [x] 5.3 Run the full build and test workflow, including compatibility-focused cases, before marking the bootstrap complete.
