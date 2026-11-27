"use strict";
const {
  cycleAgendaView,
  toggleAgenda,
} = require("../../lib/workspace-menu-test-helpers.cjs");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");
const setScheduleRange = require("../../lib/agenda-test-range.cjs");

async function verify() {
  const browser = await chromium.launch({
    channel: process.env.WORKTIME_BROWSER_CHANNEL || "msedge",
    headless: true,
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route(/^https?:/, (route) => route.abort());
    await page.clock.setFixedTime(new Date("2026-10-27T04:00:00Z"));
    await page.goto(
      pathToFileURL(path.resolve(process.argv[2] || ".", "index.html")).href +
        "#dev",
    );
    await page.waitForFunction(
      () =>
        document.documentElement.dataset.appState === "ready" &&
        !document.documentElement.classList.contains("app-loading"),
    );
    const settle = () =>
      page.evaluate(async () => {
        for (const animation of document.getAnimations()) animation.finish();
        await new Promise(requestAnimationFrame);
      });
    const dates = () =>
      page
        .locator("#calendar > .day")
        .evaluateAll((cards) =>
          cards
            .filter((card) => getComputedStyle(card).display !== "none")
            .map((card) => card.dataset.date || card.dataset.previewDate),
        );
    const today = "2026-10-27";
    const returnToday = () =>
      page.evaluate((today) => {
        document.getElementById("todayButton").click();
        const card = document.querySelector(
          `#calendar > .day[data-date="${today}"]`,
        );
        const highlight = card?.querySelector(".calendar-today-attention");
        const attention = highlight
          ?.getAnimations()
          .find((animation) => animation.effect.getTiming().duration === 800);
        return {
          selected: card?.classList.contains("selected"),
          static: highlight?.classList.contains("is-static"),
          pressed: card
            ?.querySelector(".day-select")
            ?.getAttribute("aria-pressed"),
          timing: attention?.effect.getTiming(),
          frames: attention?.effect
            .getKeyframes()
            .map((frame) => frame.computedOffset),
          navigationDuration: Math.max(
            0,
            ...document
              .getElementById("calendar")
              .getAnimations()
              .filter((animation) =>
                animation.effect
                  .getKeyframes()
                  .some((frame) => frame.transform),
              )
              .map((animation) =>
                Number(animation.effect.getTiming().duration),
              ),
          ),
        };
      }, today);
    await settle();
    const reference = await returnToday();
    assert.equal(reference.selected, true);
    assert.equal(reference.pressed, "true");
    assert.ok(reference.timing, "Work-time mode supplies the shared highlight");
    await settle();
    await page
      .locator('#calendar > .day[data-date="2026-10-16"] .day-select')
      .click();
    const attendanceDates = await dates();
    assert.equal((await returnToday()).selected, true);
    assert.deepEqual(await dates(), attendanceDates);
    await settle();
    await page.locator("#nextMonth").click();
    await settle();
    assert.equal((await returnToday()).selected, true);
    await settle();
    await toggleAgenda(page);
    await settle();
    await page.locator("#agendaNew").click();
    await page.locator("#agendaTitle").fill("跨日日程高亮检查");
    await page.locator("#agendaScheduleOpen").click();
    await setScheduleRange(page, "2026-10-23");
    await page.locator("#agendaEndDateInput").fill("2026-10-30");
    await page.locator("[data-schedule-close]").click();
    await page.locator("#agendaSave").click();
    await page.locator("#agendaForm").waitFor({ state: "hidden" });
    await settle();
    await page.reload();
    await page.waitForFunction(
      () =>
        document.documentElement.dataset.appState === "ready" &&
        !document.documentElement.classList.contains("app-loading"),
    );
    await settle();
    const ribbon = page.locator(
      '.agenda-chip[data-agenda-segment-start="2026-10-26"]',
    );
    assert.equal(
      await ribbon.getAttribute("data-agenda-text-date"),
      today,
      "Reload initializes ribbon text at the selected current date",
    );
    await page
      .locator('#calendar > .day[data-date="2026-10-26"] .day-select')
      .click({ position: { x: 8, y: 8 } });
    await settle();
    const textPosition = () =>
      ribbon.locator(".agenda-chip-title-text").evaluate((title) => {
        const button = title.closest(".agenda-chip");
        return (
          title.getBoundingClientRect().left -
          button.getBoundingClientRect().left
        );
      });
    const originalPosition = await textPosition();
    for (const selected of [
      "2026-10-28",
      "2026-10-29",
      "2026-10-30",
      "2026-10-26",
    ]) {
      const retained = await ribbon
        .locator(".agenda-slice")
        .first()
        .elementHandle();
      const samples = await page.evaluate(async (selected) => {
        const title = document.querySelector(
          '.agenda-chip[data-agenda-segment-start="2026-10-26"] .agenda-chip-title-text',
        );
        const positions = [title.getBoundingClientRect().left];
        document
          .querySelector(
            '#calendar > .day[data-date="' + selected + '"] .day-select',
          )
          .click();
        const start = performance.now();
        do {
          await new Promise(requestAnimationFrame);
          positions.push(title.getBoundingClientRect().left);
        } while (performance.now() - start < 450);
        return positions;
      }, selected);
      await settle();
      assert.equal(
        await retained.evaluate((slice) => slice.isConnected),
        true,
        "Date selection reuses painted ribbon slices",
      );
      await retained.dispose();
      assert.equal(
        await ribbon.getAttribute("data-agenda-text-date"),
        selected,
      );
      const position = await textPosition();
      assert.ok(
        selected === "2026-10-26"
          ? Math.abs(position - originalPosition) < 1
          : position > originalPosition + 10,
      );
      assert.ok(
        samples.some(
          (value) =>
            value > Math.min(samples[0], samples.at(-1)) + 1 &&
            value < Math.max(samples[0], samples.at(-1)) - 1,
        ),
        "Date clicks animate through intermediate text positions",
      );
      const box = await ribbon.boundingBox();
      await ribbon.click({
        position: { x: box.width - 28, y: box.height / 2 },
      });
      await page.locator("#agendaForm").waitFor({ state: "visible" });
      await settle();
      assert.ok(
        Math.abs((await textPosition()) - position) < 1,
        "Opening the editor from the ribbon end keeps the chosen text anchor",
      );
      await page.locator("#agendaTitle").fill("跨日日程高亮检查 " + selected);
      await page.locator("#agendaSave").click();
      await page.locator("#agendaForm").waitFor({ state: "hidden" });
      await settle();
      assert.ok(
        Math.abs((await textPosition()) - position) < 1,
        "Saving edited text keeps the chosen text anchor",
      );
      assert.equal(
        await ribbon.getAttribute("data-agenda-text-date"),
        selected,
      );
    }
    await returnToday();
    await settle();
    const checkHighlight = async () => {
      const lower = page.locator(
        '.timetable-bottom-card[data-timetable-date="2026-10-27"]',
      );
      assert.equal(await page.locator(".calendar-today-glow").count(), 0);
      assert.equal(await page.locator(".calendar-today-attention").count(), 1);
      assert.equal(
        await page.locator(".calendar-today-attention").evaluate((node) => {
          const card = node.parentElement;
          const bounds = node.getBoundingClientRect(),
            target = card.getBoundingClientRect();
          const style = getComputedStyle(node);
          return (
            card.dataset.date === "2026-10-27" &&
            style.position === "absolute" &&
            style.pointerEvents === "none" &&
            node.getAttribute("aria-hidden") === "true" &&
            Math.abs(bounds.top - target.top) <= 1 &&
            Math.abs(bounds.left - target.left) <= 1 &&
            Math.abs(bounds.width - target.width) <= 2 &&
            Math.abs(bounds.height - target.height) <= 2
          );
        }),
        true,
        "The CSS highlight is attached to the date card and shares its geometry",
      );
      if (await lower.count()) {
        assert.equal(
          await lower.evaluate(
            (card) =>
              card
                .getAnimations()
                .filter(
                  (animation) => animation.effect.getTiming().duration === 800,
                ).length,
          ),
          0,
          "The time region shares the date surface and has no separate glow",
        );
      }
    };
    for (const reducedMotion of ["no-preference", "reduce"]) {
      await page.emulateMedia({ reducedMotion });
      // Compare with the same shared highlight under each motion preference.
      const expectedFrames = reference.frames;
      for (let view = 0; view < 4; view++) {
        const visible = await dates();
        const other = visible.find(
          (date) => date !== today && date.slice(0, 7) === today.slice(0, 7),
        );
        await page
          .locator(
            `#calendar > .day[data-date="${other}"] .day-select, #calendar > .day[data-preview-date="${other}"] .day-select`,
          )
          .click({ position: { x: 5, y: 5 } });
        await settle();
        const before = await dates();
        for (let repeat = 0; repeat < 2; repeat++) {
          const result = await returnToday();
          assert.equal(result.selected, true);
          assert.equal(result.pressed, "true");
          if (!result.static) assert.deepEqual(result.timing, reference.timing);
          if (!result.static) assert.deepEqual(result.frames, expectedFrames);
          await checkHighlight();
          if (view === 3 && repeat === 0 && reducedMotion === "no-preference") {
            await page.evaluate(async () => {
              for (const element of document.querySelectorAll(
                ".calendar-today-attention",
              ))
                for (const animation of element.getAnimations()) {
                  animation.pause();
                  animation.currentTime = 240;
                }
              await new Promise(requestAnimationFrame);
            });
            fs.mkdirSync("test-results", { recursive: true });
            await page.locator("#panelContent").screenshot({
              path: "test-results/agenda-today-highlight.png",
            });
          }
          assert.deepEqual(
            await dates(),
            before,
            "Visible today keeps the current range",
          );
        }
        await settle();
        await page
          .locator(".calendar-today-attention")
          .waitFor({ state: "detached" });
        assert.equal(await page.locator(".calendar-today-glow").count(), 0);
        for (let step = 0; step < 6; step++) {
          await page.locator("#nextMonth").click();
          await settle();
        }
        assert.equal((await dates()).includes(today), false);
        const result = await returnToday();
        assert.equal(
          result.selected,
          true,
          "Returning from another range selects today",
        );
        assert.equal(result.pressed, "true");
        if (!result.static) assert.deepEqual(result.timing, reference.timing);
        if (!result.static)
          assert.equal(
            result.timing.delay,
            0,
            "CSS highlighting starts without sampling navigation timing",
          );
        if (!result.static) assert.deepEqual(result.frames, expectedFrames);
        await settle();
        await cycleAgendaView(page);
        await settle();
      }
    }
    await settle();
    await page.waitForTimeout(200);
    await page
      .locator(".calendar-today-attention")
      .waitFor({ state: "detached" });
    assert.equal(await page.locator(".calendar-today-glow").count(), 0);
    const idleReads = await page.evaluate(async () => {
      const original = Element.prototype.getBoundingClientRect;
      let reads = 0;
      Element.prototype.getBoundingClientRect = function (...args) {
        if (
          this.matches(
            ".calendar-today-attention, #calendar > .day, .agenda-chip",
          )
        )
          reads++;
        return original.apply(this, args);
      };
      try {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return reads;
      } finally {
        Element.prototype.getBoundingClientRect = original;
      }
    });
    assert.equal(
      idleReads,
      0,
      "Finished calendar animations stop measuring layout",
    );
    assert.deepEqual(errors, []);
    console.log(
      "Agenda today selection, retained ranges and shared highlight verified in all four views and both motion preferences.",
    );
  } finally {
    await browser.close();
  }
}
verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
