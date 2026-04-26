## Context

`hujsonkit` is starting from an empty repository and needs an initial architecture that can deliver a JavaScript/TypeScript implementation compatible with `github.com/tailscale/hujson` without painting future language ports into a corner. The upstream Go package is AST-oriented, preserves comments and whitespace for round-tripping, and exposes transformation operations such as `Format`, `Standardize`, `Minimize`, and `Patch`; the bootstrap design needs to keep those compatibility goals central while also making the package straightforward to publish to npm and consume from Node.js and GitHub Actions.

The user has already constrained the implementation to use a `js/ts` directory. That means the design must separate language-specific code from shared fixtures and specs while still keeping the package install path simple enough for npm publication and practical git-based consumption.

## Goals / Non-Goals

**Goals:**
- Establish a repository layout with `js/ts` as the TypeScript/JavaScript implementation area and shared top-level locations for fixtures and compatibility data.
- Preserve the upstream mental model of parsing HuJSON into an exact syntax tree that can be packed back to byte-identical output when unchanged.
- Define a minimal public module surface that cleanly maps to upstream capabilities: parse, pack, format, standardize, minimize, patch, and AST/value access.
- Make the package publishable to npm and usable from Node.js and GitHub TypeScript Actions with stable entrypoints and generated type declarations.
- Keep compatibility validation reusable across future language ports by storing golden inputs and expected outputs outside the language implementation directory.

**Non-Goals:**
- Reproducing every Go-specific type or method name exactly where JavaScript and TypeScript idioms make that unnatural.
- Delivering a CLI in the bootstrap unless it is needed to validate formatting behavior later.
- Adding external parsing or formatting dependencies during bootstrap.
- Solving cross-language implementation details beyond leaving room for them in the repository shape and fixtures.

## Decisions

### Keep implementation code in `js/ts`, but keep shared assets at the repository root
The implementation will live under `js/ts/` with source, tests, and toolchain files scoped there. Shared fixtures, upstream compatibility cases, and repository-level OpenSpec artifacts stay outside `js/ts/` so a future `python/` or similar directory can reuse the same inputs and expectations.

Alternative considered: making `js/ts/` the entire npm package root with all fixtures nested inside it. Rejected because it couples compatibility data to one language and makes later ports harder.

### Use an AST-first library model that mirrors upstream behavior
The JavaScript/TypeScript implementation should expose a parser that returns a syntax-preserving value tree rather than directly coercing into plain JavaScript objects. Pack/serialize behavior should emit byte-identical output for unchanged parsed values, while transformation methods operate on the syntax tree and intentionally change the output.

Alternative considered: parsing directly into plain objects plus comment metadata side tables. Rejected because byte-preserving behavior, comment placement, and patch/format semantics become much harder to implement correctly.

### Separate public API compatibility from internal representation details
The public surface should preserve the practical upstream capabilities, but internal types may be adapted for JavaScript and TypeScript. The design will prefer a small set of exports that cover parsing, serialization, transformation, patching, and typed AST access, with any upstream differences documented explicitly in the specs.

Alternative considered: copying the Go API shape one-for-one. Rejected because some Go constructs and mutation patterns do not translate cleanly to JavaScript module consumers.

### Keep packaging simple for npm and git-based consumers
The repository root should own the package-manager entrypoint and release metadata needed for installs, while implementation sources remain under `js/ts/`. The resulting package should expose stable root imports and bundled type declarations so a GitHub Action or Node.js project can install the repo without needing custom path knowledge.

Alternative considered: publishing only from `js/ts/` as an isolated subpackage. Rejected because it complicates direct git consumption and splits repository identity from package identity.

### Treat compatibility fixtures as a first-class deliverable
The bootstrap should define shared fixtures covering valid HuJSON, invalid inputs, formatting cases, patch cases, and byte-preservation round trips. These fixtures should be readable by the JavaScript/TypeScript test suite now and by future language implementations later.

Alternative considered: writing only implementation-local tests in `js/ts/`. Rejected because it weakens the compatibility contract and makes later ports duplicate test data.

### Default to zero external runtime dependencies
The bootstrap should rely on the JavaScript/TypeScript standard library unless a concrete gap appears during implementation. This reduces supply-chain risk and keeps the library easier to embed in automation contexts.

Alternative considered: adopting parser-generator or patch-helper dependencies up front. Rejected because the requirements are narrow, correctness-sensitive, and better controlled in first-party code at bootstrap time.

## Risks / Trade-offs

- [Git install ergonomics may still be awkward when implementation code is nested under `js/ts`] -> Mitigation: keep package entrypoints and release metadata discoverable from the repository root and validate installation paths during bootstrap.
- [Upstream API mapping may not be perfectly one-to-one in JavaScript/TypeScript] -> Mitigation: keep specs focused on behavioral compatibility and document any intentional API differences explicitly.
- [AST fidelity increases implementation complexity compared with plain object parsing] -> Mitigation: make the AST model the core primitive from the start so formatting, patching, and round-trip behavior are built on the same representation.
- [Shared fixtures can drift from upstream behavior over time] -> Mitigation: organize fixtures around upstream semantics and include documented provenance for any imported or adapted cases.
- [No external dependencies may lengthen initial implementation time] -> Mitigation: accept the slower bootstrap in exchange for tighter correctness control and only revisit dependencies if a specific requirement cannot be met safely.
