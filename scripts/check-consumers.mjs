import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packOutput = execFileSync("npm", ["pack", "--json"], { cwd: repoRoot, encoding: "utf8" });
const [{ filename }] = JSON.parse(packOutput);
const tarballPath = path.join(repoRoot, filename);

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "hujsonkit-consumers-"));

try {
  runNodeConsumer(tempRoot, tarballPath);
  runActionConsumer(tempRoot, tarballPath);
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
  fs.rmSync(tarballPath, { force: true });
}

function runNodeConsumer(tempRoot, tarballPath) {
  const sourceDir = path.join(repoRoot, "test", "consumers", "node");
  const targetDir = path.join(tempRoot, "node");
  fs.cpSync(sourceDir, targetDir, { recursive: true });
  execFileSync("npm", ["install", tarballPath], { cwd: targetDir, stdio: "inherit" });
  execFileSync("node", ["index.mjs"], { cwd: targetDir, stdio: "inherit" });
}

function runActionConsumer(tempRoot, tarballPath) {
  const sourceDir = path.join(repoRoot, "test", "consumers", "action");
  const targetDir = path.join(tempRoot, "action");
  fs.cpSync(sourceDir, targetDir, { recursive: true });
  execFileSync("npm", ["install", tarballPath], { cwd: targetDir, stdio: "inherit" });
  execFileSync(
    "node",
    [path.join(repoRoot, "node_modules", "typescript", "bin", "tsc"), "-p", "tsconfig.json", "--noEmit"],
    { cwd: targetDir, stdio: "inherit" }
  );
}
