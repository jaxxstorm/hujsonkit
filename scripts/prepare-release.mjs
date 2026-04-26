#!/usr/bin/env node
import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const VERSION_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const INCREMENTS = new Set(["patch", "minor", "major"]);

export function parseVersion(version) {
  const match = VERSION_RE.exec(version);
  if (!match) {
    throw new Error(`Invalid semver version '${version}'. Expected x.y.z.`);
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3])
  };
}

export function formatVersion(version) {
  return `${version.major}.${version.minor}.${version.patch}`;
}

export function compareVersions(a, b) {
  for (const key of ["major", "minor", "patch"]) {
    if (a[key] > b[key]) return 1;
    if (a[key] < b[key]) return -1;
  }

  return 0;
}

export function resolveTargetVersion(currentVersion, requested) {
  const current = parseVersion(currentVersion);

  if (INCREMENTS.has(requested)) {
    const next = { ...current };
    if (requested === "major") {
      next.major += 1;
      next.minor = 0;
      next.patch = 0;
    } else if (requested === "minor") {
      next.minor += 1;
      next.patch = 0;
    } else {
      next.patch += 1;
    }
    return formatVersion(next);
  }

  const target = parseVersion(requested);
  if (compareVersions(target, current) <= 0) {
    throw new Error(
      `Target version ${requested} must be greater than current version ${currentVersion}.`
    );
  }

  return requested;
}

function runGit(args, options = {}) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: options.stdio ?? ["ignore", "pipe", "pipe"],
    ...options
  });
}

function requireCleanWorkingTree() {
  const status = runGit(["status", "--porcelain"]);
  if (status.trim() !== "") {
    throw new Error("Working tree must be clean before preparing a release.");
  }
}

function requireGitIdentity() {
  let name = "";
  let email = "";
  try {
    name = runGit(["config", "--get", "user.name"]).trim();
    email = runGit(["config", "--get", "user.email"]).trim();
  } catch {
    throw new Error("Git user.name and user.email must be configured before preparing a release.");
  }

  if (!name || !email) {
    throw new Error("Git user.name and user.email must be configured before preparing a release.");
  }
}

function requireTagDoesNotExist(tagName) {
  try {
    runGit(["rev-parse", "--verify", "--quiet", `refs/tags/${tagName}`]);
  } catch {
    return;
  }

  throw new Error(`Tag ${tagName} already exists.`);
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function updatePackageMetadata(rootDir, targetVersion) {
  const packageJsonPath = path.join(rootDir, "package.json");
  const packageJson = readJsonFile(packageJsonPath);
  packageJson.version = targetVersion;
  writeJsonFile(packageJsonPath, packageJson);

  const lockPath = path.join(rootDir, "package-lock.json");
  if (fs.existsSync(lockPath)) {
    const lock = readJsonFile(lockPath);
    lock.version = targetVersion;
    if (lock.packages?.[""]) {
      lock.packages[""].version = targetVersion;
    }
    writeJsonFile(lockPath, lock);
  }
}

function runVerification(rootDir) {
  const command = process.env.HUJSONKIT_RELEASE_VERIFY_COMMAND || "npm run verify";
  execSync(command, {
    cwd: rootDir,
    env: process.env,
    stdio: "inherit",
    shell: true
  });
}

function createReleaseGitMetadata(targetVersion) {
  const tagName = `v${targetVersion}`;
  const paths = ["package.json"];
  if (fs.existsSync("package-lock.json")) {
    paths.push("package-lock.json");
  }

  runGit(["add", ...paths], { stdio: "inherit" });
  runGit(["commit", "-m", `chore: release ${targetVersion}`], { stdio: "inherit" });
  runGit(["tag", "-a", tagName, "-m", `Release ${targetVersion}`], { stdio: "inherit" });
}

function parseArgs(argv) {
  const args = [...argv];
  const dryRun = args.includes("--dry-run");
  const filtered = args.filter((arg) => arg !== "--dry-run");

  if (filtered.length !== 1) {
    throw new Error("Usage: npm run release:prepare -- <patch|minor|major|x.y.z> [--dry-run]");
  }

  return {
    requested: filtered[0],
    dryRun
  };
}

export function prepareRelease({ rootDir = process.cwd(), requested, dryRun = false }) {
  const previousCwd = process.cwd();
  try {
    const packageJson = readJsonFile(path.join(rootDir, "package.json"));
    const targetVersion = resolveTargetVersion(packageJson.version, requested);
    const tagName = `v${targetVersion}`;

    process.chdir(rootDir);
    requireCleanWorkingTree();
    requireGitIdentity();
    requireTagDoesNotExist(tagName);

    if (dryRun) {
      return {
        currentVersion: packageJson.version,
        targetVersion,
        tagName,
        dryRun: true
      };
    }

    updatePackageMetadata(rootDir, targetVersion);
    runVerification(rootDir);
    createReleaseGitMetadata(targetVersion);

    return {
      currentVersion: packageJson.version,
      targetVersion,
      tagName,
      dryRun: false
    };
  } finally {
    process.chdir(previousCwd);
  }
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const result = prepareRelease(options);

    if (result.dryRun) {
      console.log(`Release dry run passed: ${result.currentVersion} -> ${result.targetVersion}`);
      console.log(`Would create tag ${result.tagName}`);
      return;
    }

    console.log(`Prepared release ${result.targetVersion}`);
    console.log(`Created release commit and tag ${result.tagName}`);
    console.log(`Publish with: git push origin HEAD ${result.tagName}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  main();
}
