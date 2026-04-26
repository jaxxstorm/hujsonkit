import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "hujsonkit-repo-consumer-"));
const packageSourceDir = path.join(tempRoot, "package-source");

try {
  copyRepoForInstall(repoRoot, packageSourceDir);
  runNodeConsumer(tempRoot, packageSourceDir);
  runActionConsumer(tempRoot, packageSourceDir);
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

function copyRepoForInstall(sourceDir, targetDir) {
  fs.cpSync(sourceDir, targetDir, {
    recursive: true,
    filter(entry) {
      const relativePath = path.relative(sourceDir, entry);

      if (!relativePath) {
        return true;
      }

      const firstSegment = relativePath.split(path.sep)[0];
      return ![".git", "node_modules", "dist"].includes(firstSegment);
    }
  });
}

function runNodeConsumer(tempRoot, packageSourceDir) {
  const sourceDir = path.join(repoRoot, "test", "consumers", "node");
  const targetDir = path.join(tempRoot, "node");
  fs.cpSync(sourceDir, targetDir, { recursive: true });
  execFileSync("npm", ["install", packageSourceDir], { cwd: targetDir, stdio: "inherit" });
  execFileSync("node", ["index.mjs"], { cwd: targetDir, stdio: "inherit" });
}

function runActionConsumer(tempRoot, packageSourceDir) {
  const sourceDir = path.join(repoRoot, "test", "consumers", "action");
  const targetDir = path.join(tempRoot, "action");
  fs.cpSync(sourceDir, targetDir, { recursive: true });
  execFileSync("npm", ["install", packageSourceDir], { cwd: targetDir, stdio: "inherit" });
  execFileSync(
    "node",
    [path.join(repoRoot, "node_modules", "typescript", "bin", "tsc"), "-p", "tsconfig.json", "--noEmit"],
    { cwd: targetDir, stdio: "inherit" }
  );
}
