export type JsonPrimitive = null | boolean | number | string;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface HujsonBaseValue {
  before: string;
  after: string | null;
}

export interface HujsonLiteral extends HujsonBaseValue {
  kind: "literal";
  raw: string;
}

export interface HujsonArray extends HujsonBaseValue {
  kind: "array";
  elements: HujsonValue[];
  afterExtra: string;
}

export interface HujsonObjectMember {
  name: HujsonLiteral;
  value: HujsonValue;
}

export interface HujsonObject extends HujsonBaseValue {
  kind: "object";
  members: HujsonObjectMember[];
  afterExtra: string;
}

export type HujsonValue = HujsonLiteral | HujsonArray | HujsonObject;

export interface FormatOptions {
  indent?: number | string;
}

export interface JsonPatchOperation {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  from?: string;
  value?: JsonValue;
}
