"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(__dirname, "../../../assets/js/services/assets.js"),
  "utf8",
);
function fixture(protocol) {
  const appended = [],
    timers = new Map();
  let timerId = 0;
  const app = {
    data: { assetVersions: { "assets/js/optional.js": "test-version" } },
    services: {},
  };
  const document = {
    currentScript: {
      src: protocol + "/HWorkTime/assets/js/services/assets.js",
    },
    head: { append: (element) => appended.push(element) },
    createElement: (tag) => ({
      tag,
      remove() {
        this.removed = true;
      },
    }),
  };
  vm.runInNewContext(source, {
    URL,
    DOMException,
    document,
    WorkTimeApp: app,
    setTimeout: (callback) => {
      timers.set(++timerId, callback);
      return timerId;
    },
    clearTimeout: (id) => timers.delete(id),
  });
  return { assets: app.services.assets, appended, timers };
}

async function verify() {
  for (const protocol of ["https://example.com", "file://"]) {
    const { assets, appended, timers } = fixture(protocol);
    const script = "assets/js/optional.js";
    const warming = assets.prefetch(script);
    assert.equal(assets.prefetch(script), warming, "deduplicate pending hints");
    const hint = appended[0];
    assert.equal(hint.tag, "link");
    assert.equal(
      hint.rel,
      "prefetch",
      "optional assets do not promise fast use",
    );
    assert.equal(hint.as, "script");
    assert.equal(hint.fetchPriority, "low");
    assert.equal(new URL(hint.href).searchParams.get("v"), "test-version");
    hint.onload();
    await warming;
    assert.equal(
      assets.prefetch(script),
      warming,
      "deduplicate completed hints",
    );
    assert.equal(appended.length, 1, "prefetch never executes scripts");

    const opening = assets.script(script, { fetchPriority: "high" });
    const element = appended.at(-1);
    assert.equal(element.tag, "script");
    assert.equal(element.src, hint.href, "foreground uses the same cache URL");
    assert.equal(element.fetchPriority, "high");
    assert.equal(
      assets.prefetch(script),
      opening,
      "join an actual script load",
    );
    element.onload();
    await opening;

    const stylesheet = "assets/css/optional.css";
    const warmingStyle = assets.prefetch(stylesheet, true);
    const styleHint = appended.at(-1);
    assert.equal(styleHint.rel, "prefetch");
    assert.equal(styleHint.as, "style");
    styleHint.onload();
    await warmingStyle;
    const applying = assets.style(stylesheet);
    const style = appended.at(-1);
    assert.equal(style.rel, "stylesheet");
    assert.equal(style.href, styleHint.href);
    style.onload();
    await applying;

    const failed = assets.prefetch("retry.js");
    const failure = assert.rejects(failed, /Prefetch failed/);
    const failedHint = appended.at(-1);
    failedHint.onerror();
    await failure;
    assert.equal(failedHint.removed, true);
    const retry = assets.prefetch("retry.js");
    assert.notEqual(retry, failed);
    appended.at(-1).onload();
    await retry;

    const timedOut = assets.prefetch("timeout.js");
    const timeout = assert.rejects(timedOut, /Prefetch timed out/);
    const timedHint = appended.at(-1);
    assert.equal(timers.size, 1);
    [...timers.values()][0]();
    await timeout;
    assert.equal(timedHint.removed, true);
    assert.equal(timers.size, 0, "all completion paths clean up timers");
    assert.ok(appended.every((element) => element.rel !== "preload"));
  }
  console.log(
    "Optional assets use low-priority prefetch over HTTP/file, retain cache URLs, deduplicate, and retry after failures/timeouts.",
  );
}
verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
