const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const hujson = require("../../../dist/index.js");

const root = path.resolve(__dirname, "../../..");

function readFixture(...segments) {
  return fs.readFileSync(path.join(root, ...segments), "utf8");
}

function readJsonFixture(...segments) {
  return JSON.parse(readFixture(...segments));
}

test("parse and pack preserve round-trip bytes", () => {
  const source = readFixture("fixtures", "compatibility", "roundtrip", "comments.hujson");
  const value = hujson.parse(source);
  assert.equal(hujson.pack(value), source);
});

test("standard JSON parses without compatibility loss", () => {
  const source = readFixture("fixtures", "compatibility", "valid", "standard.json");
  const value = hujson.parse(source);
  assert.equal(hujson.pack(value), source);
  assert.deepEqual(hujson.toJsonValue(value), { enabled: true, count: 2, items: [1, 2] });
});

test("invalid HuJSON raises a syntax error", () => {
  const source = readFixture("fixtures", "compatibility", "invalid", "unterminated-block-comment.hujson");
  assert.throws(() => hujson.parse(source), /Unterminated block comment/);
});

test("standardize removes HuJSON-only syntax", () => {
  const source = readFixture("fixtures", "compatibility", "valid", "with-comments.hujson");
  const expected = readFixture("fixtures", "compatibility", "valid", "with-comments.standardized.json");
  assert.equal(hujson.standardize(source), expected.trim());
  assert.equal(hujson.minimize(source), expected.trim());
});

test("format is deterministic", () => {
  const source = readFixture("fixtures", "compatibility", "format", "messy.hujson");
  const once = hujson.format(source);
  const twice = hujson.format(once);
  const expected = readFixture("fixtures", "compatibility", "format", "messy.formatted.json");
  assert.equal(once, twice);
  assert.equal(once, expected.trimEnd());
});

test("patch applies RFC 6902 operations", () => {
  const source = readFixture("fixtures", "compatibility", "patch", "document.hujson");
  const operations = JSON.parse(readFixture("fixtures", "compatibility", "patch", "operations.json"));
  const expected = JSON.parse(readFixture("fixtures", "compatibility", "patch", "expected.json"));
  const patched = hujson.patch(source, operations);
  assert.deepEqual(hujson.toJsonValue(patched), expected);
  assert.equal(hujson.pack(patched), JSON.stringify(expected));
});

test("upstream parse, minimize, and standardize cases", () => {
  const manifest = readJsonFixture("fixtures", "compatibility", "upstream", "parse-transform.json");

  for (const fixture of manifest.cases) {
    if (fixture.error) {
      assert.throws(
        () => hujson.parse(fixture.input),
        (error) => error instanceof Error && error.message.includes(fixture.error),
        fixture.name
      );
      continue;
    }

    const value = hujson.parse(fixture.input);
    assert.equal(hujson.pack(value), fixture.pack, fixture.name);

    if (fixture.minimize !== undefined) {
      assert.equal(hujson.minimize(value), fixture.minimize, `${fixture.name} minimize`);
    }

    if (fixture.standardize !== undefined) {
      assert.equal(hujson.standardize(value), fixture.standardize, `${fixture.name} standardize`);
    }
  }
});

test("upstream patch cases", () => {
  const manifest = readJsonFixture("fixtures", "compatibility", "upstream", "patch.json");

  for (const fixture of manifest.cases) {
    if (fixture.error) {
      assert.throws(
        () => hujson.patch(fixture.input, fixture.operations),
        (error) => error instanceof Error && error.message.includes(fixture.error),
        fixture.name
      );
      continue;
    }

    const patched = hujson.patch(fixture.input, fixture.operations);
    assert.deepEqual(hujson.toJsonValue(patched), fixture.json, fixture.name);
  }
});

test("upstream format cases and deterministic fuzz invariants", () => {
  const manifest = readJsonFixture("fixtures", "compatibility", "upstream", "format-fuzz.json");

  for (const fixture of manifest.formatCases) {
    assert.equal(hujson.format(fixture.input), fixture.expected, fixture.name);
  }

  for (const input of manifest.fuzzInputs) {
    const value = hujson.parse(input);
    assert.equal(hujson.pack(value), input);
    assert.doesNotThrow(() => JSON.parse(hujson.standardize(value)), `standardize ${input}`);

    const formatted = hujson.format(value);
    const reparsed = hujson.parse(formatted);
    assert.equal(hujson.format(reparsed), formatted);
  }

  for (const seed of manifest.patchSeeds) {
    if (seed.errorAllowed) {
      try {
        hujson.patch(seed.input, seed.operations);
      } catch (error) {
        assert.ok(error instanceof Error, seed.input);
      }
      continue;
    }

    assert.doesNotThrow(() => hujson.patch(seed.input, seed.operations), seed.input);
  }
});

test("upstream JSON Pointer find and traversal cases", () => {
  const manifest = readJsonFixture("fixtures", "compatibility", "upstream", "pointer-traversal.json");
  const findRoot = hujson.parse(manifest.findInput);

  for (const fixture of manifest.findCases) {
    const found = hujson.find(findRoot, fixture.pointer);
    if (fixture.missing) {
      assert.equal(found, undefined, fixture.pointer);
      continue;
    }

    assert.notEqual(found, undefined, fixture.pointer);
    assert.deepEqual(hujson.toJsonValue(found), fixture.expectedJson, fixture.pointer);
  }

  const allRoot = hujson.parse(manifest.allInput);
  assert.deepEqual([...hujson.all(allRoot)].map((value) => hujson.pack(value)), manifest.allPack);
});
