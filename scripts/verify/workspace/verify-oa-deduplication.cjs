"use strict";
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");
require("../../lib/browser-test-setup.cjs");

const entry =
  process.env.WORKTIME_PREVIEW_URL ||
  pathToFileURL(path.resolve("index.html")).href;
const raw = Array.from({ length: 26 }, (_, index) => {
  const date = "11/" + String(index + 1).padStart(2, "0");
  return (
    date + (index % 7 === 0 || index % 7 === 6 ? "\n--" : "\n08:52\n18:06")
  );
}).join("\n\n");
const older = "first-import";
const latest = "later-copy";

async function ready(page) {
  await page.waitForFunction(
    () =>
      document.documentElement.dataset.appState === "ready" &&
      !document.documentElement.classList.contains("app-loading"),
  );
}

async function verify() {
  const browser = await chromium.launch({
    channel: process.env.WORKTIME_BROWSER_CHANNEL || "msedge",
    headless: true,
  });
  try {
    const page = await browser.newPage({
      locale: "zh-CN",
      timezoneId: "UTC",
      reducedMotion: "reduce",
      viewport: { width: 1920, height: 1080 },
    });
    const errors = [];
    page.setDefaultTimeout(10000);
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route(/^https?:/, (route) =>
      new URL(route.request().url()).origin === new URL(entry).origin
        ? route.continue()
        : route.abort(),
    );
    await page.clock.setFixedTime(new Date("2026-11-27T04:15:00Z"));
    await page.goto(entry);
    await ready(page);
    const backup = await page.evaluate(
      ({ raw, older, latest }) => {
        const { domain, services } = WorkTimeApp;
        const state = domain.state.defaultState();
        const sources = [{ name: "粘贴文本", raw }];
        const { records } = domain.observations.parseText(raw, 2026);
        const first = {
          id: older,
          at: "2026-11-27T03:51:00Z",
          year: 2026,
          sources,
          count: records.length,
          records,
        };
        const repeated = {
          ...first,
          id: latest,
          at: "2026-11-27T04:09:00Z",
        };
        state.imports = [repeated, first];
        for (const record of records)
          domain.observations.applyObservation(state, record, first.id);
        state.settings.configured = true;
        state.preferences.language = "zh-CN";
        state.days["2026-11-02"].note = "Keep this note";
        return services.archive.encode(state);
      },
      { raw, older, latest },
    );
    await page.locator("#backupFile").setInputFiles({
      name: "duplicate-imports.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(backup)),
    });
    await page.locator("#confirmRestore").click();
    await page.locator("#restoreDialog").waitFor({ state: "hidden" });

    const open = page.locator("#importOpen");
    const history = page.locator("#importHistoryList");
    const input = page.locator("#pasteText");
    const confirm = page.locator("#commitImport");
    async function historyCount(count) {
      const countLabel = `共 ${count} 次导入 · 26 个有效日期`;
      await page
        .waitForFunction(
          ({ countLabel, count }) =>
            document.querySelector("#importHistoryCount").textContent ===
              countLabel &&
            document.querySelectorAll("#importHistoryList [data-history-id]")
              .length === count,
          { countLabel, count },
        )
        .catch(async () =>
          assert.fail(
            JSON.stringify({
              expected: countLabel,
              history: await history.innerText(),
              summary: await page.locator("#importHistoryCount").textContent(),
              errors,
            }),
          ),
        );
    }
    const submit = async (text) => {
      await input.fill(text);
      await page.waitForFunction(
        () => !document.querySelector("#commitImport").disabled,
      );
      await confirm.click();
    };
    const latestCard = history.locator(`[data-history-id="${latest}"]`);
    await open.click();
    await historyCount(1);
    assert.match(await latestCard.innerText(), /04:09/);

    // Check persistence and the date's source link before opening history again.
    await page.reload();
    await ready(page);
    await page.locator('.day[data-date="2026-11-02"]').click();
    await page.locator("#sourceOpen").click();
    await page
      .locator("#sourceDialog .import-parsed-list article")
      .first()
      .waitFor();
    assert.match(
      await page.locator("#sourceDialog h2 > span").textContent(),
      /04:09/,
    );
    await open.click();
    if (!(await input.isVisible())) await open.click();
    await historyCount(1);
    await latestCard.waitFor();
    await submit("\uFEFF" + raw.replaceAll("\n", "\r\n"));
    await page
      .getByText("重复考勤已合并，保留最新一次导入", { exact: true })
      .waitFor({ state: "attached" });
    await historyCount(1);
    assert.match(await latestCard.innerText(), /04:15/);
    assert.equal(await input.inputValue(), "");

    // A correction and a later restoration of the original values are real imports.
    await page.clock.setFixedTime(new Date("2026-11-27T04:16:00Z"));
    await submit(raw.replace("18:06", "19:06"));
    await page.locator("#importDialog").waitFor({ state: "hidden" });
    await open.click();
    await historyCount(2);
    await page.clock.setFixedTime(new Date("2026-11-27T04:17:00Z"));
    await submit(raw);
    await page.locator("#importDialog").waitFor({ state: "hidden" });
    await open.click();
    await historyCount(3);
    await page.clock.setFixedTime(new Date("2026-11-27T04:18:00Z"));
    await submit(raw);
    await historyCount(3);
    assert.equal(await input.inputValue(), "");
    await page.reload();
    await ready(page);
    await open.click();
    await historyCount(3);

    const guardedCleanup = await page.evaluate(async (archive) => {
      const { domain, services } = WorkTimeApp;
      const state = services.archive.migrate(archive);
      const [later, first] = state.imports;
      const partial = { ...later, records: later.records.slice(1) };
      let attempted;
      const owner = services.application.createState({
        state,
        persistence: {
          loadIssue: null,
          commit: async (candidate, changes) => {
            attempted = {
              reference: candidate.days["2026-11-02"].oa.importId,
              changes,
            };
            return { persisted: false, error: Error("Storage failure") };
          },
        },
        core: domain.observations,
      });
      const result = await owner.deduplicateImports();
      return {
        differentChoices: domain.observations.redundantImports(
          [first, partial],
          () => true,
        ).size,
        attempted,
        saved: result.persisted,
        currentReference: owner.state.days["2026-11-02"].oa.importId,
        currentNote: owner.state.days["2026-11-02"].note,
        count: owner.state.imports.length,
      };
    }, backup);
    assert.equal(guardedCleanup.differentChoices, 0);
    assert.equal(guardedCleanup.attempted.reference, latest);
    assert.deepEqual(guardedCleanup.attempted.changes.imports, [older]);
    assert.equal(guardedCleanup.attempted.changes.days.length, 26);
    assert.equal(guardedCleanup.saved, false);
    assert.equal(guardedCleanup.currentReference, older);
    assert.equal(guardedCleanup.currentNote, "Keep this note");
    assert.equal(guardedCleanup.count, 2);
    assert.deepEqual(errors, []);
    console.log(
      "OA duplicate histories, source links and corrected reimports verified.",
    );
  } finally {
    await browser.close();
  }
}

verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
