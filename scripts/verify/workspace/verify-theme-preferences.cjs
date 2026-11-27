"use strict";
// Exercise theme migration and persistence without a browser.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "../../..");

async function verify() {
  const cache = new Map([["worktime.themePaintCache", "rose"]]);
  const app = {
    domain: {},
    services: {},
    data: {
      calendars: { schedules: {} },
      struggleDays: [],
      majorFestivals: { years: {}, fixed: {}, movableNames: [] },
      languages: [{ id: "zh-CN" }],
      locales: { "zh-CN": {} },
    },
    i18n: {
      preference: "zh-CN",
      normalize: (value) => value,
      setLanguage() {},
    },
  };
  const context = vm.createContext({
    WorkTimeApp: app,
    window: {
      localStorage: {
        getItem: (key) => cache.get(key) ?? null,
        setItem: (key, value) => cache.set(key, value),
      },
      addEventListener() {},
      removeEventListener() {},
    },
  });
  for (const module of [
    "domain/time",
    "domain/state",
    "domain/calendar",
    "domain/records",
    "domain/schedule",
    "domain/agenda",
    "domain/preferences",
    "domain/validation",
    "services/preferences",
  ]) {
    const file = "assets/js/" + module + ".js";
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, {
      filename: file,
    });
  }
  const { preferences: rules, state, validation } = app.domain;
  const preferences = app.services.preferences.page;
  assert.equal(preferences.state.pageTheme, "pink", "Migrate paint cache");
  const original = state.defaultState();
  original.preferences.language = "zh-CN";
  original.memo = "Preserve archive content";
  for (const [old, expected] of Object.entries({
    rose: "pink",
    slate: "black",
    cyan: "blue",
    mint: "green",
    olive: "green",
  })) {
    original.preferences.pageTheme = old;
    const restored = validation.validateBackup(original);
    assert.equal(restored.preferences.pageTheme, expected);
    assert.equal(restored.memo, original.memo);
    assert.equal(original.preferences.pageTheme, old, "Do not mutate input");
    await preferences.attach({ state: original.preferences });
    assert.equal(
      preferences.state.pageTheme,
      expected,
      "Migrate archive owner",
    );
  }
  for (const { id } of rules.themes) {
    original.preferences.pageTheme = id;
    assert.equal(validation.validateBackup(original).preferences.pageTheme, id);
  }
  original.preferences.pageTheme = "unknown";
  assert.throws(
    () => validation.validateBackup(original),
    /preferences.pageTheme/,
  );
  assert.throws(() => preferences.saveTheme("unknown"), /Invalid theme/);

  const writes = [];
  await preferences.attach({
    state: { pageTheme: "green", language: "zh-CN" },
    save: (patch) => new Promise((resolve) => writes.push({ patch, resolve })),
  });
  const first = preferences.saveTheme("black");
  assert.equal(preferences.state.pageTheme, "black", "Apply before disk write");
  const second = preferences.saveTheme("pink");
  assert.equal(preferences.state.pageTheme, "pink", "Rapid selection wins");
  writes[1].resolve({ persisted: true });
  await second;
  writes[0].resolve({ persisted: true });
  await first;
  assert.equal(preferences.state.pageTheme, "pink");
  assert.equal(cache.get("worktime.themePaintCache"), "pink");
  assert.equal(preferences.dirty, false);
  const legacy = preferences.saveTheme("slate");
  assert.equal(
    writes[2].patch.pageTheme,
    "black",
    "Persist canonical identity",
  );
  writes[2].resolve({ persisted: false, error: Error("Test failure") });
  assert.equal((await legacy).persisted, false);
  assert.equal(preferences.state.pageTheme, "black");
  assert.equal(preferences.dirty, true);
  console.log(
    "Theme backups, legacy colors, cache migration, immediate selection, rapid switching and write failures verified without a browser.",
  );
}
verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
