import assert from "node:assert/strict";
import { parse, standardize } from "hujsonkit";

const value = parse('{"flag": true}');
assert.equal(standardize(value), '{"flag":true}');
