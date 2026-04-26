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

## API differences from `tailscale/hujson`

- The library exposes pure functions such as `parse`, `pack`, `standardize`, `minimize`, `format`, and `patch` instead of Go-style methods that mutate a receiver in place.
- `format` produces deterministic standard JSON output. In this bootstrap it intentionally strips HuJSON comments and trailing commas instead of preserving comment placement like the upstream Go formatter.
- `patch` applies RFC 6902 operations against the standardized JSON model and returns a fresh HuJSON AST. Comment placement is not preserved across patch operations in this bootstrap.

The unchanged parse/pack round-trip remains byte-preserving, which is the main compatibility guarantee needed to safely read and write HuJSON inputs before transformation.
