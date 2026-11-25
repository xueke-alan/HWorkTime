"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "../_site");
const prefix = "/HWorkTime/";
const types = {
  ".js": "application/javascript",
  ".css": "text/css",
  ".html": "text/html",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
  ".webmanifest": "application/manifest+json",
};

function serve(request, response) {
  const pathname = new URL(request.url, "http://localhost").pathname;
  const target = path.resolve(
    root,
    pathname.slice(prefix.length) || "index.html",
  );
  if (
    !pathname.startsWith(prefix) ||
    !target.startsWith(root + path.sep) ||
    !fs.existsSync(target) ||
    !fs.statSync(target).isFile()
  ) {
    response.writeHead(404).end();
    return;
  }
  response.setHeader(
    "Content-Type",
    types[path.extname(target)] || "application/octet-stream",
  );
  fs.createReadStream(target).pipe(response);
}

async function verifyControlTheme(page) {
  const weather = page.locator("#weatherDays");
  const before = await weather.evaluate(
    (el) => getComputedStyle(el).borderRadius,
  );
  const result = await weather.evaluate((el) => {
    const area = el.closest(".language-settings");
    area.style.setProperty("--ui-control-radius", "21px");
    area.style.setProperty("--ui-motion", "0ms");
    area.style.setProperty("--ui-stroke", "3px");
    area.style.setProperty("--ui-icon-stroke", "2.5");
    area.style.setProperty("--ui-font-size", "17px");
    area.style.setProperty("--ui-border", "rgb(94, 31, 120)");
    const style = getComputedStyle(el);
    return [
      getComputedStyle(el.querySelector('[data-role="stroke"]')).strokeWidth,
      style.borderRadius,
      style.borderTopWidth,
      style.fontSize,
      style.borderTopColor,
      getComputedStyle(document.getElementById("motionTrigger")).borderRadius,
    ];
  });
  assert.deepEqual(result, [
    "2.5px",
    "21px",
    "3px",
    "17px",
    "rgb(94, 31, 120)",
    before,
  ]);
  await weather.waitFor();
  await page.waitForFunction(() => {
    const control = document.getElementById("weatherDays");
    return control && !control.disabled && !control.closest("[inert]");
  });
  await weather.focus();
  await weather.press("ArrowDown");
  await page.getByRole("listbox").filter({ visible: true }).waitFor();
  await weather.press("Escape");
  assert.ok(await weather.evaluate((el) => el === document.activeElement));
  await weather.evaluate((el) => {
    const area = el.closest(".language-settings");
    for (const name of [
      "--ui-control-radius",
      "--ui-motion",
      "--ui-stroke",
      "--ui-icon-stroke",
      "--ui-font-size",
      "--ui-border",
    ])
      area.style.removeProperty(name);
  });
}

async function verifyAgendaEditor(page) {
  await page.locator("#pageSettingsOpen").click();
  await page.locator("#agendaMode").click();
  await page.locator("#agendaNew").click();
  const title = page.locator("#agendaTitle");
  await title.fill("Pages agenda check");
  await page.locator("#agendaNote").fill("Range and status");
  const status = page.locator("#agendaItemStatus");
  const row = page
    .locator("#agendaList [data-agenda-edit]")
    .filter({ hasText: "Pages agenda check" });
  await page.locator("#agendaScheduleOpen").click();
  const start = await page.locator("#agendaDateInput").inputValue();
  const end = new Date(Date.parse(start + "T12:00:00Z") + 2 * 86400000)
    .toISOString()
    .slice(0, 10);
  await page.locator("#agendaEndDateInput").fill(end);
  await page.locator("[data-schedule-close]").click();
  for (const [index, value] of [
    "pending",
    "completed",
    "in-progress",
    "cancelled",
  ].entries()) {
    if (index) await row.click();
    if (index === 1) {
      await page.locator("#agendaScheduleOpen").click();
      await page.locator("label:has(#agendaAllDay)").click();
      await page.locator("#agendaStart").fill("09:30");
      await page.locator("#agendaEnd").fill("17:45");
      await page.locator("[data-schedule-close]").click();
    }
    await status.click();
    const options = page.getByRole("option");
    assert.equal(await options.count(), 4);
    await options.nth(index).click();
    if (index === 1) await page.locator("#agendaNote").press("Control+Enter");
    else await page.locator("#agendaSave").click();
    await page.locator("#agendaForm").waitFor({ state: "hidden" });
    await page
      .locator('#agendaList [data-agenda-status][data-status="' + value + '"]')
      .waitFor();
  }
  await page.reload();
  await row.click();
  assert.equal(
    await page.locator("#agendaNote").inputValue(),
    "Range and status",
  );
  assert.equal(
    await page.locator(".agenda-status-input").getAttribute("data-status"),
    "cancelled",
  );
  await page.locator("#agendaScheduleOpen").click();
  assert.equal(await page.locator("#agendaDateInput").inputValue(), start);
  assert.equal(await page.locator("#agendaEndDateInput").inputValue(), end);
  assert.equal(await page.locator("#agendaStart").inputValue(), "09:30");
  assert.equal(await page.locator("#agendaEnd").inputValue(), "17:45");
  await page.locator("[data-schedule-close]").click();
  await title.fill("Unsaved draft");
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator("#agendaCancel").click();
  await row.click();
  assert.equal(await title.inputValue(), "Pages agenda check");
}

async function verifyCalendarAndRestore(page) {
  await page.locator("#monthTitle").focus();
  await page.keyboard.press("Enter");
  await page.locator("[data-year-date]").first().waitFor();
  await page.waitForFunction(
    () => !document.getElementById("panelContent").inert,
  );
  await page.locator("#monthTitle").press("Space");
  await page.locator(".day[data-date]").first().waitFor();
  await page.waitForFunction(
    () => !document.getElementById("panelContent").inert,
  );
  const file = await page.evaluate(() => {
    const state = WorkTimeApp.domain.state.defaultState();
    const month = WorkTimeApp.domain.time.businessDate(new Date()).slice(0, 7);
    for (const day of ["01", "02"]) {
      state.days[month + "-" + day] = {
        kind: "work",
        actual: {
          start: "08:30",
          end: "18:30",
          nextDay: false,
          effectiveMinutes: null,
        },
      };
    }
    return WorkTimeApp.services.archive.encode(state);
  });
  const input = page.locator("#backupFile");
  const upload = () =>
    input.setInputFiles({
      name: "analysis.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(file)),
    });
  await upload();
  const dialog = page.locator("#restoreDialog");
  await dialog.waitFor();
  await dialog.locator('[data-close="restoreDialog"]').click();
  await dialog.waitFor({ state: "hidden" });
  await upload();
  await dialog.locator("#confirmRestore").click();
  await dialog.waitFor({ state: "hidden" });
  await page.locator("#analysisToggle").click();
  const dates = page.locator("#analysisFocusDates button");
  await dates.nth(1).click();
  assert.equal(await dates.nth(1).getAttribute("aria-pressed"), "true");
  const metric = page.locator('#analysisMetrics [data-key="earliest"]');
  await metric.getByRole("button").click();
  assert.ok(await metric.locator(".analysis-date-hint").isVisible());
  await page.locator("#prevMonth").click();
  await page.waitForFunction(
    () => document.querySelector("#analysisFocusDates").childElementCount === 0,
  );
  await page.locator("#nextMonth").click();
  await dates.nth(1).waitFor();
  await page.waitForFunction(
    () => !document.getElementById("panelContent").inert,
  );
  await page.locator("#analysisToggle").click();
  await page.locator("#analysisPage").waitFor({ state: "hidden" });
  await page.waitForFunction(
    () => !document.getElementById("panelContent").inert,
  );
  await page.locator("#importOpen").click();
  await page.locator("#pasteText").fill("01/01\n周四\n08:00\n19:30");
  await page.locator("#commitImport").click();
  await page.locator("#importDialog").waitFor({ state: "hidden" });
  await page.locator("#importOpen").click();
  const history = page
    .locator("#importHistoryList [data-delete-import]")
    .first();
  await history.click();
  await page.locator("#deleteImportDialog [data-close]").click();
  await history.click();
  await page.locator("#confirmDeleteImport").click();
  await page.locator(".import-history-empty").waitFor();
  await page.locator("#importOpen").click();
}
async function verifyDevReader(browser, url) {
  const context = await browser.newContext({ locale: "zh-CN" });
  try {
    const page = await context.newPage();
    await page.addInitScript(
      require("./runtime-test-helpers.cjs").installRuntimeFixture,
    );
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const requests = [];
    page.on("request", (r) => {
      if (
        /reader-runtime|reader-entry-|vendor\/reader|css\/reader\.css/.test(
          r.url(),
        )
      )
        requests.push(r.url());
    });
    await page.goto(url);
    await page.waitForFunction(
      () =>
        document.documentElement.dataset.appState === "ready" &&
        WorkTimeApp.services.runtimeFolder.state.status === "available",
    );
    await page.locator("#date-tab-tools").click();
    assert.ok(await page.locator("#readerOpen").isHidden());
    assert.deepEqual(requests, []);
    await page.evaluate(async () => {
      const root = await window.showDirectoryPicker();
      const ebooks = await root.getDirectoryHandle("ebooks", { create: true });
      const file = await ebooks.getFileHandle("Reader fixture.txt", {
        create: true,
      });
      const stream = await file.createWritable();
      await stream.write("HWorkTime reader preview text.");
      await stream.close();
    });
    await page.goto(new URL("#dev", url).href);
    await page.locator("#readerOpen").click();
    await page
      .locator("#readerMiniExpand:visible, #readerDialog[data-state=open]")
      .first()
      .waitFor();
    if (await page.locator("#readerMiniExpand").isVisible())
      await page.locator("#readerMiniExpand").click();
    await page.locator("#readerDialog[data-state=open]").waitFor();
    await page.locator("#readerBooks .reader-book-open").first().click();
    await page
      .frameLocator("#readerViewport iframe")
      .getByText("HWorkTime reader preview text.", { exact: true })
      .first()
      .waitFor();
    await page.goto(url);
    await page.locator("#readerDialog").waitFor({ state: "hidden" });
    assert.ok(await page.locator("#readerOpen").isHidden());
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}
async function verify(url) {
  const browser = await chromium.launch({
    channel: process.env.WORKTIME_BROWSER_CHANNEL || "msedge",
  });
  try {
    await verifyDevReader(browser, url);
    const context = await browser.newContext({ locale: "zh-CN" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url);
    await page.waitForFunction(
      () => document.documentElement.dataset.appState === "ready",
    );
    await verifyCalendarAndRestore(page);
    for (const expected of [5, 7]) {
      await page.waitForFunction(
        () => document.documentElement.dataset.appState === "ready",
      );
      assert.ok((await page.locator(".day[data-date]").count()) >= 28);
      await page.locator("#pageSettingsOpen").click();
      const select = page.locator("#weatherDays");
      await select.waitFor();
      assert.match(await select.innerText(), new RegExp(String(expected)));
      if (expected === 5) {
        await verifyControlTheme(page);
        await select.click();
        await page.getByRole("option", { name: /7/ }).click();
        await page.waitForFunction(
          () =>
            WorkTimeApp.services.preferences.page.state.weatherDays === 7 &&
            document
              .querySelector("#weatherDays")
              ?.getAttribute("aria-disabled") !== "true",
        );
        await page.reload();
      }
    }
    await page.evaluate(() => {
      let listener;
      const state = {
        tracks: [{}],
        current: { title: "Footer playback check" },
        paused: false,
      };
      const dispose = WorkTimeApp.ui.footerPlayback.connect({
        snapshot: () => state,
        subscribe(fn) {
          listener = fn;
          return () => {};
        },
        toggle() {
          state.paused = !state.paused;
          listener();
        },
        previous() {},
        next() {},
      });
      window.addEventListener("pagehide", dispose, { once: true });
    });
    const playback = page.locator(".calendar-footer .site-music-controls");
    await playback.waitFor();
    await playback.locator('[data-music-action="toggle"]').click();
    await playback.locator('[data-glyph="play"]').waitFor();
    await verifyAgendaEditor(page);
    await page.reload();
    await page.waitForFunction(
      () => document.documentElement.dataset.appState === "ready",
    );
    await page.locator("#date-tab-games").click();
    await page.locator('#gamesPanel [data-game-archive="import"]').click();
    const archive = page.locator("#gameArchiveDialog");
    await archive.locator("#gameArchiveText").fill("invalid archive");
    await archive.locator(".game-archive-actions button").nth(1).click();
    await page.waitForFunction(
      () => !!document.querySelector(".game-archive-error")?.textContent.trim(),
    );
    assert.ok(
      await archive.locator(".game-archive-footer button").last().isDisabled(),
    );
    await archive.locator(".game-archive-footer button").first().click();
    await archive.waitFor({ state: "hidden" });
    await require("./game-test-helpers.cjs").launchGame(page, "game-2048");
    await page.locator("#gameExitButton").click();
    await page.locator("#gameShell").waitFor({ state: "hidden" });
    await require("./game-test-helpers.cjs").launchGame(
      page,
      "game-minesweeper",
    );
    await page.locator("#mineDifficultyTrigger").click();
    const difficulty = page.getByRole("option").nth(1);
    await difficulty.click();
    assert.equal(
      await page.locator("#mineDifficulty").evaluate((el) => el.selectedIndex),
      1,
    );
    await page.locator("#gameExitButton").click();
    await page.locator("#gameShell").waitFor({ state: "hidden" });
    await require("./game-test-helpers.cjs").launchGame(page, "game-jump");
    await page.locator('[data-jump-action="restart"]').click();
    const restart = page
      .locator(".game-restart-content")
      .getByRole("button")
      .first();
    await restart.press("Escape");
    await page.locator(".game-restart-panel").waitFor({ state: "hidden" });
    await page.locator("#gameExitButton").click();
    await page.locator("#gameShell").waitFor({ state: "hidden" });
    await page.locator("#musicOpen").click();
    await page.locator("#musicMinimize").click();
    await page.locator("#musicDialog").waitFor({ state: "hidden" });
    await page.goto(new URL("#dev", url).href);
    await page.locator("#date-tab-tools").click();
    await page.locator("#typingOpen").click();
    await page.locator('#typingDialog[data-state="open"]').waitFor();
    const practice = page.locator(".typing-navigation button").nth(1);
    await practice.click();
    assert.equal(await practice.getAttribute("aria-current"), "page");
    await page.locator("#typingExitButton").click();
    await page.locator("#typingDialog").waitFor({ state: "hidden" });
    await page.goto(url);
    await page.waitForFunction(
      () => document.documentElement.dataset.appState === "ready",
    );
    await page.locator("#date-tab-tools").click();
    await page.locator("#vocabularyOpen").click();
    const books = page.locator('.vocabulary-navigation [data-page="books"]');
    await books.click();
    await page.waitForFunction(
      () =>
        document.querySelector(".vocabulary-content")?.dataset.page === "books",
    );
    assert.equal(await books.getAttribute("aria-current"), "page");
    await page.goto(new URL("tools/convert-backup.html", url).href);
    const input = page.locator("#backupInput");
    await input.fill("{");
    await page.locator("#convert").click();
    await page.waitForFunction(
      () => document.querySelector("#status").textContent.trim().length > 0,
    );
    assert.ok(await page.locator("#download").isDisabled());
    const fixture = await page.evaluate(() => {
      const state = WorkTimeApp.domain.state.defaultState();
      state.preferences.weatherDays = 7;
      state.memo = "Pages conversion check";
      return WorkTimeApp.services.archive.encode(state);
    });
    await page.locator("input[type=file]").setInputFiles({
      name: "archive.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(fixture)),
    });
    await page.waitForFunction(
      () => document.querySelector("#backupInput").value.length > 1,
    );
    await page.locator("#convert").click();
    await page.waitForFunction(
      () => document.querySelector("#backupOutput").value.length > 0,
    );
    assert.deepEqual(
      JSON.parse(await page.locator("#backupOutput").inputValue()).modules,
      fixture.modules,
    );
    const download = page.waitForEvent("download");
    await page.locator("#download").click();
    assert.ok((await download).suggestedFilename().endsWith(".json"));
    const mobile = await browser.newContext({
      locale: "en",
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const phone = await mobile.newPage();
    phone.on("pageerror", (error) => errors.push(error.message));
    await phone.goto(url);
    await phone.waitForFunction(
      () => document.documentElement.dataset.appState === "ready",
    );
    assert.equal(await phone.locator("html").getAttribute("lang"), "en");
    await phone.locator("#pageSettingsOpen").tap();
    await verifyControlTheme(phone);
    await phone.locator("#weatherDays").tap();
    await phone.getByRole("option", { name: /7/ }).tap();
    await phone.waitForFunction(
      () => WorkTimeApp.services.preferences.page.state.weatherDays === 7,
    );
    assert.ok(
      await phone.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    );
    await phone.locator("#musicOpen").tap();
    await phone.locator("#musicMinimize").waitFor();
    assert.ok(
      await phone.evaluate(
        () =>
          WorkTimeApp.i18n.t("media.music.albumLabel") ===
            WorkTimeApp.data.locales.en["media.music.albumLabel"] &&
          !!WorkTimeApp.data.locales.en["media.music.albumLabel"],
      ),
    );
    await mobile.close();
    assert.deepEqual(errors, []);
    console.log(
      "Verified Pages startup, calendar and analysis, OA import and removal, backup restore, agenda, games, music, typing, mobile settings and dev-only book reading.",
    );
  } finally {
    await browser.close();
  }
}
async function main() {
  process.env.WORKTIME_TEST_DISABLE_AUTO_BACKUP = "1";
  require("./lib/browser-test-setup.cjs");
  if (process.argv[2]) return verify(process.argv[2]);
  const server = http.createServer(serve);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    await verify("http://127.0.0.1:" + server.address().port + prefix);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
