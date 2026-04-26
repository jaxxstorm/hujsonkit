## Context

The package already has a build, test, and verification flow in `package.json`, including `prepare`, `test`, `check:package`, `check:consumers`, and `verify`. What is missing is repository automation that runs those checks for pull requests and a controlled path to publish the generated `dist/` package to npm. The design needs to preserve the current package layout and compatibility guarantees while making releases repeatable from GitHub without introducing runtime dependencies or coupling the repository to JavaScript-specific source paths.

## Goals / Non-Goals

**Goals:**
- Add a pull request workflow that runs the existing repository verification commands on GitHub-hosted runners.
- Add a publish workflow that builds the package from the repository state and publishes the npm tarball using standard npm authentication.
- Preserve the current root package entrypoints so npm consumers and git-based installs continue to resolve the package through `dist/` and the existing `prepare` hook.
- Keep the automation specific to the TypeScript/JavaScript package while leaving room for future language implementations to add their own workflows beside it.

**Non-Goals:**
- Changing the public HuJSON API or runtime behavior.
- Introducing semantic-release style version management or automated changelog generation.
- Publishing multiple packages or adding multi-language release automation in this change.

## Decisions

### Reuse existing npm scripts as the CI contract
The pull request workflow will call the existing repository scripts rather than duplicating build steps in YAML. Using `npm ci` followed by `npm run verify` keeps the workflow aligned with local development and preserves the packaging and consumer checks already defined by the repository.

Alternative considered: splitting the workflow into several hand-written steps for build, unit tests, and package checks. Rejected because it would duplicate the repository contract in two places and make future updates easier to miss.

### Publish from GitHub Actions using the built package tarball
The release workflow will install dependencies, run the existing verification/build path, and publish to npm using the package metadata rooted at the repository top level. This keeps `dist/` as a generated artifact rather than a committed asset while ensuring the published tarball still contains the generated files declared in `package.json`.

Alternative considered: committing `dist/` and publishing prebuilt files directly from the repository. Rejected because it adds generated output to source control and creates drift risk between source and build artifacts.

### Trigger release from version tags
The publish workflow should run only when a `v*` version tag is pushed instead of on every merge to the default branch or through an ad hoc manual dispatch. That keeps npm publication intentional, ties releases to a durable repository reference, and avoids accidental releases while the package is still iterating.

Alternative considered: publishing automatically on every push to the default branch. Rejected because the repository currently uses a development version and does not yet define a broader release management process.

### Keep workflow scope package-specific but future-friendly
The workflows will operate on the current root package and existing JavaScript/TypeScript scripts without moving shared fixtures or restructuring the repository. If a future language implementation is added, it can introduce its own verification and release jobs without undoing this automation.

Alternative considered: designing a cross-language workflow abstraction now. Rejected because there is only one implementation today and premature generalization would add complexity without immediate value.

## Risks / Trade-offs

- [Accidental npm publication from an incomplete release trigger] -> Restrict publishing to an explicit trigger and require repository secrets/permissions dedicated to npm release.
- [CI becomes slower because `verify` rebuilds and exercises consumer checks] -> Accept the additional runtime for now because it provides the strongest pre-merge signal for packaging correctness.
- [Git-based installs fail if build prerequisites drift from the published workflow] -> Keep `prepare` as the source-of-truth build hook and validate package contents through the existing packaging checks.
- [Workflow logic becomes JavaScript-specific] -> Limit the workflows to repository scripts and package publishing concerns, leaving room for additional language-specific jobs later.
