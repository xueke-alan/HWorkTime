"use strict";
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");
require("../../lib/browser-test-setup.cjs");

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    for (const width of [1440, 390, 320]) {
      const page = await browser.newPage({
        viewport: { width, height: 1000 },
        locale: "zh-CN",
        reducedMotion: "reduce",
      });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.stack));
      await page.route(/^https?:/, (route) => route.abort());
      await page.addInitScript(() => {
        Object.defineProperty(document, "hidden", {
          configurable: true,
          value: false,
        });
        const start = window.setInterval,
          stop = window.clearInterval;
        window.noteTimers = new Set();
        window.setInterval = (callback, delay, ...args) => {
          const id = start(callback, delay, ...args);
          if (delay === 2600) window.noteTimers.add(id);
          return id;
        };
        window.clearInterval = (id) => {
          window.noteTimers.delete(id);
          stop(id);
        };
      });
      await page.goto(
        pathToFileURL(path.resolve(process.argv[2] || ".", "index.html")).href,
      );
      await page.waitForFunction(
        () => document.documentElement.dataset.appState === "ready",
      );
      // Follow the emulated system preference while testing motion changes.
      await page.evaluate(() =>
        WorkTimeApp.services.preferences.page.saveMotionMode("system"),
      );
      await page.locator("#monthTitle").click();
      const display = page.locator("#yearViewToggle");
      const heatmap = display.getByRole("radio", {
        name: "热力图",
        exact: true,
      });
      const calendar = display.getByRole("radio", {
        name: "年历",
        exact: true,
      });
      await display.waitFor();
      assert.deepEqual(
        await display
          .locator("label svg use")
          .evaluateAll((nodes) =>
            nodes.map((node) => node.getAttribute("href")),
          ),
        ["#icon-local-fire-department", "#icon-calendar"],
      );
      const geometry = await display.evaluate((host) => {
        const rect = host.getBoundingClientRect();
        const right = document
          .querySelector(".workspace-permanent-actions")
          .getBoundingClientRect();
        return {
          left: rect.left,
          gap: right.left - rect.right,
          end: right.right,
          page: window.innerWidth,
        };
      });
      assert.ok(
        geometry.left >= 0 &&
          geometry.gap >= 0 &&
          geometry.end <= geometry.page,
        JSON.stringify(geometry),
      );
      assert.ok(await heatmap.isChecked());
      assert.equal(await page.locator(".year-month").count(), 12);
      assert.equal(
        await page.evaluate(() => window.noteTimers.size),
        0,
        "heatmap has no invisible text ticker",
      );
      await display.getByText("年历", { exact: true }).click();
      assert.ok(await calendar.isChecked());
      assert.ok(await page.locator("#calendar.year-calendar-detail").count());
      await display.getByText("年历", { exact: true }).click();
      assert.ok(await calendar.isChecked());
      assert.equal(
        await page.evaluate(() => window.noteTimers.size),
        0,
        "reduced motion has no ticker",
      );
      await page.evaluate(() => {
        window.firstYearDay = document.querySelector("[data-year-date]");
      });
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.waitForFunction(() => window.noteTimers.size === 1);
      await page.evaluate(() => {
        Object.defineProperty(document, "hidden", {
          configurable: true,
          value: true,
        });
        document.dispatchEvent(new Event("visibilitychange"));
      });
      assert.equal(await page.evaluate(() => window.noteTimers.size), 0);
      await page.evaluate(() => {
        Object.defineProperty(document, "hidden", {
          configurable: true,
          value: false,
        });
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await page.waitForFunction(() => window.noteTimers.size === 1);
      await calendar.focus();
      await calendar.press("ArrowLeft");
      assert.ok(await heatmap.isChecked());
      assert.equal(await page.evaluate(() => window.noteTimers.size), 0);
      assert.equal(
        await page.evaluate(
          () =>
            window.firstYearDay === document.querySelector("[data-year-date]"),
        ),
        true,
        "display changes preserve day nodes",
      );
      const motion = await display.evaluate(async (control) => {
        const grid = document.getElementById("calendar");
        const [heatmapLabel, detailLabel] = control.querySelectorAll("label");
        const firstMonth = grid.querySelector(".year-month");
        const readTransitions = () => grid.getAnimations({ subtree: true });
        const settle = () =>
          Promise.allSettled(readTransitions().map((item) => item.finished));
        const frame = () => new Promise(requestAnimationFrame);
        const hasFade = (node, value) =>
          node
            .getAnimations()
            .some(
              (item) =>
                item.transitionProperty === "opacity" &&
                Number(item.effect.getKeyframes().at(-1).opacity) === value,
            );
        await settle();
        detailLabel.click();
        const committed = grid.classList.contains("year-calendar-detail");
        await frame();
        const targets = readTransitions().map(
          (animation) => animation.effect.target,
        );
        const layer = (name) => firstMonth.querySelector(name);
        const detailsEnter = [
          ".year-day-surfaces",
          ".year-detail-numbers",
          ".year-day-notes",
          ".year-day-badges",
        ].every((name) => hasFade(layer(name), 1));
        const digitsMove = layer(".year-detail-numbers")
          .getAnimations()
          .some((item) => item.transitionProperty === "transform");
        const summaryLeaves = hasFade(layer(".year-month-stats"), 0);
        const legendLeaves = hasFade(document.getElementById("yearLegend"), 0);
        await settle();
        heatmapLabel.click();
        await frame();
        const notesLeave = hasFade(layer(".year-day-notes"), 0);
        const watermarkLeaves = hasFade(
          document.getElementById("yearWatermark"),
          0,
        );
        detailLabel.click();
        heatmapLabel.click();
        detailLabel.click();
        const current = control.querySelector("input:checked");
        return {
          committed,
          detailsEnter,
          digitsMove,
          summaryLeaves,
          legendLeaves,
          notesLeave,
          watermarkLeaves,
          sharedLayers: targets.every((target) =>
            target.matches(".year-day-layer, .year-month-stats"),
          ),
          boundedMotion: targets.length <= 12 * 17,
          detail: grid.classList.contains("year-calendar-detail"),
          checked: detailLabel.contains(current),
        };
      });
      assert.deepEqual(motion, {
        committed: true,
        detailsEnter: true,
        digitsMove: true,
        summaryLeaves: true,
        legendLeaves: true,
        notesLeave: true,
        watermarkLeaves: true,
        sharedLayers: true,
        boundedMotion: true,
        detail: true,
        checked: true,
      });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.waitForFunction(
        () => document.documentElement.dataset.reducedMotion === "true",
      );
      assert.equal(
        await page
          .locator("#calendar")
          .evaluate((grid) => grid.getAnimations({ subtree: true }).length),
        0,
      );
      const firstDay = page.locator("[data-year-date]").first();
      await firstDay.click({ trial: true });
      assert.ok(
        await firstDay.evaluate((day) => {
          const days = day.parentElement;
          const index = [...days.children].indexOf(day);
          const number = days.querySelector(".year-detail-numbers").children[
            index
          ];
          const buttonBounds = day.getBoundingClientRect();
          const numberBounds = number.getBoundingClientRect();
          return (
            buttonBounds.x === numberBounds.x &&
            buttonBounds.y === numberBounds.y &&
            buttonBounds.width === numberBounds.width
          );
        }),
        "decorative layers align with the dates and leave them clickable",
      );
      const month = page.locator("[data-year-month]").first();
      const key = await month.getAttribute("data-year-month");
      await month.locator(".year-month-number").click();
      assert.equal(await month.getAttribute("aria-current"), "true");
      assert.equal(
        await page
          .locator("[data-year-month][aria-current=true]")
          .getAttribute("data-year-month"),
        key,
      );
      const overflow = await page
        .locator("#calendar")
        .evaluate((element) => element.scrollWidth > element.clientWidth + 1);
      assert.equal(overflow, false, "year view fits viewport");
      const date = await firstDay.getAttribute("data-year-date");
      await firstDay.click();
      await page.locator("#calendar .day.selected").waitFor();
      assert.equal(
        await page.locator("#calendar .day.selected").getAttribute("data-date"),
        date,
        "clicking through the decorative layers opens the selected date",
      );
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log(
      "Year display switching, stable day nodes, month consistency, responsive layout, visibility and motion-aware ticker verified.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
