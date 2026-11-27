"use strict";
require("../../lib/browser-test-setup.cjs");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { chromium } = require("playwright");
const { runtimeServer } = require("../../lib/runtime-test-helpers.cjs");

async function verify() {
  const server = await runtimeServer(path.resolve(process.argv[2] || "_site"));
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const errors = [];
  try {
    const context = await browser.newContext({
      locale: "zh-CN",
      viewport: { width: 1920, height: 1080 },
      reducedMotion: "reduce",
    });
    await context.route(/^https?:/, (route) =>
      route.request().url().startsWith(new URL(server.url).origin)
        ? route.continue()
        : route.abort(),
    );
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.clock.setFixedTime(new Date("2026-11-27T04:00:00Z"));
    await page.goto(server.url);
    await page.waitForFunction(
      () => document.documentElement.dataset.appState === "ready",
    );
    await page.evaluate(() => {
      window.sidebarFrame = [...document.querySelector(".editor").children];
    });
    async function frame() {
      const result = await page.evaluate(() => {
        const editor = document.querySelector(".editor");
        const frame = [...editor.children];
        const left = document
          .querySelector(".calendar-footer")
          .getBoundingClientRect();
        const tabs = editor
          .querySelector(".notification-tabs")
          .getBoundingClientRect();
        return {
          ids: frame.map((node) => node.id),
          stable: frame.every(
            (node, index) => window.sidebarFrame[index] === node,
          ),
          footerDifference: Math.abs(left.height - tabs.height),
          overflow: editor.scrollWidth > editor.clientWidth + 1,
          padding: getComputedStyle(editor.querySelector(".editor-content"))
            .paddingLeft,
          leftUnchanged:
            !!document.querySelector(".workspace-views .ant-segmented") ||
            document
              .querySelector(".workspace-views")
              ?.classList.contains("ant-segmented"),
        };
      });
      assert.deepEqual(result.ids, [
        "sidebarHeader",
        "sidebarContent",
        "sidebarFunctions",
      ]);
      assert.equal(result.stable, true);
      assert.equal(result.padding, "15px");
      assert.equal(
        result.leftUnchanged,
        true,
        "Left toolbar keeps its original Segmented controls",
      );
      assert.equal(result.overflow, false);
      assert.ok(
        result.footerDifference < 1,
        "Bottom Tabs match the left footer height: " + result.footerDifference,
      );
    }
    await frame();
    await page.locator('.workspace-views [data-view="analysis"]').click();
    await page.locator("#analysisSidebar").waitFor({ state: "visible" });
    await page
      .locator(".sidebar-header .analysis-sidebar-header")
      .waitFor({ state: "visible" });
    assert.equal(
      await page
        .locator("#sidebarHeader")
        .getByRole("heading", { name: "作息" })
        .count(),
      1,
    );
    await frame();
    await page.locator("#pageSettingsOpen").click();
    await page.locator("#settingsPane").waitFor({ state: "visible" });
    await page.locator('[data-settings-tab="settingsWorkTab"]').click();
    await page.locator("#settingsDialog").waitFor({ state: "visible" });
    await frame();
    await page.locator('[data-settings-tab="settingsGeneralTab"]').click();
    await page.locator("#pageSettingsPane").waitFor({ state: "visible" });
    await page.locator("#personalSettingsCancel").click();
    await page.locator("#settingsPane").waitFor({ state: "hidden" });
    await page.locator("#date-tab-history").click();
    await page.locator("#dateContextViewTrigger").click();
    await page.getByRole("option", { name: "历史", exact: true }).click();
    assert.equal(
      await page.locator("#dateContextView").inputValue(),
      "history",
    );
    await frame();
    await page.locator("#date-tab-countdown").click();
    assert.equal(
      await page.locator("#date-tab-countdown").getAttribute("aria-selected"),
      "true",
    );
    await page.locator("#date-tab-tools").click();
    await page.locator("#toolsPanel").waitFor({ state: "visible" });
    await frame();
    await page.locator("#date-tab-notifications").click();
    for (const [width, height] of [
      [1280, 720],
      [1920, 1080],
      [2560, 1440],
      [390, 900],
    ]) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(300);
      await frame();
    }
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.locator('.workspace-views [data-view="calendar"]').click();
    await page.locator("#dayEditor").waitFor({ state: "visible" });
    await page
      .locator("#sidebarHeader .editor-day-header:not([hidden])")
      .waitFor({ state: "visible" });
    const heading = await page.locator("#sidebarHeader").evaluate((header) => {
      const child = header.querySelector(
        "[data-sidebar-heading]:not([hidden])",
      );
      const title = child.querySelector(".editor-date");
      const outer = header.getBoundingClientRect(),
        inner = title.getBoundingClientRect();
      const digit = title.querySelector(
        ".summary-number-digit:not(.summary-number-outgoing)",
      );
      const digitStyle = getComputedStyle(digit);
      const digitBox = digit.getBoundingClientRect();
      const context = document.createElement("canvas").getContext("2d");
      context.font = `${digitStyle.fontStyle} ${digitStyle.fontWeight} ${digitStyle.fontSize} ${digitStyle.fontFamily}`;
      const ink = context.measureText(digit.textContent);
      const baseline =
        digitBox.top +
        (digitBox.height -
          ink.fontBoundingBoxAscent -
          ink.fontBoundingBoxDescent) /
          2 +
        ink.fontBoundingBoxAscent;
      const inkCenter =
        baseline +
        (ink.actualBoundingBoxDescent - ink.actualBoundingBoxAscent) / 2;
      return {
        dividerOffsets: [
          ...title.querySelectorAll(".calendar-date-divider"),
        ].map((svg) => {
          const box = svg.getBoundingClientRect();
          return box.top + box.height / 2 - inkCenter;
        }),
        metrics: [header, child, title].map((node) => ({
          rect: node.getBoundingClientRect().toJSON(),
          display: getComputedStyle(node).display,
          align: getComputedStyle(node).alignItems,
          padding: getComputedStyle(node).padding,
          transform: getComputedStyle(node).transform,
          translate: getComputedStyle(node).translate,
          margin: getComputedStyle(node).margin,
        })),
        fontSize: getComputedStyle(title).fontSize,
        offset: Math.abs(
          (inner.top + inner.bottom) / 2 - (outer.top + outer.bottom) / 2,
        ),
        background: getComputedStyle(header).backgroundColor,
        leftBackground: getComputedStyle(document.querySelector(".work-main"))
          .backgroundColor,
      };
    });
    assert.equal(heading.fontSize, "24px");
    assert.ok(
      heading.dividerOffsets.every((offset) => Math.abs(offset) < 1),
      "Date dividers align with digit ink: " + heading.dividerOffsets,
    );
    assert.equal(
      await page.locator("#editorDate .calendar-today-weekday").count(),
      0,
    );
    assert.equal(
      await page.locator("#editorDate .calendar-date-divider").count(),
      2,
    );
    assert.deepEqual(
      await page
        .locator(
          "#editorDate .calendar-today-number .summary-number-accessible",
        )
        .allTextContents(),
      ["2026", "11", "27"],
    );
    assert.ok(
      Math.abs(heading.offset - 2) < 1,
      "Sidebar title uses its 2px optical centering offset: " +
        JSON.stringify(heading),
    );
    assert.equal(
      heading.background,
      heading.leftBackground,
      "Header matches the left panel background",
    );
    await page.waitForFunction(
      () => !document.getElementById("panelContent").inert,
    );
    await page.evaluate(() => {
      const title = document.getElementById("editorDate");
      window.dateTitleNodes = [
        title,
        ...title.querySelectorAll(
          ".calendar-today-date, .calendar-today-number, .calendar-date-divider",
        ),
      ];
      window.dateYearMonth = [
        ...title.querySelectorAll(".calendar-today-number > .summary-number"),
      ].slice(0, 2);
    });
    await page.locator('.day[data-date="2026-11-26"]').click();
    const rolling = await page.locator("#editorDate").evaluate((title) => ({
      stable: [
        title,
        ...title.querySelectorAll(
          ".calendar-today-date, .calendar-today-number, .calendar-date-divider",
        ),
      ].every((node, index) => node === window.dateTitleNodes[index]),
      unchanged: [
        ...title.querySelectorAll(".calendar-today-number > .summary-number"),
      ]
        .slice(0, 2)
        .every((node, index) => node === window.dateYearMonth[index]),
      day: title.querySelector(
        ".calendar-today-number:last-child .summary-number-accessible",
      ).textContent,
      rolls: title.querySelectorAll(".number-roll-down, .number-roll-up")
        .length,
      wholeTitleAnimations: title.getAnimations().length,
    }));
    assert.equal(
      rolling.stable,
      true,
      "Date fields and dividers retain their nodes",
    );
    assert.equal(
      rolling.unchanged,
      true,
      "Unchanged year and month retain their rendered numbers",
    );
    assert.equal(rolling.day, "26");
    assert.ok(rolling.rolls > 0, "Changed date digits roll");
    assert.equal(
      rolling.wholeTitleAnimations,
      0,
      "Same sidebar mode does not replay the whole title animation",
    );
    await page.waitForFunction(
      () =>
        !document.querySelector(
          "#editorDate .number-roll-down, #editorDate .number-roll-up",
        ),
    );
    await page.evaluate(() => {
      window.dateTitleMarkup = document.getElementById("editorDate").innerHTML;
    });
    await page.locator('.day[data-date="2026-11-26"]').click();
    assert.equal(
      await page.locator("#editorDate").innerHTML(),
      await page.evaluate(() => window.dateTitleMarkup),
      "Selecting the same date does not redraw its title",
    );
    for (const [before, after] of [
      [10, 9],
      [9, 10],
    ]) {
      await page
        .locator(`.day[data-date="2026-11-${String(before).padStart(2, "0")}"]`)
        .click();
      await page.waitForFunction(
        () =>
          !document.querySelector(
            "#editorDate .number-roll-down, #editorDate .number-roll-up",
          ),
      );
      const beforeDividers = await page
        .locator("#editorDate .calendar-date-divider")
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getBoundingClientRect().x),
        );
      await page
        .locator(`.day[data-date="2026-11-${String(after).padStart(2, "0")}"]`)
        .click();
      const changing = await page
        .locator("#editorDate .year-month-day")
        .evaluate((slot) => {
          const outgoing = slot.querySelector(".summary-number-outgoing");
          const column = slot.querySelector(".summary-number-column");
          return {
            oldText: outgoing?.textContent,
            slotWidth: slot.getBoundingClientRect().width,
            columnWidth: column?.getBoundingClientRect().width,
            oldWidth: outgoing?.scrollWidth,
            clipWidth: column?.clientWidth,
          };
        });
      assert.equal(
        changing.oldText,
        String(before),
        "The full outgoing date remains until its roll finishes",
      );
      assert.ok(
        Math.abs(changing.slotWidth - changing.columnWidth) < 1,
        "The rolling column keeps its full two-digit slot",
      );
      assert.ok(
        changing.oldWidth <= changing.clipWidth + 1,
        "Outgoing digits are not clipped before rolling",
      );
      const afterDividers = await page
        .locator("#editorDate .calendar-date-divider")
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getBoundingClientRect().x),
        );
      assert.ok(
        afterDividers.every(
          (x, index) => Math.abs(x - beforeDividers[index]) < 1,
        ),
        "Digit-count changes keep date dividers stationary",
      );
      await page.waitForFunction(
        () =>
          !document.querySelector(
            "#editorDate .number-roll-down, #editorDate .number-roll-up",
          ),
      );
    }
    await page.locator("#monthTitle").click();
    await page
      .locator("#yearAnalysisSidebar")
      .waitFor({ state: "visible", timeout: 5000 })
      .catch(async (error) => {
        console.error(
          await page.evaluate(() => ({
            year: document.getElementById("monthTitle").outerHTML,
            analysis: document.getElementById("analysisToggle").outerHTML,
            editor: document.querySelector(".editor").className,
          })),
          errors,
        );
        throw error;
      });
    await page
      .locator("#sidebarHeader .year-analysis-header")
      .waitFor({ state: "visible" });
    await frame();
    fs.mkdirSync("test-results/sidebar-layout", { recursive: true });
    await page.screenshot({ path: "test-results/sidebar-layout/desktop.png" });
    assert.deepEqual(errors, []);
    console.log(
      "Fixed three-region sidebar, 15px padding, centered title, matching background/footer height, Ant Design Tabs/Select, responsive views, and unchanged left toolbar verified.",
    );
  } finally {
    await browser.close();
    await server.close();
  }
}
verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
