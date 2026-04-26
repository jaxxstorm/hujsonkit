import assert from "node:assert/strict";
import { parse, standardize } from "@jaxxstorm/hujsonkit";

const value = parse('{"flag": true}');
assert.equal(standardize(value), '{"flag":true}');
