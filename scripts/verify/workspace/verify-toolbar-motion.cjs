"use strict";
const { toggleAgenda } = require("../../lib/workspace-menu-test-helpers.cjs");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");
require("../../lib/browser-test-setup.cjs");

async function verifyWorkdaySwitch(browser) {
  for (const width of [1480, 390]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: "no-preference",
      locale: "zh-CN",
    });
    await page.route(/^https?:/, (route) => route.abort());
    await page.addInitScript(() =>
      localStorage.setItem("worktime.onboarding.v1", "dismissed"),
    );
    await page.goto(
      pathToFileURL(path.resolve(process.argv[2] || ".", "index.html")).href +
        "#dev",
    );
    await page.waitForFunction(
      () =>
        document.documentElement.dataset.appState === "ready" &&
        !document.documentElement.classList.contains("app-loading"),
    );
    await page.evaluate(() =>
      WorkTimeApp.services.preferences.page.saveMotionMode("system"),
    );
    await toggleAgenda(page);
    await page.locator("#agendaViewToggle").waitFor();
    const reveal = await page.evaluate(() => {
      document.querySelector('label:has([data-agenda-weeks="1"])').click();
      const button = document.querySelector("#agendaWorkdaysOnly");
      const animation = button.getAnimations()[0];
      if (!animation) return null;
      animation.pause();
      animation.currentTime = 0;
      const start = Number(getComputedStyle(button).opacity);
      const startOffset = new DOMMatrix(getComputedStyle(button).transform);
      animation.currentTime = 110;
      const middle = Number(getComputedStyle(button).opacity);
      animation.currentTime = 220;
      const end = Number(getComputedStyle(button).opacity);
      animation.finish();
      return {
        start,
        middle,
        end,
        startX: startOffset.m41,
        startY: startOffset.m42,
        hidden: button.hidden,
        inert: button.inert,
      };
    });
    assert.ok(
      reveal &&
        reveal.start === 0 &&
        reveal.middle > 0 &&
        reveal.middle < 1 &&
        reveal.end === 1,
    );
    assert.equal(reveal.startX, -4);
    assert.equal(reveal.startY, 0);
    assert.equal(reveal.hidden, false);
    assert.equal(reveal.inert, false);
    const reversal = await page.evaluate(() => {
      document.querySelector('label:has([data-agenda-weeks="0"])').click();
      const button = document.querySelector("#agendaWorkdaysOnly");
      const exit = button.getAnimations()[0];
      exit.pause();
      exit.currentTime = 110;
      const middle = Number(getComputedStyle(button).opacity);
      const exitOffset = new DOMMatrix(getComputedStyle(button).transform);
      const inert = button.inert;
      const hidden = button.hidden;
      document.querySelector('label:has([data-agenda-weeks="1"])').click();
      const entrance = button.getAnimations()[0];
      entrance.pause();
      entrance.currentTime = 0;
      const resumed = Number(getComputedStyle(button).opacity);
      entrance.finish();
      return {
        middle,
        inert,
        hidden,
        resumed,
        exitX: exitOffset.m41,
        exitY: exitOffset.m42,
      };
    });
    assert.ok(reversal.middle > 0 && reversal.middle < 1);
    assert.ok(reversal.exitX > 0 && reversal.exitX < 4);
    assert.equal(reversal.exitY, 0);
    assert.equal(
      reversal.inert,
      true,
      "The departing button cannot be clicked or focused",
    );
    assert.equal(
      reversal.hidden,
      false,
      "The button remains painted until its exit ends",
    );
    assert.ok(
      Math.abs(reversal.middle - reversal.resumed) < 0.01,
      "Rapid reversal resumes from the current opacity",
    );
    await toggleAgenda(page);
    await page.waitForFunction(
      () => document.querySelector("#agendaWorkdaysOnly").hidden,
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await toggleAgenda(page);
    await page.locator("#agendaViewToggle").waitFor();
    assert.equal(
      await page
        .locator("#agendaWorkdaysOnly")
        .evaluate(
          (button) =>
            !button.hidden &&
            !button.inert &&
            button.getAnimations().length === 0,
        ),
      true,
    );
    await toggleAgenda(page);
    await page.locator("#agendaViewToggle").waitFor({ state: "hidden" });
    assert.equal(
      await page
        .locator("#agendaWorkdaysOnly")
        .evaluate((button) => button.hidden),
      true,
    );
    await page.close();
  }
}
async function verify() {
  const browser = await chromium.launch({
    channel: process.env.WORKTIME_BROWSER_CHANNEL || "msedge",
    headless: true,
  });
  const errors = [];
  try {
    await verifyWorkdaySwitch(browser);
    const page = await browser.newPage({
      viewport: { width: 1480, height: 1000 },
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route(/^https?:/, (route) => route.abort());
    await page.addInitScript(() =>
      localStorage.setItem("worktime.onboarding.v1", "dismissed"),
    );
    await page.goto(
      pathToFileURL(path.resolve(process.argv[2] || ".", "index.html")).href +
        "#dev",
    );
    await page.waitForFunction(
      () => document.documentElement.dataset.appState === "ready",
    );
    await page.evaluate(() =>
      WorkTimeApp.services.preferences.page.saveMotionMode("system"),
    );
    await page.evaluate(() => WorkTimeApp.ui.selectWorkspaceView("calendar"));
    await page.evaluate(() =>
      WorkTimeApp.services.assets.style("assets/css/agenda-details.css"),
    );
    const settle = () =>
      page.waitForFunction(
        () =>
          !document
            .querySelector(".workspace-tool-buttons")
            .getAnimations({ subtree: true }).length &&
          !document.querySelector(".agenda-toolbar-outgoing") &&
          !document.querySelector("#panelContent").inert,
      );
    const click = (id) =>
      page.evaluate((id) => document.getElementById(id).click(), id);
    const settings = page.locator("#settingsPane");
    await click("pageSettingsOpen");
    await settings.waitFor();
    await click("pageSettingsOpen");
    await settle();
    const icons = await page.evaluate(() => {
      const toggle = (id) => {
        const button = document.getElementById(id);
        const icon = button.querySelector("svg");
        button.click();
        const animations = icon.getAnimations();
        return {
          href: icon.querySelector("use").getAttribute("href"),
          motion: animations.map(({ effect }) => ({
            timing: effect.getTiming(),
            frames: effect.getKeyframes(),
          })),
        };
      };
      return {
        settings: [toggle("pageSettingsOpen"), toggle("pageSettingsOpen")],
        batch: [toggle("batchToggle"), toggle("batchToggle")],
      };
    });
    assert.deepEqual(
      icons.batch.map(({ href }) => href),
      ["#icon-close", "#icon-stacks"],
    );
    assert.deepEqual(
      icons.settings.map(({ href }) => href),
      ["#icon-close", "#icon-settings"],
    );
    for (const [index, { motion }] of icons.batch.entries()) {
      assert.equal(motion.length, 1);
      assert.equal(motion[0].timing.duration, 280);
      assert.deepEqual(motion, icons.settings[index].motion);
    }
    await settle();
    for (const width of [1480, 1000, 760, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await settle();
      for (const forward of [true, false]) {
        const frames = await page.evaluate(async (forward) => {
          const tools = document.querySelector(".workspace-tool-buttons");
          const backup = document.querySelector("#restore");
          const outgoing = document.querySelector(
            forward ? "#batchToggle" : "#agendaViewToggle",
          );
          const incoming = document.querySelector(
            forward ? "#agendaViewToggle" : "#batchToggle",
          );
          const before = outgoing.getBoundingClientRect();
          const baseline = backup.getBoundingClientRect();
          document.querySelector("#agendaMode").click();
          await Promise.resolve();
          const ghost = tools.querySelector(
            ':scope > .agenda-toolbar-outgoing[data-toolbar-source="' +
              (forward ? "attendance" : "agenda") +
              '"]',
          );
          const exit = ghost.getAnimations()[0];
          const enter = incoming.getAnimations()[0];
          function sample(time) {
            exit.currentTime = enter.currentTime = time;
            const oldStyle = getComputedStyle(ghost);
            const newStyle = getComputedStyle(incoming);
            return {
              oldOpacity: Number(oldStyle.opacity),
              newOpacity: Number(newStyle.opacity),
              exitX: new DOMMatrixReadOnly(oldStyle.transform).m41,
              enterX: new DOMMatrixReadOnly(newStyle.transform).m41,
            };
          }
          const samples = [0, 55, 110, 165, 205].map(sample);
          sample(0);
          const start = ghost.getBoundingClientRect();
          const startBackup = backup.getBoundingClientRect();
          const keyframes = tools
            .getAnimations({ subtree: true })
            .flatMap((animation) => animation.effect.getKeyframes());
          let maxBackupShift = 0;
          while (ghost.isConnected) {
            maxBackupShift = Math.max(
              maxBackupShift,
              Math.abs(backup.getBoundingClientRect().x - baseline.x),
            );
            await new Promise(requestAnimationFrame);
          }
          return {
            samples,
            startShift: Math.hypot(start.x - before.x, start.y - before.y),
            backupStartShift: Math.hypot(
              startBackup.x - baseline.x,
              startBackup.y - baseline.y,
            ),
            maxBackupShift,
            layoutKeyframes: keyframes.some(
              (frame) => "width" in frame || "marginRight" in frame,
            ),
            ghostInert:
              ghost.inert &&
              ghost.getAttribute("aria-hidden") === "true" &&
              !ghost.id,
          };
        }, forward);
        const context = JSON.stringify({ width, forward, frames });
        assert.ok(frames.startShift < 1, context);
        assert.ok(frames.backupStartShift < 2, context);
        assert.ok(frames.maxBackupShift < 1, context);
        assert.equal(frames.layoutKeyframes, false, context);
        assert.equal(frames.ghostInert, true);
        assert.ok(
          frames.samples.every(
            ({ oldOpacity, newOpacity }) => oldOpacity + newOpacity > 0.99,
          ),
          "Crossfade keeps a visible control throughout the switch",
        );
        for (const [index, sample] of frames.samples.entries()) {
          const next = frames.samples[index + 1];
          if (!next) break;
          assert.ok(
            sample.exitX < next.exitX && sample.enterX > next.enterX,
            context,
          );
          assert.ok(
            sample.oldOpacity > next.oldOpacity &&
              sample.newOpacity < next.newOpacity,
            context,
          );
        }
        await settle();
      }
      await click("agendaMode");
      await settle();
      for (const [weeks, view] of [
        [1, "week"],
        [2, "fortnight"],
        [3, "threeweek"],
        [0, "month"],
      ]) {
        const transition = await page.evaluate(async (weeks) => {
          const button = document.querySelector("#agendaViewToggle");
          const tools = document.querySelector(".workspace-tool-buttons");
          const backup = document.querySelector("#restore");
          const baseline = button.getBoundingClientRect();
          const backupX = backup.getBoundingClientRect().x;
          button
            .querySelector(`label:has([data-agenda-weeks="${weeks}"])`)
            .click();
          const result = {
            view: button.dataset.view,
            selected: button.querySelector(
              "label:has(input:checked) [data-agenda-weeks]",
            ).dataset.agendaWeeks,
            layoutAnimations:
              tools.getAnimations().length + button.getAnimations().length,
            ghosts: tools.querySelectorAll(".agenda-toolbar-outgoing").length,
            maxShift: 0,
            minOpacity: 1,
          };
          const start = performance.now();
          while (performance.now() - start < 240) {
            const rect = button.getBoundingClientRect();
            result.maxShift = Math.max(
              result.maxShift,
              Math.abs(rect.x - baseline.x),
              Math.abs(rect.width - baseline.width),
              Math.abs(backup.getBoundingClientRect().x - backupX),
            );
            result.minOpacity = Math.min(
              result.minOpacity,
              Number(getComputedStyle(button).opacity),
            );
            await new Promise(requestAnimationFrame);
          }
          return result;
        }, weeks);
        assert.equal(transition.view, view);
        assert.equal(transition.selected, String(weeks));
        assert.equal(transition.layoutAnimations, 0);
        assert.equal(transition.ghosts, 0);
        assert.equal(transition.minOpacity, 1);
        assert.ok(
          transition.maxShift < 1,
          JSON.stringify({ width, transition }),
        );
        await settle();
      }
      await click("agendaMode");
      await settle();
      // Reverse during both the exit and entry phases and retain the painted state.
      for (const time of [30, 100, 170]) {
        const continuity = await page.evaluate(async (time) => {
          const tools = document.querySelector(".workspace-tool-buttons");
          function paint() {
            return Object.fromEntries(
              [...tools.querySelectorAll("[data-toolbar-source]")]
                .filter(
                  (node) =>
                    node.dataset.toolbarSource && node.getClientRects().length,
                )
                .map((node) => {
                  const { x, y } = node.getBoundingClientRect();
                  return [
                    node.dataset.toolbarSource,
                    { x, y, opacity: Number(getComputedStyle(node).opacity) },
                  ];
                }),
            );
          }
          document.querySelector("#agendaMode").click();
          await Promise.resolve();
          for (const animation of tools.getAnimations({ subtree: true }))
            animation.currentTime = time;
          const before = paint();
          document.querySelector("#agendaMode").click();
          return { before, after: paint() };
        }, time);
        for (const source of ["attendance", "agenda"]) {
          const before = continuity.before[source];
          const after = continuity.after[source];
          assert.ok(before && after, JSON.stringify(continuity));
          assert.ok(
            Math.abs(before.opacity - after.opacity) < 0.02 &&
              Math.hypot(before.x - after.x, before.y - after.y) < 1,
            JSON.stringify({ width, time, source, before, after }),
          );
        }
        await settle();
        assert.equal(await page.locator("#batchToggle").isVisible(), true);
      }
      for (const agenda of [false, true]) {
        if (agenda) {
          await click("agendaMode");
          await settle();
        }
        const collapse = await page.evaluate(
          async (source) => {
            const region = document.querySelector(
              ".agenda-toolbar-region:not(.agenda-modes-region)",
            );
            const backup = document.querySelector("#restore");
            const initial = region.getBoundingClientRect().width;
            const baseline = backup.getBoundingClientRect().x;
            const tools = region.parentElement;
            document.querySelector("#analysisToggle").click();
            const samples = [];
            const start = performance.now();
            while (performance.now() - start < 1200) {
              const ghost = tools.querySelector(
                `.agenda-toolbar-outgoing[data-toolbar-source="${source}"]`,
              );
              samples.push({
                hidden: region.hidden,
                width: region.getBoundingClientRect().width,
                shift: Math.abs(backup.getBoundingClientRect().x - baseline),
                outgoingOpacity: ghost
                  ? Number(getComputedStyle(ghost).opacity)
                  : 0,
              });
              if (
                region.hidden &&
                !ghost &&
                document
                  .querySelector("#analysisToggle")
                  .getAttribute("aria-pressed") === "true"
              )
                break;
              await new Promise(requestAnimationFrame);
            }
            return { initial, samples, hidden: region.hidden };
          },
          agenda ? "agenda" : "attendance",
        );
        assert.ok(
          collapse.samples.some(
            (sample) => sample.hidden && sample.outgoingOpacity > 0,
          ) &&
            collapse.samples.every(
              (sample) =>
                sample.width === 0 ||
                Math.abs(sample.width - collapse.initial) < 1,
            ),
          JSON.stringify({ width, agenda, collapse }),
        );
        assert.ok(
          collapse.samples.every((sample) => sample.shift < 1),
          JSON.stringify({ width, collapse }),
        );
        assert.equal(
          collapse.hidden,
          true,
          JSON.stringify({ width, collapse }),
        );
        await settle();
        await click(agenda ? "agendaMode" : "analysisToggle");
        await settle();
        assert.equal(
          await page
            .locator(agenda ? "#agendaViewToggle" : "#batchToggle")
            .isVisible(),
          true,
        );
        if (agenda) {
          await click("agendaMode");
          await settle();
        }
      }
    }
    await page.setViewportSize({ width: 1480, height: 1000 });
    for (const [incoming, outgoing] of [
      ["#yearViewToggle", "attendance"],
      ["#batchToggle", "year"],
    ]) {
      await click("monthTitle");
      await page.waitForFunction(
        ({ incoming, outgoing }) => {
          const ghost = document.querySelector(
            `.agenda-toolbar-outgoing[data-toolbar-source="${outgoing}"]`,
          );
          return (
            ghost?.getAnimations().length &&
            document.querySelector(incoming).getAnimations().length
          );
        },
        { incoming, outgoing },
      );
      await settle();
      assert.ok(await page.locator(incoming).isVisible());
    }
    // Batch mode also animates its mode group. Interruptions settle that group
    // immediately, including while its collapse is still in the delay phase.
    for (const interruption of ["motion", "resize", "visibility"]) {
      await click("batchToggle");
      if (interruption === "motion") {
        await page.emulateMedia({ reducedMotion: "reduce" });
        // MatchMedia change events are delivered asynchronously by the browser.
        await page.waitForFunction(() => {
          const region = document.querySelector(".agenda-modes-region");
          return (
            region.hidden && !region.getAnimations({ subtree: true }).length
          );
        });
        assert.equal(
          await page
            .locator("#batchToggle svg")
            .evaluate((icon) => icon.getAnimations().length),
          0,
        );
      } else
        await page.evaluate((kind) => {
          if (kind === "resize") window.dispatchEvent(new Event("resize"));
          else {
            Object.defineProperty(document, "hidden", {
              configurable: true,
              value: true,
            });
            document.dispatchEvent(new Event("visibilitychange"));
          }
        }, interruption);
      const modes = await page
        .locator(".agenda-modes-region")
        .evaluate((node) => ({
          hidden: node.hidden,
          animations: node.getAnimations({ subtree: true }).length,
          width: node.style.width,
        }));
      assert.deepEqual(modes, { hidden: true, animations: 0, width: "" });
      await click("batchCancel");
      await page.evaluate(() => {
        delete document.hidden;
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await settle();
    }
    await page.evaluate(() => {
      document.querySelector("#batchToggle").focus();
      document.querySelector("#agendaMode").click();
    });
    assert.equal(
      await page.evaluate(() =>
        document.activeElement.matches(".workspace-views input"),
      ),
      true,
    );
    await settle();
    // Preference changes during an animation settle it immediately.
    await click("agendaMode");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await settle();
    await click("agendaMode");
    assert.equal(await page.locator(".agenda-toolbar-outgoing").count(), 0);
    await click("analysisToggle");
    await settle();
    assert.equal(
      await page
        .locator(".agenda-toolbar-region:not(.agenda-modes-region)")
        .isVisible(),
      false,
    );
    await click("analysisToggle");
    await settle();
    assert.equal(
      await page.locator("#agendaViewToggle").isVisible(),
      false,
      "Leaving analysis always returns to the attendance toolbar",
    );
    await click("agendaMode");
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await settle();
    assert.equal(await page.locator(".agenda-toolbar-outgoing").count(), 0);
    await page.evaluate(() => {
      delete document.hidden;
      document.dispatchEvent(new Event("visibilitychange"));
    });
    if (
      (await page.locator("#agendaMode").getAttribute("aria-pressed")) ===
      "true"
    ) {
      await click("agendaMode");
      await settle();
    }
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.evaluate(() => {
      Element.prototype.animate = undefined;
    });
    await click("agendaMode");
    await settle();
    assert.equal(await page.locator("#agendaViewToggle").isVisible(), true);
    await click("agendaMode");
    await settle();
    assert.equal(await page.locator("#batchToggle").isVisible(), true);
    await click("analysisToggle");
    await settle();
    assert.equal(
      await page
        .locator(".agenda-toolbar-region:not(.agenda-modes-region)")
        .isVisible(),
      false,
    );
    await click("analysisToggle");
    await settle();
    // Keep the permanent actions inside the panel after language and size changes.
    for (const language of ["en", "ja"]) {
      await page.evaluate((id) => WorkTimeApp.i18n.setLanguage(id), language);
      for (const width of [320, 390, 540]) {
        await page.setViewportSize({ width, height: 1000 });
        const fits = await page
          .locator(".workspace-permanent-actions")
          .evaluate((node) => {
            const button = node.getBoundingClientRect();
            const panel = node.closest(".panel").getBoundingClientRect();
            return button.left >= panel.left && button.right <= panel.right;
          });
        assert.equal(fits, true, language + " permanent actions at " + width);
      }
    }
    assert.deepEqual(errors, []);
    console.log(
      "Toolbar directions, timing, rapid reversal, analysis collapse, stable actions, narrow layouts, focus, reduced motion and missing animation API verified.",
    );
  } finally {
    await browser.close();
  }
}
verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
