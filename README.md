# hujsonkit

`hujsonkit` is a TypeScript/JavaScript HuJSON library built to track the practical behavior of [`github.com/tailscale/hujson`](https://github.com/tailscale/hujson).

## What it does

- Parses HuJSON with comments and trailing commas.
- Preserves the original bytes for parsed values that are packed without mutation.
- Exposes AST-first helpers for parsing, packing, standardizing, minimizing, formatting, and applying JSON Patch operations.
- Publishes from the repository root while keeping the implementation in `js/ts` and shared fixtures at the repository root.

## Usage

```js
const { parse, pack, standardize, format, patch } = require("hujsonkit");

const value = parse('{\n  // comment\n  "name": "demo",\n}\n');

console.log(pack(value));
console.log(standardize(value));
console.log(format(value));

const patched = patch(value, [
  { op: "add", path: "/enabled", value: true }
]);

console.log(pack(patched));
```

## Development

- Run `npm run verify` before opening a pull request. It covers unit tests, npm package contents, published-package consumer checks, and direct repository consumer checks.
- The pull request workflow runs the same `npm run verify` contract on GitHub Actions for pull requests against `main`.
- Direct repository installs rely on the existing `prepare` lifecycle to build `dist/`, so `dist/` remains generated output rather than a committed source artifact.

## Release

Releases are prepared locally and published by GitHub Actions after a matching version tag is pushed. The same tag-triggered workflow publishes the package to npm and creates the matching GitHub Release.

1. Start from `main` with a clean working tree.
2. Prepare the release with one semver increment or an explicit version:

   ```sh
   npm run release:prepare -- patch
   npm run release:prepare -- minor
   npm run release:prepare -- major
   npm run release:prepare -- 1.2.3
   ```

3. Review the generated release commit and annotated tag:

   ```sh
   git show --stat HEAD
   git tag --list "v*" --sort=-version:refname | head
   ```

4. Push the release commit and tag together:

   ```sh
   git push origin HEAD v1.2.3
   ```

Pushing the `v<version>` tag starts the `publish` workflow. The workflow installs dependencies, verifies that the tag exactly matches the root `package.json` version, runs `npm run verify`, publishes to npm with npm trusted publishing through GitHub Actions OIDC, and creates the matching GitHub Release with generated release notes. If the tag and package version differ, the workflow fails before `npm publish` and before GitHub Release creation.

The package must be configured on npmjs.com with a trusted publisher for this repository and the `.github/workflows/publish.yml` workflow. No `NPM_TOKEN` repository secret is used for publication. GitHub Release creation uses the workflow's repository `contents: write` permission through the default GitHub token.

## API differences from `tailscale/hujson`

- The library exposes pure functions such as `parse`, `pack`, `standardize`, `minimize`, `format`, and `patch` instead of Go-style methods that mutate a receiver in place.
- `format` produces deterministic HuJSON output that aims to match upstream `tailscale/hujson.Format` bytes for supported inputs, including comments, spacing, duplicate object members, and the trailing newline used by formatter-dependent hashes.
- `patch` applies RFC 6902 operations against the standardized JSON model and returns a fresh HuJSON AST. Comment placement is not preserved across patch operations in this bootstrap.

The unchanged parse/pack round-trip remains byte-preserving, which is the main compatibility guarantee needed to safely read and write HuJSON inputs before transformation.
