import { parse as parseInput } from "./parser";
import {
  FormatOptions,
  HujsonArray,
  HujsonLiteral,
  HujsonObject,
  HujsonObjectMember,
  HujsonValue,
  JsonPatchOperation,
  JsonValue
} from "./types";

export function parse(input: string | Uint8Array): HujsonValue {
  return parseInput(input);
}

export function pack(value: HujsonValue): string {
  return packValue(value, true);
}

export function clone(value: HujsonValue): HujsonValue {
  switch (value.kind) {
    case "literal":
      return { ...value };
    case "array":
      return {
        ...value,
        elements: value.elements.map((element) => clone(element))
      };
    case "object":
      return {
        ...value,
        members: value.members.map((member) => ({
          name: clone(member.name) as HujsonLiteral,
          value: clone(member.value)
        }))
      };
  }
}

export function toJsonValue(value: HujsonValue): JsonValue {
  switch (value.kind) {
    case "literal":
      return JSON.parse(value.raw) as JsonValue;
    case "array":
      return value.elements.map((element) => toJsonValue(element));
    case "object": {
      const result: { [key: string]: JsonValue } = {};
      for (const member of value.members) {
        result[JSON.parse(member.name.raw) as string] = toJsonValue(member.value);
      }
      return result;
    }
  }
}

export function fromJsonValue(value: JsonValue): HujsonValue {
  const node = fromJsonValueInternal(value);
  node.after = "";
  return node;
}

export function find(value: HujsonValue, pointer: string): HujsonValue | undefined {
  let current: HujsonValue | undefined = value;
  let tokens: string[];

  try {
    tokens = decodePointer(pointer);
  } catch {
    return undefined;
  }

  for (const token of tokens) {
    if (!current) {
      return undefined;
    }

    if (current.kind === "array") {
      if (!/^\d+$/.test(token) || (token.length > 1 && token.startsWith("0"))) {
        return undefined;
      }
      current = current.elements[Number(token)];
      continue;
    }

    if (current.kind === "object") {
      const member: HujsonObjectMember | undefined = current.members.find((item) => JSON.parse(item.name.raw) === token);
      current = member?.value;
      continue;
    }

    return undefined;
  }

  return current;
}

export function* all(value: HujsonValue): Iterable<HujsonValue> {
  yield value;

  if (value.kind === "array") {
    for (const element of value.elements) {
      yield* all(element);
    }
    return;
  }

  if (value.kind === "object") {
    for (const member of value.members) {
      yield member.name;
      yield* all(member.value);
    }
  }
}

function fromJsonValueInternal(value: JsonValue): HujsonValue {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return childLiteral(JSON.stringify(value));
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("Non-finite numbers are not valid JSON values");
    }
    return childLiteral(JSON.stringify(value));
  }

  if (Array.isArray(value)) {
    const elements = value.map((item) => fromJsonValueInternal(item));
    for (let index = 0; index < elements.length - 1; index += 1) {
      elements[index].after = "";
    }
    return {
      kind: "array",
      before: "",
      after: null,
      afterExtra: "",
      elements
    };
  }

  const members: HujsonObjectMember[] = Object.keys(value).map((key) => ({
    name: literal(JSON.stringify(key)),
    value: fromJsonValueInternal(value[key])
  }));
  for (let index = 0; index < members.length - 1; index += 1) {
    members[index].value.after = "";
  }

  return {
    kind: "object",
    before: "",
    after: null,
    afterExtra: "",
    members
  };
}

export function standardize(input: string | Uint8Array | HujsonValue): string {
  return JSON.stringify(toJsonValue(asValue(input)));
}

export function minimize(input: string | Uint8Array | HujsonValue): string {
  return standardize(input);
}

export function format(input: string | Uint8Array | HujsonValue, options: FormatOptions = {}): string {
  const indent = typeof options.indent === "number" ? " ".repeat(options.indent) : (options.indent ?? "  ");
  return JSON.stringify(toJsonValue(asValue(input)), null, indent);
}

export function patch(input: string | Uint8Array | HujsonValue, operations: JsonPatchOperation[]): HujsonValue {
  let current = deepCloneJson(toJsonValue(asValue(input)));

  for (const operation of operations) {
    current = applyOperation(current, operation);
  }

  return fromJsonValue(current);
}

function asValue(input: string | Uint8Array | HujsonValue): HujsonValue {
  return typeof input === "string" || input instanceof Uint8Array ? parse(input) : input;
}

function literal(raw: string): HujsonLiteral {
  return { kind: "literal", before: "", after: "", raw };
}

function childLiteral(raw: string): HujsonLiteral {
  return { kind: "literal", before: "", after: null, raw };
}

function packValue(value: HujsonValue, includeAfter: boolean): string {
  const body = value.before + packTrimmed(value);
  if (includeAfter) {
    return body + (value.after ?? "");
  }
  return body;
}

function packTrimmed(value: HujsonValue): string {
  switch (value.kind) {
    case "literal":
      return value.raw;
    case "array":
      return packArray(value);
    case "object":
      return packObject(value);
  }
}

function packArray(value: HujsonArray): string {
  let output = "[";
  for (const element of value.elements) {
    output += packValue(element, false);
    if (element.after !== null) {
      output += element.after + ",";
    }
  }
  output += value.afterExtra + "]";
  return output;
}

function packObject(value: HujsonObject): string {
  let output = "{";
  for (const member of value.members) {
    output += member.name.before + member.name.raw + (member.name.after ?? "") + ":";
    output += packValue(member.value, false);
    if (member.value.after !== null) {
      output += member.value.after + ",";
    }
  }
  output += value.afterExtra + "}";
  return output;
}

function applyOperation(root: JsonValue, operation: JsonPatchOperation): JsonValue {
  switch (operation.op) {
    case "add":
      return addAtPath(root, operation.path, deepCloneJson(assertDefined(operation.value, "add")));
    case "remove":
      return removeAtPath(root, operation.path);
    case "replace":
      return replaceAtPath(root, operation.path, deepCloneJson(assertDefined(operation.value, "replace")));
    case "move": {
      const from = assertDefined(operation.from, "move");
      const moved = getAtPath(root, from);
      return addAtPath(removeAtPath(root, from), operation.path, deepCloneJson(moved));
    }
    case "copy": {
      const from = assertDefined(operation.from, "copy");
      return addAtPath(root, operation.path, deepCloneJson(getAtPath(root, from)));
    }
    case "test": {
      const actual = getAtPath(root, operation.path);
      const expected = deepCloneJson(assertDefined(operation.value, "test"));
      if (!jsonEquals(actual, expected)) {
        throw new Error(`JSON Patch test failed for path ${operation.path}`);
      }
      return root;
    }
  }
}

function getAtPath(root: JsonValue, path: string): JsonValue {
  const tokens = decodePointer(path);
  let current: JsonValue = root;

  for (const token of tokens) {
    if (Array.isArray(current)) {
      const index = parseArrayIndex(token, current.length, false);
      current = current[index] as JsonValue;
      continue;
    }

    if (current === null || typeof current !== "object" || !(token in current)) {
      throw new Error(`Path not found: ${path}`);
    }

    current = current[token] as JsonValue;
  }

  return current;
}

function addAtPath(root: JsonValue, path: string, value: JsonValue): JsonValue {
  const tokens = decodePointer(path);
  if (tokens.length === 0) {
    return value;
  }

  const parent = getAtPath(root, encodePointer(tokens.slice(0, -1)));
  const key = tokens[tokens.length - 1] as string;

  if (Array.isArray(parent)) {
    const index = key === "-" ? parent.length : parseArrayIndex(key, parent.length, true);
    parent.splice(index, 0, value);
    return root;
  }

  if (parent === null || typeof parent !== "object") {
    throw new Error(`Path is not an object: ${path}`);
  }

  parent[key] = value;
  return root;
}

function removeAtPath(root: JsonValue, path: string): JsonValue {
  const tokens = decodePointer(path);
  if (tokens.length === 0) {
    throw new Error("Removing the document root is not supported");
  }

  const parent = getAtPath(root, encodePointer(tokens.slice(0, -1)));
  const key = tokens[tokens.length - 1] as string;

  if (Array.isArray(parent)) {
    const index = parseArrayIndex(key, parent.length, false);
    parent.splice(index, 1);
    return root;
  }

  if (parent === null || typeof parent !== "object" || !(key in parent)) {
    throw new Error(`Path not found: ${path}`);
  }

  delete parent[key];
  return root;
}

function replaceAtPath(root: JsonValue, path: string, value: JsonValue): JsonValue {
  const tokens = decodePointer(path);
  if (tokens.length === 0) {
    return value;
  }

  const parent = getAtPath(root, encodePointer(tokens.slice(0, -1)));
  const key = tokens[tokens.length - 1] as string;

  if (Array.isArray(parent)) {
    const index = parseArrayIndex(key, parent.length, false);
    parent[index] = value;
    return root;
  }

  if (parent === null || typeof parent !== "object" || !(key in parent)) {
    throw new Error(`Path not found: ${path}`);
  }

  parent[key] = value;
  return root;
}

function parseArrayIndex(token: string, length: number, allowEnd: boolean): number {
  if (!/^\d+$/.test(token)) {
    throw new Error(`Invalid array index: ${token}`);
  }

  const index = Number(token);
  const max = allowEnd ? length : length - 1;
  if (index < 0 || index > max) {
    throw new Error(`Array index out of bounds: ${token}`);
  }
  return index;
}

function decodePointer(path: string): string[] {
  if (path === "") {
    return [];
  }
  if (!path.startsWith("/")) {
    throw new Error(`Invalid JSON Pointer: ${path}`);
  }
  return path
    .slice(1)
    .split("/")
    .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"));
}

function encodePointer(tokens: string[]): string {
  if (tokens.length === 0) {
    return "";
  }
  return `/${tokens.map((token) => token.replace(/~/g, "~0").replace(/\//g, "~1")).join("/")}`;
}

function assertDefined<T>(value: T | undefined, op: string): T {
  if (value === undefined) {
    throw new Error(`JSON Patch '${op}' operation is missing a required value`);
  }
  return value;
}

function deepCloneJson(value: JsonValue): JsonValue {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => deepCloneJson(item));
  }
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, deepCloneJson(item)]));
}

function jsonEquals(left: JsonValue, right: JsonValue): boolean {
  if (left === right) {
    return true;
  }
  if (typeof left !== typeof right || left === null || right === null) {
    return false;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
      return false;
    }
    return left.every((item, index) => jsonEquals(item, right[index] as JsonValue));
  }
  if (typeof left !== "object" || typeof right !== "object") {
    return false;
  }
  const leftEntries = Object.entries(left);
  const rightEntries = Object.entries(right);
  if (leftEntries.length !== rightEntries.length) {
    return false;
  }
  return leftEntries.every(([key, value]) => key in right && jsonEquals(value, right[key] as JsonValue));
}
