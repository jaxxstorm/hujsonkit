import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

test("clean TypeScript build emits usable CommonJS and declarations", () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), "hujsonkit-build-"));
  try {
    execFileSync(process.execPath, [
      path.join(repoRoot, "node_modules", "typescript", "bin", "tsc"),
      "-p", path.join(repoRoot, "js", "ts", "tsconfig.json"),
      "--outDir", output
    ], { cwd: repoRoot, stdio: "pipe" });
    const { parse, toJsonValue } = require(path.join(output, "index.js"));
    assert.deepEqual(toJsonValue(parse('{/* comment */"answer":42,}')), { answer: 42 });
    assert.match(fs.readFileSync(path.join(output, "index.d.ts"), "utf8"), /parse/);
    for (const module of ["core", "parser", "types"]) {
      assert.ok(fs.statSync(path.join(output, `${module}.d.ts`)).size > 0);
    }
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});
