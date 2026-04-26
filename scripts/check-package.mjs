import { execFileSync } from "node:child_process";
import fs from "node:fs";

const packOutput = execFileSync("npm", ["pack", "--json"], { encoding: "utf8" });
const [{ filename }] = JSON.parse(packOutput);

const listing = execFileSync("tar", ["-tf", filename], { encoding: "utf8" })
  .trim()
  .split("\n");

for (const entry of [
  "package/dist/index.js",
  "package/dist/index.d.ts",
  "package/README.md",
  "package/LICENSE"
]) {
  if (!listing.includes(entry)) {
    throw new Error(`Expected tarball entry '${entry}' was not found`);
  }
}

fs.rmSync(filename, { force: true });
