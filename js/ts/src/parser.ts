import { HujsonArray, HujsonLiteral, HujsonObject, HujsonValue } from "./types";

const NUMBER_PATTERN = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/;

export class HujsonSyntaxError extends SyntaxError {
  readonly offset: number;

  constructor(message: string, offset: number) {
    super(`${message} at byte ${offset}`);
    this.name = "HujsonSyntaxError";
    this.offset = offset;
  }
}

export function parse(input: string | Uint8Array): HujsonValue {
  return new Parser(normalizeInput(input)).parseRoot();
}

function normalizeInput(input: string | Uint8Array): string {
  if (typeof input === "string") {
    return input;
  }

  return new TextDecoder().decode(input);
}

class Parser {
  private readonly text: string;
  private index = 0;

  constructor(text: string) {
    this.text = text;
  }

  parseRoot(): HujsonValue {
    const before = this.parseExtra();
    const value = this.parseValue(before);
    value.after = this.parseExtra();

    if (!this.isAtEnd()) {
      throw this.error("Unexpected trailing content");
    }

    return value;
  }

  private parseValue(before: string): HujsonValue {
    const char = this.peek();

    if (char === "{") {
      return this.parseObject(before);
    }
    if (char === "[") {
      return this.parseArray(before);
    }
    if (char === '"') {
      return this.parseString(before);
    }
    if (char === "t" || char === "f" || char === "n") {
      return this.parseKeyword(before);
    }
    if (char === "-" || isDigit(char)) {
      return this.parseNumber(before);
    }

    throw this.error("Expected a HuJSON value");
  }

  private parseObject(before: string): HujsonObject {
    this.expect("{");

    const members: HujsonObject["members"] = [];
    let extra = this.parseExtra();

    if (this.peek() === "}") {
      this.index += 1;
      return { kind: "object", before, after: null, members, afterExtra: extra };
    }

    while (true) {
      const name = this.parseString(extra);
      name.after = this.parseExtra();
      this.expect(":");
      const value = this.parseValue(this.parseExtra());
      const postValueExtra = this.parseExtra();

      members.push({ name, value });

      if (this.peek() === ",") {
        this.index += 1;
        value.after = postValueExtra;
        extra = this.parseExtra();

        if (this.peek() === "}") {
          this.index += 1;
          return { kind: "object", before, after: null, members, afterExtra: extra };
        }

        continue;
      }

      if (this.peek() === "}") {
        this.index += 1;
        value.after = null;
        return { kind: "object", before, after: null, members, afterExtra: postValueExtra };
      }

      throw this.error("Expected ',' or '}' in object");
    }
  }

  private parseArray(before: string): HujsonArray {
    this.expect("[");

    const elements: HujsonValue[] = [];
    let extra = this.parseExtra();

    if (this.peek() === "]") {
      this.index += 1;
      return { kind: "array", before, after: null, elements, afterExtra: extra };
    }

    while (true) {
      const element = this.parseValue(extra);
      const postValueExtra = this.parseExtra();
      elements.push(element);

      if (this.peek() === ",") {
        this.index += 1;
        element.after = postValueExtra;
        extra = this.parseExtra();

        if (this.peek() === "]") {
          this.index += 1;
          return { kind: "array", before, after: null, elements, afterExtra: extra };
        }

        continue;
      }

      if (this.peek() === "]") {
        this.index += 1;
        element.after = null;
        return { kind: "array", before, after: null, elements, afterExtra: postValueExtra };
      }

      throw this.error("Expected ',' or ']' in array");
    }
  }

  private parseString(before: string): HujsonLiteral {
    const start = this.index;
    this.expect('"');

    while (!this.isAtEnd()) {
      const char = this.text[this.index];

      if (char === '"') {
        this.index += 1;
        return { kind: "literal", before, after: null, raw: this.text.slice(start, this.index) };
      }

      if (char === "\\") {
        this.index += 1;
        if (this.isAtEnd()) {
          throw this.error("Unterminated string escape");
        }

        const escaped = this.text[this.index];
        if (escaped === "u") {
          const hex = this.text.slice(this.index + 1, this.index + 5);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
            throw this.error("Invalid unicode escape");
          }
          this.index += 5;
          continue;
        }

        if (!'"\\/bfnrt'.includes(escaped)) {
          throw this.error("Invalid string escape");
        }

        this.index += 1;
        continue;
      }

      if (char === "\n" || char === "\r") {
        throw this.error("Unterminated string literal");
      }

      this.index += 1;
    }

    throw this.error("Unterminated string literal");
  }

  private parseKeyword(before: string): HujsonLiteral {
    for (const keyword of ["true", "false", "null"]) {
      if (this.text.startsWith(keyword, this.index)) {
        this.index += keyword.length;
        return { kind: "literal", before, after: null, raw: keyword };
      }
    }

    throw this.error("Invalid literal");
  }

  private parseNumber(before: string): HujsonLiteral {
    const start = this.index;

    while (!this.isAtEnd()) {
      const char = this.peek();
      if (!char || !"-+0123456789.eE".includes(char)) {
        break;
      }
      this.index += 1;
    }

    const raw = this.text.slice(start, this.index);
    if (!NUMBER_PATTERN.test(raw)) {
      throw new HujsonSyntaxError("Invalid number literal", start);
    }

    return { kind: "literal", before, after: null, raw };
  }

  private parseExtra(): string {
    const start = this.index;

    while (!this.isAtEnd()) {
      const char = this.peek();

      if (char === " " || char === "\t" || char === "\r" || char === "\n") {
        this.index += 1;
        continue;
      }

      if (char === "/" && this.text[this.index + 1] === "/") {
        this.index += 2;
        while (!this.isAtEnd() && this.peek() !== "\n") {
          this.index += 1;
        }
        if (!this.isAtEnd()) {
          this.index += 1;
        }
        continue;
      }

      if (char === "/" && this.text[this.index + 1] === "*") {
        this.index += 2;
        while (!this.isAtEnd()) {
          if (this.peek() === "*" && this.text[this.index + 1] === "/") {
            this.index += 2;
            break;
          }
          this.index += 1;
        }
        if (this.isAtEnd() && this.text[this.index - 1] !== "/") {
          throw this.error("Unterminated block comment");
        }
        continue;
      }

      break;
    }

    return this.text.slice(start, this.index);
  }

  private expect(expected: string): void {
    if (this.peek() !== expected) {
      throw this.error(`Expected '${expected}'`);
    }
    this.index += expected.length;
  }

  private peek(): string {
    return this.text[this.index] ?? "";
  }

  private isAtEnd(): boolean {
    return this.index >= this.text.length;
  }

  private error(message: string): HujsonSyntaxError {
    return new HujsonSyntaxError(message, this.index);
  }
}

function isDigit(char: string): boolean {
  return char >= "0" && char <= "9";
}
