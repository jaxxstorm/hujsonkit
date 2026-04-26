import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import { prepareRelease, resolveTargetVersion } from "./prepare-release.mjs";

function git(rootDir, args) {
  return execFileSync("git", args, {
    cwd: rootDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function createReleaseRepo() {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "hujsonkit-release-"));
  fs.writeFileSync(
    path.join(rootDir, "package.json"),
    `${JSON.stringify({ name: "fixture", version: "0.1.0" }, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(rootDir, "package-lock.json"),
    `${JSON.stringify(
      {
        name: "fixture",
        version: "0.1.0",
        lockfileVersion: 3,
        requires: true,
        packages: {
          "": {
            name: "fixture",
            version: "0.1.0"
          }
        }
      },
      null,
      2
    )}\n`
  );

  git(rootDir, ["init"]);
  git(rootDir, ["config", "user.name", "Release Test"]);
  git(rootDir, ["config", "user.email", "release-test@example.com"]);
  git(rootDir, ["config", "commit.gpgsign", "false"]);
  git(rootDir, ["add", "package.json", "package-lock.json"]);
  git(rootDir, ["commit", "-m", "initial"]);

  return rootDir;
}

test("resolveTargetVersion supports semver increments", () => {
  assert.equal(resolveTargetVersion("1.2.3", "patch"), "1.2.4");
  assert.equal(resolveTargetVersion("1.2.3", "minor"), "1.3.0");
  assert.equal(resolveTargetVersion("1.2.3", "major"), "2.0.0");
});

test("resolveTargetVersion accepts only increasing explicit versions", () => {
  assert.equal(resolveTargetVersion("1.2.3", "1.2.4"), "1.2.4");
  assert.throws(() => resolveTargetVersion("1.2.3", "1.2.3"), /must be greater/);
  assert.throws(() => resolveTargetVersion("1.2.3", "1.2"), /Invalid semver/);
  assert.throws(() => resolveTargetVersion("1.2.3", "latest"), /Invalid semver/);
});

test("prepareRelease fails before mutation when the working tree is dirty", () => {
  const rootDir = createReleaseRepo();
  fs.writeFileSync(path.join(rootDir, "README.md"), "dirty\n");

  assert.throws(
    () => prepareRelease({ rootDir, requested: "patch", dryRun: true }),
    /Working tree must be clean/
  );

  const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
  assert.equal(packageJson.version, "0.1.0");
});

test("prepareRelease dry run validates without writing release metadata", () => {
  const rootDir = createReleaseRepo();

  const result = prepareRelease({ rootDir, requested: "minor", dryRun: true });

  assert.deepEqual(result, {
    currentVersion: "0.1.0",
    targetVersion: "0.2.0",
    tagName: "v0.2.0",
    dryRun: true
  });
  assert.equal(git(rootDir, ["tag", "--list", "v0.2.0"]).trim(), "");
});

test("prepareRelease updates package metadata and creates release commit and tag", () => {
  const rootDir = createReleaseRepo();
  const previousVerifyCommand = process.env.HUJSONKIT_RELEASE_VERIFY_COMMAND;
  process.env.HUJSONKIT_RELEASE_VERIFY_COMMAND = "node -e \"process.exit(0)\"";

  try {
    const result = prepareRelease({ rootDir, requested: "patch" });
    assert.equal(result.targetVersion, "0.1.1");

    const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
    const packageLock = JSON.parse(fs.readFileSync(path.join(rootDir, "package-lock.json"), "utf8"));

    assert.equal(packageJson.version, "0.1.1");
    assert.equal(packageLock.version, "0.1.1");
    assert.equal(packageLock.packages[""].version, "0.1.1");
    assert.equal(git(rootDir, ["tag", "--list", "v0.1.1"]).trim(), "v0.1.1");
    assert.match(git(rootDir, ["log", "-1", "--pretty=%s"]).trim(), /chore: release 0\.1\.1/);
  } finally {
    if (previousVerifyCommand === undefined) {
      delete process.env.HUJSONKIT_RELEASE_VERIFY_COMMAND;
    } else {
      process.env.HUJSONKIT_RELEASE_VERIFY_COMMAND = previousVerifyCommand;
    }
  }
});
