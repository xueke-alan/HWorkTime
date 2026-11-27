"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");
const root = path.resolve(
  process.env.WORKTIME_RELEASE_DIRECTORY ||
    path.join(__dirname, "../../../_site"),
);
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

const {
  selectWorkspaceCommand,
} = require("../../lib/workspace-menu-test-helpers.cjs");

async function verifyWorkspaceMenubar(page) {
  const original = page.viewportSize();
  const agenda = page.locator('.workspace-views [data-view="agenda"]');
  assert.equal(await agenda.count(), 0);
  await page.evaluate(() => {
    location.hash = "dev";
  });
  await agenda.waitFor({ state: "visible" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [1440, 1280, 1152, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.allSettled(
        [...document.querySelectorAll(".workspace > *")].flatMap((el) =>
          el.getAnimations().map((a) => a.finished),
        ),
      );
    });
    const bounds = await page.evaluate(() => {
      const rect = (selector) =>
        document.querySelector(selector).getBoundingClientRect();
      const header = rect(".work-body > .workspace-header"),
        brand = rect(".work-body > header.sidebar-brand"),
        logo = rect(".sidebar-brand-logo"),
        panel = rect(".work-main"),
        footer = rect(".work-main > footer"),
        summary = rect(".summary-sidebar"),
        oaEntry = rect(".summary-sidebar > .oa-entry"),
        oaActions = rect("#oaRecordActions"),
        calendar = rect(".work-body > section"),
        editor = rect(".editor");
      return {
        page: document.documentElement.scrollWidth,
        columnBorders: [
          getComputedStyle(
            document.querySelector(".work-body > .sidebar-brand"),
          ).borderBlockEndWidth,
          getComputedStyle(
            document.querySelector(".work-body > .workspace-header"),
          ).borderInlineStartWidth,
          getComputedStyle(document.querySelector(".work-body > section"))
            .borderInlineStartWidth,
          getComputedStyle(document.querySelector(".summary-sidebar"))
            .borderInlineEndWidth,
        ].map((width) => parseFloat(width)),
        brandColumnOffset: brand.left - summary.left,
        brandBottomDifference: brand.bottom - header.bottom,
        brandCenterX:
          logo.left + logo.width / 2 - (brand.left + brand.width / 2),
        brandCenterY:
          logo.top + logo.height / 2 - (brand.top + brand.height / 2),
        dividerOffset: header.left - calendar.left,
        firstRowOffset:
          rect("#oaRecordActions").top - rect(".calendar .day").top,
        brandBottomToContent: brand.bottom - rect("#oaRecordActions").top,
        firstDateStart: rect(".calendar .day").left,
        brandLogoStartInset: logo.left - summary.left,
        brandLogoEndInset: summary.right - logo.right,
        dateStart: rect("#prevMonth").left,
        toolsEnd: rect("#pageSettingsOpen").right,
        headerEnd: header.right,
        gap: (innerWidth > 1150 ? calendar : summary).top - header.bottom,
        footerInset: Math.max(
          Math.abs(footer.left - panel.left),
          Math.abs(footer.right - panel.right),
          Math.abs(footer.bottom - panel.bottom),
        ),
        headerHeightDifference:
          header.height - rect(".editor-day-header").height,
        headerBottomDifference:
          header.bottom - rect(".editor-day-header").bottom,
        selectGap:
          rect(".workspace-views").left - rect(".month-controls").right,
        viewsWrapped:
          rect(".workspace-views").top >= rect(".month-controls").bottom,
        oaWidth: oaActions.width,
        oaExpectedWidth: Math.round((oaEntry.width * 0.85) / 2) * 2,
        oaHeight: oaActions.height,
        oaInsetDifference:
          oaActions.left - oaEntry.left - (oaEntry.right - oaActions.right),
        summary: summary.top,
        summaryRight: summary.right,
        calendar: calendar.left,
        calendarRight: calendar.right,
        editor: editor.left,
      };
    });
    assert.ok(bounds.page <= width + 1, JSON.stringify({ width, bounds }));
    const [brandBottomBorder, headerBorder, calendarBorder, summaryBorder] =
      bounds.columnBorders;
    assert.equal(brandBottomBorder, 0);
    assert.equal(headerBorder, calendarBorder);
    assert.equal(summaryBorder, 0);
    assert.equal(calendarBorder > 0, width > 1150);
    assert.ok(Math.abs(bounds.gap) <= 1, JSON.stringify({ width, bounds }));
    assert.ok(bounds.footerInset <= 2, JSON.stringify({ width, bounds }));
    assert.equal(
      bounds.oaWidth,
      bounds.oaExpectedWidth,
      JSON.stringify(bounds),
    );
    assert.equal(bounds.oaHeight, 38, JSON.stringify(bounds));
    assert.ok(Math.abs(bounds.oaInsetDifference) <= 1, JSON.stringify(bounds));
    if (width > 850)
      assert.ok(
        Math.abs(bounds.headerHeightDifference) <= 1,
        JSON.stringify(bounds),
      );
    if (width > 700 && width <= 1150) {
      assert.ok(
        Math.abs(bounds.brandBottomDifference) <= 1,
        JSON.stringify(bounds),
      );
    }
    if (width > 1150) {
      assert.ok(Math.abs(bounds.brandCenterX) <= 1, JSON.stringify(bounds));
      assert.ok(Math.abs(bounds.brandCenterY) <= 1, JSON.stringify(bounds));
      assert.ok(
        Math.abs(bounds.brandBottomToContent) <= 1,
        JSON.stringify(bounds),
      );
      assert.ok(Math.abs(bounds.dividerOffset) <= 1, JSON.stringify(bounds));
      assert.ok(Math.abs(bounds.firstRowOffset) <= 1, JSON.stringify(bounds));
      assert.ok(
        Math.abs(bounds.headerBottomDifference) <= 2,
        JSON.stringify(bounds),
      );
      if (!bounds.viewsWrapped)
        assert.ok(Math.abs(bounds.selectGap - 24) <= 1, JSON.stringify(bounds));
      assert.ok(
        Math.abs(bounds.brandColumnOffset) <= 2,
        JSON.stringify(bounds),
      );
      assert.ok(
        bounds.brandLogoStartInset >= 0 && bounds.brandLogoEndInset >= 0,
        JSON.stringify(bounds),
      );
      assert.ok(
        Math.abs(bounds.dateStart - bounds.firstDateStart - 10) <= 2,
        JSON.stringify(bounds),
      );
      assert.ok(
        bounds.headerEnd - bounds.toolsEnd < 22,
        JSON.stringify(bounds),
      );
      assert.ok(bounds.summaryRight <= bounds.calendar + 1);
      assert.ok(bounds.calendarRight <= bounds.editor + 1);
    }
    assert.ok(await page.locator(".summary-sidebar #importOpen").isVisible());
    assert.equal(
      await page.locator(".workspace-views input[type=radio]").count(),
      3,
    );
    assert.ok(
      await page.locator(".workspace-tool-buttons #restore").isVisible(),
    );
    assert.ok(await page.locator("#monthTitle").isVisible());
  }
  await page.setViewportSize({ width: 2242, height: 1253 });
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  const views = page.locator(".workspace-views");
  // Resizing from the phone viewport also animates the root font scale.
  await page.waitForTimeout(750);
  const initial = await views.boundingBox();
  for (const view of ["agenda", "analysis", "calendar"]) {
    const label = views.locator(
      `label:has(input:enabled):has([data-view="${view}"])`,
    );
    await label.click();
    await page.waitForFunction(
      (view) =>
        document.querySelector(
          `.workspace-views label:has([data-view="${view}"]) input`,
        ).checked,
      view,
    );
    // Allow the active workspace transition to finish before the next command.
    await page.waitForTimeout(800);
    const position = await views.boundingBox();
    assert.ok(
      Math.abs(position.x - initial.x) <= 1 &&
        Math.abs(position.y - initial.y) <= 1,
      JSON.stringify({ view, initial, position }),
    );
  }
  await page.setViewportSize(original);
  await page.emulateMedia({ reducedMotion: null });
  await page.evaluate(() => {
    location.hash = "";
  });
  await agenda.waitFor({ state: "detached" });
}

async function verifyControlTheme(page) {
  const weather = page.locator("#weatherDays");
  const radius = await page.evaluate(() =>
    document.documentElement.style.getPropertyValue("--ui-radius"),
  );
  assert.match(radius, /^\d+(?:\.\d+)?px$/);
  const result = await weather.evaluate((el) => {
    const area = el.closest(".language-settings");
    area.style.setProperty("--ui-control-radius", "21px");
    area.style.setProperty("--ui-motion", "0ms");
    area.style.setProperty("--ui-stroke", "3px");
    area.style.setProperty("--ui-font-size", "17px");
    area.style.setProperty("--ui-border", "rgb(94, 31, 120)");
    const surface = el.closest(".preference-select");
    const style = getComputedStyle(surface);
    return [
      surface
        .querySelector(".preference-select-icon use")
        ?.getAttribute("href"),
      style.borderRadius,
      style.borderTopWidth,
      style.fontSize,
      style.borderTopColor,
      getComputedStyle(
        document
          .getElementById("languageTrigger")
          .closest(".preference-select"),
      ).borderRadius,
    ];
  });
  assert.deepEqual(result, [
    "#icon-caret-down",
    radius,
    "3px",
    "17px",
    "rgb(94, 31, 120)",
    radius,
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
      "--ui-font-size",
      "--ui-border",
    ])
      area.style.removeProperty(name);
  });
}

async function verifyAgendaEditor(page) {
  await page.evaluate(() => {
    location.hash = "dev";
  });
  await selectWorkspaceCommand(page, "pageSettingsOpen");
  await selectWorkspaceCommand(page, "agenda");
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
  await page.evaluate(() => {
    location.hash = "";
  });
  await page.locator(".workspace.agenda-mode").waitFor({ state: "detached" });
}

async function verifyCalendarAndRestore(page) {
  const today = await page.evaluate(() =>
    WorkTimeApp.domain.time.businessDate(new Date()),
  );
  const first = page.locator(".day.selected");
  const selected = await first.getAttribute("data-date");
  const cursor = new Date(selected.slice(0, 7) + "-15T12:00:00Z");
  const forward = cursor.getUTCMonth() >= 6;
  const startYear = cursor.getUTCFullYear();
  while (cursor.getUTCFullYear() === startYear) {
    cursor.setUTCMonth(cursor.getUTCMonth() + (forward ? 1 : -1));
    await page.locator(forward ? "#nextMonth" : "#prevMonth").click();
    await page.waitForFunction(
      (month) =>
        !document.getElementById("panelContent").inert &&
        document.querySelector('.day[data-date="' + month + '-15"]') !== null,
      cursor.toISOString().slice(0, 7),
    );
  }
  await page.locator("#todayButton").click();
  await page.locator('.day.selected[data-date="' + today + '"]').waitFor();
  await page.waitForFunction(
    () => !document.getElementById("panelContent").inert,
  );
  const day = page.locator(
    '.day[data-date="' +
      today.slice(0, 7) +
      (today.endsWith("-08") ? "-09" : "-08") +
      '"]',
  );
  const previous = await page.locator("#editorDate").innerText();
  await day.locator(".day-select").click();
  await page.waitForFunction(
    (before) => document.getElementById("editorDate").innerText !== before,
    previous,
  );
  await selectWorkspaceCommand(page, "batchToggle");
  await page.locator("#batchForm").waitFor();
  await page.locator("#batchCancel").click();
  await page.locator("#batchForm").waitFor({ state: "hidden" });
  await page.locator("#monthTitle").focus();
  assert.ok(
    await page.locator("#monthTitle").evaluate((element) => {
      const style = getComputedStyle(element);
      return (
        style.outlineStyle === "none" || parseFloat(style.outlineWidth) === 0
      );
    }),
  );
  await page.keyboard.press("Enter");
  await page.locator("[data-year-date]").first().waitFor();
  await page.waitForFunction(
    () => !document.getElementById("panelContent").inert,
  );
  await page.locator("#monthTitle").press("Space");
  assert.equal(
    await page.locator("[data-year-date]").first().isVisible(),
    true,
  );
  for (const key of ["Tab", "Shift+Tab"]) {
    await page.keyboard.press(key);
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "monthTitle",
    );
  }
  await page.locator("#monthTitle").click();
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
  await selectWorkspaceCommand(page, "analysis");
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
  await selectWorkspaceCommand(page, "calendar");
  await page.locator("#analysisPage").waitFor({ state: "hidden" });
  await page.waitForFunction(
    () => !document.getElementById("panelContent").inert,
  );
  await selectWorkspaceCommand(page, "importOpen");
  await page.locator("#pasteText").fill("01/01\n周四\n08:00\n19:30");
  await page.locator("#commitImport").click();
  await page.locator("#importDialog").waitFor({ state: "hidden" });
  await selectWorkspaceCommand(page, "importOpen");
  const history = page
    .locator("#importHistoryList [data-delete-import]")
    .first();
  await history.click();
  await page.locator("#deleteImportDialog [data-close]").click();
  await history.click();
  await page.locator("#confirmDeleteImport").click();
  await page.locator(".import-history-empty").waitFor();
  await selectWorkspaceCommand(page, "importOpen");
}
async function verifyDevReader(browser, url) {
  const context = await browser.newContext({ locale: "zh-CN" });
  try {
    const page = await context.newPage();
    await page.addInitScript(
      require("../../lib/runtime-test-helpers.cjs").installRuntimeFixture,
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
    await verifyWorkspaceMenubar(page);
    await verifyCalendarAndRestore(page);
    for (const expected of [5, 7]) {
      await page.waitForFunction(
        () => document.documentElement.dataset.appState === "ready",
      );
      assert.ok((await page.locator(".day[data-date]").count()) >= 28);
      await selectWorkspaceCommand(page, "pageSettingsOpen");
      const select = page.locator("#weatherDays");
      await select.waitFor();
      const displayed = await select.evaluate(
        (input) => input.closest(".preference-select").innerText,
      );
      assert.match(displayed, new RegExp(String(expected)));
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
    const gameMenuHeader = page.locator("#gamesPanel .game-menu-header");
    await gameMenuHeader.waitFor();
    assert.equal(await gameMenuHeader.locator("button").count(), 0);
    assert.equal(await page.locator("#gameArchiveDialog").count(), 0);
    await require("../../lib/game-test-helpers.cjs").launchGame(
      page,
      "game-2048",
    );
    await page.locator("#gameExitButton").click();
    await page.locator("#gameShell").waitFor({ state: "hidden" });
    await require("../../lib/game-test-helpers.cjs").launchGame(
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
    await require("../../lib/game-test-helpers.cjs").launchGame(
      page,
      "game-jump",
    );
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
    await selectWorkspaceCommand(phone, "pageSettingsOpen");
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
    const menu = phone.locator(".music-management[data-ui=disclosure]");
    await menu.locator("summary[data-ui=summary]").tap();
    const action = menu.getByRole("button").first();
    await action.waitFor();
    const themed = await action.evaluate(async (el) => {
      const owner = el.closest("details");
      owner.style.setProperty("--ui-control-radius", "9px");
      owner.style.setProperty("--ui-font-size", "15px");

      owner.style.setProperty("--ui-text", "rgb(83, 44, 120)");
      const style = getComputedStyle(el);
      // A control may already be transitioning when the menu opens.
      void style.color;
      await Promise.all(
        el
          .getAnimations()
          .filter((animation) => animation instanceof CSSTransition)
          .map((animation) => animation.finished),
      );

      return [
        style.borderRadius,
        style.fontSize,
        style.borderTopWidth,
        style.color,
        document.documentElement.style.getPropertyValue("--ui-button-radius"),
      ];
    });
    const [radius, fontSize, borderWidth, color, configuredRadius] = themed;
    assert.deepEqual(
      [radius, fontSize, borderWidth, color],
      [configuredRadius, "15px", "0px", "rgb(83, 44, 120)"],
    );
    await menu.locator("summary").tap();
    assert.equal(await menu.evaluate((el) => el.open), false);
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
  require("../../lib/browser-test-setup.cjs");
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
