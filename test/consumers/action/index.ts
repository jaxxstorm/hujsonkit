import { parse, type HujsonValue } from "hujsonkit";

const value: HujsonValue = parse('{"workflow":true}');

if (value.kind !== "object") {
  throw new Error("Expected object root");
}
