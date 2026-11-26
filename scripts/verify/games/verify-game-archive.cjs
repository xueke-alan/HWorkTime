"use strict";
require("../../lib/browser-test-setup.cjs");
const { launchGame } = require("../../lib/game-test-helpers.cjs");
const {
  downloadBackup,
  importBackupFile,
} = require("../../lib/backup-test-file.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "../../..");
const siteRoot =
  process.argv[2] && !process.argv[2].startsWith("--")
    ? path.resolve(process.argv[2])
    : root;
const copy = (v) => JSON.parse(JSON.stringify(v));
function environment() {
  const sandbox = vm.createContext({
    WorkTimeApp: {
      data: {},
      games: {},
      services: {},
      i18n: { t: (key) => key },
    },
    window: { navigator: {}, dispatchEvent() {} },
    TextEncoder,
    Response,
    Blob,
    CompressionStream,
    DecompressionStream,
    btoa,
    atob,
    Event,
  });
  const load = (file) =>
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox, {
      filename: file,
    });
  load("assets/js/games/registry.js");
  for (const name of ["sudoku", "sokoban", "xiangqi"])
    load("assets/data/" + name + ".js");
  for (const name of [
    "2048",
    "minesweeper",
    "snake",
    "sudoku",
    "sokoban",
    "link",
    "garden",
    "xiangqi",
  ])
    load("assets/js/games/" + name + "-rules.js");
  load("assets/js/backup.js");
  load("assets/js/services/game-archive.js");
  return sandbox.WorkTimeApp;
}
function memory() {
  const values = new Map();
  return {
    values,
    fault: null,
    getItem(key) {
      if (this.fault) this.fault("get", key);
      return values.get(key) ?? null;
    },
    setItem(key, text) {
      if (this.fault) this.fault("set", key);
      values.set(key, String(text));
    },
    removeItem(key) {
      if (this.fault) this.fault("remove", key);
      values.delete(key);
    },
  };
}
async function unit() {
  const app = environment(),
    S = app.services.gameArchive,
    G = app.games;
  const storage = memory(),
    owner = S.create(() => storage);
  const group = app.data.sudoku.groups[0],
    puzzle = group.puzzles[0];

  // Keep the v1 transport for all seven Sokoban chapters, including old saves.
  for (const chapter of [0, 1, 2, 3, 4, 5, 6]) {
    const level = app.data.sokoban.levels[chapter * 20 + 19];
    const save = {
      version: 1,
      chapter,
      current: level.id,
      completed: {},
      drafts: { [level.id]: { path: level.solution.slice(0, -1) } },
    };
    const restored = S.normalize("game-sokoban", copy(save));
    assert.equal(restored.version, 1);
    assert.equal(restored.chapter, chapter);
    assert.equal(restored.current, level.id);
    assert.equal(restored.drafts[level.id].path, save.drafts[level.id].path);
    assert.deepEqual(
      copy(S.normalize("game-sokoban", copy(restored))),
      copy(restored),
    );
  }
  {
    const previousIds =
      require("../../sokoban/sokoban-selection.json").previousOrder;
    const oldCurrent = previousIds[99];
    const oldLevel = app.data.sokoban.levels.find(
      (level) => level.id === oldCurrent,
    );
    const completed = Object.fromEntries(
      previousIds.slice(0, 99).map((id) => [
        id,
        {
          path: app.data.sokoban.levels.find((level) => level.id === id)
            .solution,
        },
      ]),
    );
    const migrated = S.normalize("game-sokoban", {
      version: 1,
      chapter: 4,
      current: oldCurrent,
      completed,
      drafts: { [oldCurrent]: { path: oldLevel.solution.slice(0, -1) } },
    });
    assert.equal(migrated.current, oldCurrent);
    assert.equal(Object.keys(migrated.completed).length, 99);
    assert.equal(
      migrated.chapter,
      Math.floor(app.data.sokoban.levels.indexOf(oldLevel) / 20),
    );
    assert.equal(migrated.version, 1);
  }
  assert.throws(() =>
    S.normalize("game-sokoban", {
      version: 1,
      chapter: 7,
      current: null,
      drafts: {},
      completed: {},
    }),
  );

  {
    const triple = app.data.sudoku.groups.find((g) => g.id === "triple");
    assert.equal(triple.puzzles.length, 20);
    assert.equal(triple.legacyPuzzles.length, 20);
    const old = triple.legacyPuzzles[0],
      state = G.sudokuRules.create(old);
    state.replay = G.sudokuRules.startReplay(old, state);
    const index = old.givens.lastIndexOf("0");
    G.sudokuRules.enter(old, state, index, Number(old.solution[index]));
    G.sudokuRules.recordEdit(
      state.replay,
      index,
      Number(old.solution[index]),
      false,
    );
    const save = {
      version: 1,
      group: "triple",
      current: old.id,
      drafts: { [old.id]: state },
      completed: {},
    };
    const normalized = S.normalize("game-sudoku", copy(save));
    assert.equal(normalized.current, old.id);
    assert.equal(normalized.drafts[old.id].values.length, 225);
    assert.ok(normalized.drafts[old.id].replay);
    const restored = S.validate({
      type: S.TYPE,
      version: 1,
      exportedAt: new Date().toISOString(),
      games: { "game-sudoku": save },
    });
    assert.equal(restored.games["game-sudoku"].current, old.id);
  }

  const draft = G.sudokuRules.create(puzzle);
  draft.elapsed = 100;
  draft.replay = G.sudokuRules.startReplay(puzzle, draft);
  const log = { moves: "", finishedAt: 1000 };
  for (let i = 0; i < 81; i++)
    if (puzzle.givens[i] === "0")
      G.sudokuRules.recordEdit(log, i, Number(puzzle.solution[i]), false);
  const mineStats = G.minesweeperRules.emptyStats();
  const difficulty = Object.keys(mineStats)[0];
  mineStats[difficulty] = { best: 1000, wins: 4 };
  const garden = G.gardenRules.create(0, 42);
  const link = {
    mode: "zen",
    level: 0,
    cols: G.linkRules.size(0).cols,
    board: G.linkRules.create(0, () => 0.4),
    phase: "playing",
    score: 10,
    remaining: 100000,
    hints: 3,
    shuffles: 2,
  };
  const firstLevel = app.data.sokoban.levels[0];
  const map = G.sokobanRules.parse(firstLevel);
  const sokoban = G.sokobanRules.create();
  const direction = Object.keys(G.sokobanRules.directions).find((d) =>
    G.sokobanRules.move(map, sokoban, d),
  );
  assert.ok(direction);
  const [mate] = app.data.xiangqi;
  const oldStalemate = {
    version: 1,
    current: "xq-20",
    drafts: { "xq-20": { path: [1093] } },
    completed: {},
  };
  const wonStalemate = S.normalize("game-xiangqi", oldStalemate);
  assert.equal(wonStalemate.current, null);
  assert.deepEqual(copy(wonStalemate.drafts), {});
  assert.deepEqual(copy(wonStalemate.completed["xq-20"]), { path: [1093] });
  assert.deepEqual(
    copy(S.normalize("game-xiangqi", wonStalemate)),
    copy(wonStalemate),
  );
  assert.throws(() =>
    S.normalize("game-xiangqi", {
      ...oldStalemate,
      drafts: { "xq-20": { path: [1093, 0] } },
    }),
  );
  const twoMoves = app.data.xiangqi.find(({ id }) => id === "xq-07");
  const [winningMove, alternative] = Object.keys(mate.tree[1]).map(Number);
  const [opening] = Object.keys(twoMoves.tree[1]).map(Number);
  const round = (move) => [move, G.xiangqiRules.reply(twoMoves.tree[1][move])];
  const xiangqi = {
    version: 1,
    current: twoMoves.id,
    drafts: { [twoMoves.id]: { path: round(opening) } },
    completed: { [mate.id]: { path: [winningMove] } },
  };
  const retired = app.data.xiangqiRetired;
  assert.equal(retired.length, 20);
  const retiredMate = retired.find(({ goal }) => goal === 1);
  const retiredBoard = G.xiangqiRules.parse(retiredMate.position);
  const retiredWin = G.xiangqiRules
    .legalMoves(retiredBoard, true)
    .find(
      (move) =>
        G.xiangqiRules.result(
          G.xiangqiRules.apply(retiredBoard, move),
          false,
        ) === "mate",
    );
  assert(Number.isInteger(retiredWin));
  const oldSave = {
    ...xiangqi,
    current: retired.at(-1).id,
    drafts: { ...xiangqi.drafts, [retired.at(-1).id]: { path: [] } },
    completed: {
      ...xiangqi.completed,
      [retiredMate.id]: { path: [retiredWin] },
    },
  };
  const migrated = S.normalize("game-xiangqi", oldSave);
  assert.equal(migrated.current, null);
  assert.deepEqual(copy(migrated.drafts), oldSave.drafts);
  assert.deepEqual(copy(migrated.completed), oldSave.completed);
  const historicalStorage = new Map([
    [S.keys["game-xiangqi"], JSON.stringify(oldSave)],
  ]);
  const historicalOwner = S.create(() => ({
    getItem: (key) => historicalStorage.get(key) ?? null,
  }));
  const loadedBank = app.data.xiangqi;
  delete app.data.xiangqi;
  assert.deepEqual(copy(historicalOwner.progressSummary("game-xiangqi")), {
    kind: "completed",
    value: 1,
  });
  for (const level of retired) {
    historicalStorage.set(
      S.keys["game-xiangqi"],
      JSON.stringify({
        version: 1,
        completed: { [level.id]: {} },
        drafts: { [level.id]: { path: [1] } },
      }),
    );
    assert.deepEqual(copy(historicalOwner.progressSummary("game-xiangqi")), {
      kind: "empty",
    });
  }
  app.data.xiangqi = loadedBank;
  const saves = {
    "game-2048": {
      version: 1,
      state: { ...G.rules2048.create(() => 0), score: 4 },
      previous: null,
      best: 100,
    },
    "game-minesweeper": {
      version: 1,
      state: G.minesweeperRules.create(),
      stats: mineStats,
      elapsed: 0,
      manualPaused: false,
    },
    "game-snake": {
      version: 1,
      state: G.snakeRules.create("classic", () => 0.4),
      best: { classic: 100, wrap: 30, rush: 10 },
    },
    "game-sudoku": {
      version: 1,
      current: puzzle.id,
      group: group.id,
      drafts: { [puzzle.id]: draft },
      completed: { [puzzle.id]: { elapsed: 1000, hints: 2, replay: log } },
    },
    "game-jump": 120,
    "game-sokoban": {
      version: 1,
      current: firstLevel.id,
      chapter: 0,
      drafts: { [firstLevel.id]: { path: sokoban.path } },
      completed: {},
    },
    "game-link": { state: link, best: { zen: 100, quest: 30, tide: 10 } },
    "game-garden": {
      version: 1,
      state: garden,
      previous: null,
      records: Array(G.gardenRules.levelCount).fill(1),
    },
    "game-tank": { best: 100, custom: Array(2704).fill(0), muted: false },
    "game-xiangqi": xiangqi,
  };
  const archive = (games) => ({
    type: S.TYPE,
    version: 1,
    exportedAt: "2026-10-22T00:00:00.000Z",
    games,
  });
  for (const [id, value] of Object.entries(saves))
    storage.setItem(S.keys[id], JSON.stringify(value));
  for (const [id, kind, value] of [
    ["game-2048", "best", 100],
    ["game-minesweeper", "wins", 4],
    ["game-snake", "best", 100],
    ["game-sudoku", "completed", 1],
    ["game-jump", "best", 120],
    ["game-sokoban", "empty"],
    ["game-link", "best", 100],
    ["game-garden", "completed", G.gardenRules.levelCount],
    ["game-tank", "best", 100],
    ["game-xiangqi", "completed", 1],
  ]) {
    const progress = owner.progressSummary(id);
    assert.equal(progress.kind, kind, id);
    assert.equal(progress.value, value, id);
  }
  const unavailable = S.create(() => {
    throw Error("Storage denied");
  });
  assert.equal(unavailable.progressSummary("game-2048").kind, "unavailable");
  storage.setItem("worktime.unrelated", "keep");
  const historicalArchive = archive({ "game-xiangqi": migrated });
  assert.deepEqual(
    copy(S.validate(historicalArchive)),
    copy(historicalArchive),
  );
  const packed = owner.snapshot();
  assert.equal(Object.keys(packed.games).length, 10);
  assert.deepEqual(copy(S.validate(packed)), copy(packed));
  const { ["game-xiangqi"]: savedXiangqi, ...legacy } = packed.games;
  assert.deepEqual(copy(savedXiangqi), xiangqi);
  assert.deepEqual(copy(S.validate(archive(legacy)).games), copy(legacy));
  const legacyStorage = memory();
  legacyStorage.setItem(S.keys["game-xiangqi"], JSON.stringify(xiangqi));
  const legacyBefore = Object.fromEntries(
    Object.keys(legacy).map((id) => [id, null]),
  );
  legacyStorage.setItem(
    S.JOURNAL,
    JSON.stringify({
      version: 1,
      revision: "legacy",
      before: legacyBefore,
    }),
  );
  const legacyOwner = S.create(() => legacyStorage);
  legacyOwner.recover();
  assert.deepEqual(copy(legacyOwner.read().games), { "game-xiangqi": xiangqi });
  const freePlay = {
    version: 1,
    current: mate.id,
    drafts: { [mate.id]: { path: [90, 283] } },
    completed: { [mate.id]: { path: [90, 283, 2460] } },
  };
  const freeArchive = archive({ "game-xiangqi": freePlay });
  assert.deepEqual(copy(S.validate(freeArchive)), freeArchive);
  assert.throws(
    () =>
      S.normalize("game-xiangqi", {
        ...freePlay,
        completed: freePlay.drafts,
      }),
    { code: "invalid" },
  );
  assert.throws(
    () =>
      S.normalize("game-xiangqi", {
        ...xiangqi,
        completed: { [mate.id]: { path: [alternative, winningMove] } },
      }),
    { code: "invalid" },
  );
  assert.throws(
    () =>
      S.normalize("game-xiangqi", {
        ...xiangqi,
        drafts: { [twoMoves.id]: { path: [opening] } },
      }),
    { code: "invalid" },
  );
  const legacySudoku = {
    ...copy(saves["game-sudoku"]),
    group: "fog",
    current: "fog-2",
  };
  for (let n = 1; n <= 6; n++) {
    legacySudoku.drafts["fog-" + n] = copy(draft);
    legacySudoku.completed["fog-" + n] = { elapsed: 10, hints: 0 };
  }
  const migratedSudoku = S.normalize("game-sudoku", legacySudoku);
  assert.equal(migratedSudoku.group, group.id);
  assert.equal(migratedSudoku.current, null);
  assert.deepEqual(
    migratedSudoku.drafts,
    S.normalize("game-sudoku", saves["game-sudoku"]).drafts,
  );
  assert.deepEqual(
    migratedSudoku.completed,
    S.normalize("game-sudoku", saves["game-sudoku"]).completed,
  );
  assert.throws(
    () =>
      S.normalize("game-sudoku", { ...legacySudoku, current: "unknown-level" }),
    { code: "invalid" },
  );
  for (const variant of ["parity", "thermo"]) {
    const legacy = copy(saves["game-sudoku"]);
    legacy.group = variant;
    const levels = app.data.sudoku.groups
      .find((g) => g.id === variant)
      .puzzles.slice(15, 20);
    legacy.current = levels.at(-1).id;
    for (const level of levels) {
      const progress = G.sudokuRules.create(level);
      const cell = level.givens.indexOf("0");
      G.sudokuRules.enter(level, progress, cell, Number(level.solution[cell]));
      legacy.drafts[level.id] = copy(progress);
      legacy.completed[level.id] = { elapsed: 10, hints: 0 };
    }
    const normalized = S.normalize("game-sudoku", legacy);
    assert.equal(normalized.current, levels.at(-1).id);
    assert.equal(normalized.group, variant);
    for (const { id } of levels) {
      assert.deepEqual(
        copy(normalized.drafts[id].values),
        legacy.drafts[id].values,
      );
      assert.deepEqual(copy(normalized.completed[id]), {
        elapsed: 10,
        hints: 0,
      });
    }
    assert.throws(
      () =>
        S.normalize("game-sudoku", {
          ...legacy,
          current: variant + "-unknown",
        }),
      { code: "invalid" },
    );
  }
  const raw = JSON.stringify(packed);
  const compressed = await app.services.backup.encode(raw);
  for (const text of [
    raw,
    compressed,
    "WORKTIME:GAMES:1:JSON:" + raw,
    "WORKTIME:GAMES:1:GZIP:" +
      compressed.slice(app.services.backup.PREFIX.length),
  ]) {
    await assert.rejects(
      app.services.backup.decode(text, (v) => v),
      {
        code: "gameOnly",
        message: "gameArchive.gameOnly",
      },
    );
  }
  assert.throws(() => S.validate({ days: {} }), { code: "wrongType" });
  assert.throws(() => S.validate({ ...packed, version: 2 }), {
    code: "version",
  });
  assert.throws(() => S.validate(archive({ "unknown-game": {} })), {
    code: "invalid",
  });
  const clean = S.normalize("game-snake", {
    ...saves["game-snake"],
    state: { ...saves["game-snake"].state, secret: "discard" },
  });
  assert.equal(clean.state.secret, undefined);
  const newer = copy(saves["game-sudoku"]);
  newer.completed[puzzle.id] = {
    elapsed: 9999,
    hints: 2,
    replay: { ...log, finishedAt: 2000 },
  };
  newer.completed[puzzle.id].replay.moves = "zzz";
  newer.drafts[puzzle.id].replay.moves = log.moves;
  const sanitized = S.normalize("game-sudoku", newer);
  assert.equal(sanitized.completed[puzzle.id].elapsed, 9999);
  assert.equal(sanitized.completed[puzzle.id].replay, undefined);
  assert.equal(sanitized.drafts[puzzle.id].replay, undefined);
  const original = owner.read().raw;
  assert.equal(storage.getItem("worktime.unrelated"), "keep");
  storage.setItem(
    S.JOURNAL,
    JSON.stringify({ version: 1, revision: "interrupted", before: original }),
  );
  storage.setItem(S.keys["game-jump"], "9999");
  const reloaded = S.create(() => storage);
  reloaded.recover();
  assert.deepEqual(
    copy(reloaded.read().raw),
    copy(original),
    "reload recovers an interrupted import",
  );
  storage.setItem(
    S.JOURNAL,
    JSON.stringify({
      version: 1,
      revision: "retry-recovery",
      before: original,
    }),
  );
  storage.fault = (op, key) => {
    if (op === "set" && key === S.keys["game-jump"]) throw Error("still full");
  };
  assert.throws(() => reloaded.recover(), { code: "recovery" });
  assert.ok(storage.getItem(S.JOURNAL), "failed recovery retains its journal");
  assert.throws(() => reloaded.read(), { code: "recovery" });
  assert.throws(() => reloaded.session().setItem(S.keys["game-jump"], "0"), {
    code: "stale",
  });
  storage.fault = null;
  reloaded.recover();
  assert.deepEqual(copy(reloaded.read().raw), copy(original));
  storage.setItem(S.keys["game-tank"], "broken");
  assert.throws(() => owner.snapshot(), {
    code: "localInvalid",
    game: "game-tank",
  });
  assert.equal(storage.getItem(S.keys["game-tank"]), "broken");
  const empty = memory(),
    fresh = S.create(() => empty);
  empty.setItem(
    S.keys["game-2048"],
    JSON.stringify({
      ...saves["game-2048"],
      best: 0,
      state: G.rules2048.create(),
      previous: null,
    }),
  );
  assert.ok(fresh.snapshot().games["game-2048"]);
  const locked = S.create(() => {
    throw Error("unavailable");
  });
  assert.throws(() => locked.read());
  assert.throws(() => locked.session().setItem(S.keys["game-jump"], "1"));
  const replacement = memory(),
    replacementOwner = S.create(() => replacement);
  assert.deepEqual(copy(replacementOwner.snapshot().games), {});
  replacement.setItem(S.keys["game-jump"], "70");
  replacement.setItem(S.keys["game-tank"], JSON.stringify(saves["game-tank"]));
  const beforeReplacement = copy(replacementOwner.read().raw);
  const workFailure = { persisted: false, error: Error("work storage full") };
  assert.equal(
    await replacementOwner.replace(
      archive({ "game-jump": 10 }),
      async () => workFailure,
    ),
    workFailure,
  );
  assert.deepEqual(copy(replacementOwner.read().raw), beforeReplacement);
  await assert.rejects(
    replacementOwner.replace(archive({ "game-jump": 10 }), async () => {
      throw Error("work restore failed");
    }),
    /work restore failed/,
  );
  assert.deepEqual(copy(replacementOwner.read().raw), beforeReplacement);
  let failed = false;
  replacement.fault = (op, key) => {
    if (!failed && op === "set" && key === S.keys["game-tank"]) {
      failed = true;
      throw Error("quota");
    }
  };
  await assert.rejects(
    replacementOwner.replace(archive(saves), async () => ({ persisted: true })),
    /quota/,
  );
  replacement.fault = null;
  assert.deepEqual(copy(replacementOwner.read().raw), beforeReplacement);
  assert.equal(replacement.getItem(S.JOURNAL), null);
  const staleReplacement = replacementOwner.session();
  let applyCalls = 0;
  replacement.fault = (op, key) => {
    if (op === "set" && key === S.BACKUP) throw Error("backup full");
  };
  await assert.rejects(
    replacementOwner.replace(archive({ "game-jump": 10 }), async () => {
      applyCalls++;
      return { persisted: true };
    }),
    /backup full/,
  );
  replacement.fault = null;
  assert.equal(applyCalls, 0);
  assert.deepEqual(copy(replacementOwner.read().raw), beforeReplacement);
  await replacementOwner.replace(archive({ "game-jump": 10 }), async () => ({
    persisted: true,
  }));
  assert.equal(replacement.getItem(S.keys["game-jump"]), "10");
  assert.equal(replacement.getItem(S.keys["game-tank"]), null);
  assert.throws(() => staleReplacement.setItem(S.keys["game-jump"], "100"), {
    code: "stale",
  });
  await replacementOwner.replace(archive({}), async () => ({
    persisted: true,
  }));
  assert.equal(Object.keys(replacementOwner.read().games).length, 0);
  await replacementOwner.replace(archive(saves), async () => ({
    persisted: true,
  }));
  assert.deepEqual(
    copy(replacementOwner.read().games),
    copy(S.validate(archive(saves)).games),
  );
  const rawFull = JSON.stringify({
    format: "worktime-full-backup",
    games: archive(saves),
  });
  const compact = await app.services.backup.encodeCompact(rawFull);
  assert.ok(
    compact.length <= (await app.services.backup.encode(rawFull)).length,
  );
  assert.deepEqual(
    copy(await app.services.backup.decode(compact, (v) => v)),
    JSON.parse(rawFull),
  );
  assert.equal(await app.services.backup.encodeCompact("1"), "1");
  await assert.rejects(
    () =>
      app.services.backup.decode(compact, (v) => v, {
        maxBytes: compact.length + 1,
      }),
    { code: "tooLarge" },
  );
  console.log(
    "Game backup validation, legacy rejection, rollback, recovery and stale sessions passed.",
  );
}
async function ui() {
  const browser = await chromium.launch({
    channel: process.env.WORKTIME_BROWSER_CHANNEL || "msedge",
    headless: true,
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route(/^https?:/, (route) => route.abort());
    await page.goto(pathToFileURL(path.join(siteRoot, "index.html")).href);
    const ready = () =>
      page.waitForFunction(
        () => document.documentElement.dataset.appState === "ready",
      );
    const launch = async () => {
      await page.waitForFunction(() => WorkTimeApp.services.assets.whenIdle());
      await page.evaluate(() => WorkTimeApp.ui.dateInfo.selectTab("games"));
      await page.locator('#gamesPanel [data-game="game-2048"]').waitFor();
      await launchGame(page, "game-2048");
    };
    await ready();
    const key = "worktime.games.2048.v1";
    await page.evaluate((key) => {
      const state = {
        board: [2, 2, 4, 0, ...Array(12).fill(0)],
        score: 0,
        continued: false,
      };
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          state,
          previous: null,
          best: 0,
        }),
      );
    }, key);
    await launch();
    await page.keyboard.press("ArrowLeft");
    const score = page.locator("[data-puzzle-score]");
    const best = page.locator("[data-puzzle-best]");
    const saved = () =>
      page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
    await page.waitForFunction(
      () => document.querySelector("[data-puzzle-score]")?.textContent === "4",
    );
    const original = await saved();
    assert.equal(original.state.score, 4);
    assert.equal(original.best, 4);
    await page.reload();
    await ready();
    await launch();
    assert.equal(await score.textContent(), "4");
    assert.equal(await best.textContent(), "4");
    assert.deepEqual(await saved(), original);
    await page.locator("#gameExitButton").click();
    await page.locator("#gameShell").waitFor({ state: "hidden" });

    const restore = page.locator("#restoreDialog");
    const workBackup = await page.evaluate(() =>
      JSON.stringify(
        WorkTimeApp.services.archive.encode(
          WorkTimeApp.domain.state.defaultState(),
        ),
      ),
    );
    await importBackupFile(page, workBackup);
    await restore.waitFor();
    const backup = await downloadBackup(page);
    await restore.locator('[data-close="restoreDialog"]').click();
    await restore.waitFor({ state: "hidden" });
    const rejected = await page.evaluate(
      (save) =>
        "WORKTIME:GAMES:1:JSON:" +
        JSON.stringify({
          type: WorkTimeApp.services.gameArchive.TYPE,
          version: 1,
          exportedAt: new Date().toISOString(),
          games: { "game-2048": { ...save, best: 128 } },
        }),
      original,
    );
    const unsupported = await page.evaluate(() =>
      WorkTimeApp.i18n.t("gameArchive.gameOnly"),
    );
    await importBackupFile(page, rejected);
    await page
      .locator("#feedbackList .tone-error")
      .getByText(unsupported, {
        exact: false,
      })
      .waitFor({ state: "attached" });
    assert.equal(await page.locator("#restoreDialog").isVisible(), false);
    assert.deepEqual(await saved(), original);

    await page.evaluate((key) => localStorage.removeItem(key), key);
    await importBackupFile(page, backup);
    await page.locator("#restoreDialog").waitFor({ state: "visible" });
    await page.locator("#confirmRestore").click();
    await page.locator("#restoreDialog").waitFor({ state: "hidden" });
    const restored = await saved();
    assert.deepEqual(restored.state, original.state);
    assert.deepEqual(restored.previous, original.previous);
    assert.equal(restored.best, original.best);
    await launch();
    assert.equal(await score.textContent(), "4");
    assert.equal(await best.textContent(), "4");
    assert.deepEqual(errors, []);
    console.log(
      "2048 reload and full restore passed. Legacy game-only backup left saves intact.",
    );
  } finally {
    await browser.close();
  }
}

(async () => {
  await unit();
  if (!process.argv.includes("--unit")) await ui();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
