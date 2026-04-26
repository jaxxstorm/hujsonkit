## MODIFIED Requirements

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
