"use strict";
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync, spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "../..");
function git(args, options = {}) {
  return execFileSync("git", args, { cwd: root, ...options });
}
let snapshot;
function cleanupSnapshot() {
  if (!snapshot) return;
  const target = path.resolve(snapshot);
  if (
    path.dirname(target) !== path.resolve(os.tmpdir()) ||
    !path.basename(target).startsWith("worktime-pre-push-")
  )
    throw Error("Refusing to remove an unexpected pre-push snapshot path.");
  fs.rmSync(target, { recursive: true, force: true });
  snapshot = undefined;
}
try {
  const revisions = new Set(
    fs
      .readFileSync(0, "utf8")
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => line.split(/\s+/)[1])
      .filter((sha) => !/^0+$/.test(sha)),
  );
  for (const revision of revisions) {
    const lock = git(["show", revision + ":pnpm-lock.yaml"]);
    if (!lock.equals(fs.readFileSync(path.join(root, "pnpm-lock.yaml"))))
      throw Error(
        "Pushed lockfile differs from working tree; install that revision's dependencies first.",
      );
    snapshot = fs.mkdtempSync(path.join(os.tmpdir(), "worktime-pre-push-"));
    const archive = path.join(snapshot, ".revision.tar");
    git(["archive", "--format=tar", "--output=" + archive, revision]);
    execFileSync("tar", ["-xf", path.basename(archive)], { cwd: snapshot });
    fs.unlinkSync(archive);
    // Resolve workspace links inside the archived revision, including its UI package.
    const install = spawnSync(
      "pnpm",
      ["install", "--frozen-lockfile", "--prefer-offline", "--ignore-scripts"],
      {
        cwd: snapshot,
        shell: process.platform === "win32",
        stdio: "inherit",
      },
    );
    if (install.error) throw install.error;
    if (install.status !== 0)
      throw Error("Could not install the snapshot's locked dependencies.");
    console.log("Checking pushed commit " + revision + " in " + snapshot);
    const result = spawnSync("pnpm", ["run", "check:release"], {
      cwd: snapshot,
      shell: process.platform === "win32",
      stdio: "inherit",
    });
    if (result.error) throw result.error;
    if (result.status !== 0) throw Error("Checks failed; push blocked.");
    cleanupSnapshot();
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  cleanupSnapshot();
}
