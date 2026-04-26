## Purpose

Define the repository structure and package bootstrap expectations for the initial JavaScript/TypeScript implementation.

## Requirements

### Requirement: Repository layout SHALL isolate language-specific code from shared assets
The repository SHALL place the initial JavaScript/TypeScript implementation under `js/ts` and SHALL keep shared fixtures, golden data, and other cross-language assets outside that directory so future implementations can reuse them without restructuring the repository.

#### Scenario: Shared compatibility data is reusable across languages
- **WHEN** a future language implementation is added to the repository
- **THEN** it can consume the same shared fixture and golden data without moving the existing `js/ts` implementation

### Requirement: Package entrypoints SHALL be straightforward for Node.js and GitHub Actions consumers
The bootstrap SHALL define package entrypoints, type declarations, build outputs, and build lifecycle hooks so consumers can install and import the library from npm or directly from the repository without needing language-internal paths such as `js/ts/src`. The published package SHALL include the generated `dist/` assets, and git-backed installs SHALL be able to build those assets through the repository's standard package lifecycle.

#### Scenario: Node.js consumer uses stable root import
- **WHEN** a Node.js consumer installs the package
- **THEN** the consumer imports documented root entrypoints rather than referencing source files inside `js/ts`

#### Scenario: GitHub Action consumer resolves TypeScript types
- **WHEN** a GitHub TypeScript Action installs the package and uses TypeScript tooling
- **THEN** the package exposes type declarations and module resolution that work without custom path patching

#### Scenario: Git-backed install builds generated package entrypoints
- **WHEN** a consumer installs the package directly from the repository through a git-based dependency reference
- **THEN** the package lifecycle builds the generated `dist/` entrypoints needed for the documented root import paths

### Requirement: Bootstrap SHALL prefer first-party implementation over new runtime dependencies
The initial repository bootstrap SHALL default to standard-library and first-party code for parsing, formatting, and patching concerns unless a later change explicitly justifies an external dependency and its security trade-offs.

#### Scenario: Bootstrap implementation adds no unjustified runtime dependency
- **WHEN** the initial package bootstrap is implemented
- **THEN** runtime dependencies are absent unless the change documentation explicitly records why they are required
