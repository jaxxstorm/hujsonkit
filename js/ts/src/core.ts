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
  const indent = typeof options.indent === "number" ? " ".repeat(options.indent) : (options.indent ?? "\t");
  return formatRoot(asValue(input), indent);
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

function formatRoot(value: HujsonValue, indent: string): string {
  return `${formatTrimmed(value, 0, indent, !isStandard(value))}\n`;
}

function formatTrimmed(value: HujsonValue, depth: number, indent: string, allowTrailingCommas: boolean): string {
  switch (value.kind) {
    case "literal":
      return formatLiteral(value);
    case "array":
      return formatArray(value, depth, indent, allowTrailingCommas);
    case "object":
      return formatObject(value, depth, indent, allowTrailingCommas);
  }
}

function formatLiteral(value: HujsonLiteral): string {
  if (value.raw.startsWith('"') && value.raw.includes("\\")) {
    return JSON.stringify(JSON.parse(value.raw));
  }
  return value.raw;
}

function formatArray(value: HujsonArray, depth: number, indent: string, allowTrailingCommas: boolean): string {
  if (value.elements.length === 0) {
    const extra = formatExtraInline(value.afterExtra);
    return extra ? `[${extra}]` : "[]";
  }

  if (!shouldExpandArray(value, depth, indent, allowTrailingCommas)) {
    return `[${value.elements.map((element, index) => formatInlineArrayElement(element, index, depth, indent, allowTrailingCommas)).join(",")}]`;
  }

  const childDepth = depth + 1;
  const lines = value.elements.map((element, index) => {
    const comma = allowTrailingCommas || index < value.elements.length - 1 ? "," : "";
    const prefix = formatExtraBeforeExpanded(element.before, childDepth, indent, index === 0);
    const afterValue = formatExtraInline(element.after);
    return `${prefix.text}${formatTrimmed(element, childDepth, indent, allowTrailingCommas)}${afterValue}${comma}`;
  });
  return `[${lines.join("")}\n${repeatIndent(indent, depth)}]`;
}

function formatObject(value: HujsonObject, depth: number, indent: string, allowTrailingCommas: boolean): string {
  if (value.members.length === 0) {
    const extra = formatExtraInline(value.afterExtra);
    return extra ? `{${extra}}` : "{}";
  }

  if (!shouldExpandObject(value, depth, indent, allowTrailingCommas)) {
    return `{${value.members.map((member, index) => formatInlineMember(member, index, depth, indent, allowTrailingCommas)).join(",")}}`;
  }

  const childDepth = depth + 1;
  const rows = value.members.map((member, index) => {
    const formattedValue = formatTrimmed(member.value, childDepth, indent, allowTrailingCommas);
    const multiline = formattedValue.includes("\n");
    const prefix = formatExtraBeforeExpanded(member.name.before, childDepth, indent, index === 0);
    return {
      index,
      member,
      formattedValue,
      multiline,
      prefix,
      name: formatLiteral(member.name)
    };
  });

  const valueSpaces = new Map<number, string>();
  let group: typeof rows = [];
  const flushGroup = () => {
    if (group.length === 0) {
      return;
    }
    const alignable = group.filter((row) => !row.multiline && !hasComment(row.member.name.after) && !hasComment(row.member.value.before));
    if (alignable.length > 1) {
      const width = Math.max(...alignable.map((row) => row.name.length));
      for (const row of alignable) {
        valueSpaces.set(row.index, " ".repeat(width - row.name.length + 1));
      }
    }
    group = [];
  };

  for (const row of rows) {
    if (row.prefix.commentCount > 0 || row.multiline) {
      flushGroup();
      if (!row.multiline) {
        group.push(row);
      }
      flushGroup();
      continue;
    }
    group.push(row);
  }
  flushGroup();

  const lines = rows.map((row) => {
    const comma = allowTrailingCommas || row.index < rows.length - 1 ? "," : "";
    const beforeColon = formatExtraInline(row.member.name.after);
    const afterColon = formatExtraInline(row.member.value.before);
    const separator =
      beforeColon || afterColon
        ? `${beforeColon || ""}:${afterColon || " "}`
        : `:${valueSpaces.get(row.index) ?? " "}`;
    const afterValue = formatExtraInline(row.member.value.after);
    return `${row.prefix.text}${row.name}${separator}${row.formattedValue}${afterValue}${comma}`;
  });

  return `{${lines.join("")}\n${repeatIndent(indent, depth)}}`;
}

function formatInlineArrayElement(
  element: HujsonValue,
  index: number,
  depth: number,
  indent: string,
  allowTrailingCommas: boolean
): string {
  const before = formatExtraInline(element.before) || (index === 0 ? "" : " ");
  const after = formatExtraInline(element.after);
  return `${before}${formatTrimmed(element, depth, indent, allowTrailingCommas)}${after}`;
}

function formatInlineMember(
  member: HujsonObjectMember,
  index: number,
  depth: number,
  indent: string,
  allowTrailingCommas: boolean
): string {
  const beforeName = formatExtraInline(member.name.before) || (index === 0 ? "" : " ");
  const beforeColon = formatExtraInline(member.name.after);
  const afterColon = formatExtraInline(member.value.before);
  const separator = beforeColon || afterColon ? `${beforeColon || ""}:${afterColon || " "}` : ": ";
  const afterValue = formatExtraInline(member.value.after);
  return `${beforeName}${formatLiteral(member.name)}${separator}${formatTrimmed(member.value, depth, indent, allowTrailingCommas)}${afterValue}`;
}

function shouldExpandArray(value: HujsonArray, depth: number, indent: string, allowTrailingCommas: boolean): boolean {
  if (value.afterExtra.includes("\n") || value.elements.some((element) => element.before.includes("\n") || (element.after ?? "").includes("\n"))) {
    return true;
  }
  const inline = `[${value.elements.map((element, index) => formatInlineArrayElement(element, index, depth, indent, allowTrailingCommas)).join(",")}]`;
  return lineLength(inline) > 80;
}

function shouldExpandObject(value: HujsonObject, depth: number, indent: string, allowTrailingCommas: boolean): boolean {
  if (
    value.afterExtra.includes("\n") ||
    value.members.some(
      (member) =>
        member.name.before.includes("\n") ||
        (member.name.after ?? "").includes("\n") ||
        member.value.before.includes("\n") ||
        (member.value.after ?? "").includes("\n")
    )
  ) {
    return true;
  }
  const inline = `{${value.members.map((member, index) => formatInlineMember(member, index, depth, indent, allowTrailingCommas)).join(",")}}`;
  return lineLength(inline) > 80;
}

function formatExtraInline(extra: string | null): string {
  if (!extra) {
    return "";
  }
  const comments = extractComments(normalizeEndlines(extra)).map((comment) => comment.trimEnd());
  return comments.length > 0 ? ` ${comments.join(" ")} ` : "";
}

function formatExtraBeforeExpanded(
  extra: string,
  depth: number,
  indent: string,
  first: boolean
): { text: string; commentCount: number } {
  const normalized = normalizeEndlines(extra);
  const comments = extractComments(normalized).map((comment) => comment.trimEnd());
  const newlineCount = countNewlines(normalized);
  const blankLine = !first && (comments.length === 0 ? newlineCount > 1 : newlineCount > comments.length + 1);
  let text = blankLine ? "\n\n" : "\n";
  for (const comment of comments) {
    text += `${repeatIndent(indent, depth)}${formatComment(comment, depth, indent)}\n`;
  }
  text += repeatIndent(indent, depth);
  return { text, commentCount: comments.length };
}

function countNewlines(value: string): number {
  let count = 0;
  for (const char of value) {
    if (char === "\n") {
      count += 1;
    }
  }
  return count;
}

function formatComment(comment: string, depth: number, indent: string): string {
  if (!comment.includes("\n")) {
    return comment.trimEnd();
  }
  const lines = comment.split("\n").map((line) => line.trimEnd());
  return lines
    .map((line, index) => (index === 0 ? line : `${repeatIndent(indent, depth)}${line.trimStart()}`))
    .join("\n");
}

function extractComments(extra: string): string[] {
  const comments: string[] = [];
  for (let index = 0; index < extra.length; ) {
    if (extra.startsWith("//", index)) {
      const end = extra.indexOf("\n", index);
      if (end === -1) {
        comments.push(extra.slice(index));
        break;
      }
      comments.push(extra.slice(index, end));
      index = end + 1;
      continue;
    }
    if (extra.startsWith("/*", index)) {
      const end = extra.indexOf("*/", index + 2);
      if (end === -1) {
        comments.push(extra.slice(index));
        break;
      }
      comments.push(extra.slice(index, end + 2));
      index = end + 2;
      continue;
    }
    index += 1;
  }
  return comments;
}

function normalizeEndlines(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\n\r/g, "\n").replace(/\r/g, " ");
}

function repeatIndent(indent: string, depth: number): string {
  return indent.repeat(Math.max(0, depth));
}

function lineLength(value: string): number {
  const lines = value.split("\n");
  return lines[lines.length - 1].length;
}

function hasComment(extra: string | null): boolean {
  return !!extra && (extra.includes("//") || extra.includes("/*"));
}

function isStandard(value: HujsonValue): boolean {
  if (hasComment(value.before) || hasComment(value.after)) {
    return false;
  }
  switch (value.kind) {
    case "literal":
      return true;
    case "array":
      if (hasComment(value.afterExtra) || hasTrailingComma(value.elements)) {
        return false;
      }
      return value.elements.every(isStandard);
    case "object":
      if (hasComment(value.afterExtra) || hasTrailingComma(value.members.map((member) => member.value))) {
        return false;
      }
      return value.members.every(
        (member) => !hasComment(member.name.before) && !hasComment(member.name.after) && isStandard(member.value)
      );
  }
}

function hasTrailingComma(values: HujsonValue[]): boolean {
  return values.length > 0 && values[values.length - 1].after !== null;
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
