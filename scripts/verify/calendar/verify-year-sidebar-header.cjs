"use strict";
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");
require("../../lib/browser-test-setup.cjs");

async function verify() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const entry =
        process.env.WORKTIME_ENTRY ||
        pathToFileURL(path.resolve(process.argv[2] || "_site", "index.html"))
          .href;
      await page.route(/^https?:/, (route) =>
        route.request().url().startsWith("http://127.0.0.1:4173/")
          ? route.continue()
          : route.abort(),
      );
      await page.goto(entry);
      await page.reload();
      await page.waitForFunction(
        () =>
          document.documentElement.dataset.appState === "ready" &&
          !document.documentElement.classList.contains("app-loading"),
      );
      const originalLabel = await page.locator("#importOpen").textContent();
      for (let repeat = 0; repeat < 2; repeat++) {
        await page.locator("#importOpen").click();
        await page.locator("#importOASite").evaluate(async (button) => {
          await Promise.allSettled(
            button.getAnimations().map((animation) => animation.finished),
          );
        });
        const frames = await page.evaluate(async () => {
          const button = document.getElementById("importOpen");
          const site = document.getElementById("importOASite");
          const group = document.getElementById("oaRecordActions");
          const read = () => ({
            label: button.textContent,
            width: button.getBoundingClientRect().width,
            margin: getComputedStyle(site).marginInlineEnd,
            siteVisible: getComputedStyle(site).visibility,
            nestedMotion: site
              .getAnimations()
              .some((animation) => animation.transitionProperty),
            opacity: Number(getComputedStyle(group).opacity),
          });
          const samples = [read()];
          const start = performance.now();
          document.getElementById("monthTitle").click();
          do {
            await new Promise(requestAnimationFrame);
            samples.push(read());
          } while (performance.now() - start < 800);
          return samples;
        });
        assert.ok(frames.length > 2, "Sample multiple painted frames");
        assert.ok(
          frames.some((frame) => frame.opacity > 0 && frame.opacity < 1),
          "The outgoing button fades into the date label",
        );
        for (const frame of frames) {
          if (frame.opacity > 0) {
            assert.equal(
              frame.label,
              "返回概览",
              "No intermediate import label",
            );
            assert.ok(Math.abs(frame.width - frames[0].width) < 1);
            assert.equal(frame.margin, frames[0].margin);
            assert.equal(frame.siteVisible, "hidden");
          }
          assert.equal(frame.nestedMotion, false, "No nested OA expansion");
        }
        assert.equal(frames.at(-1).opacity, 0);
        assert.equal(frames.at(-1).label, originalLabel, "Reset while hidden");
        assert.equal(frames.at(-1).margin, "0px");
        assert.equal(await page.locator("#importDialog").isVisible(), false);
        assert.equal(
          await page.locator(".sidebar-year-month").isVisible(),
          true,
        );
        const incoming = await page.evaluate(async () => {
          const group = document.getElementById("oaRecordActions");
          const site = document.getElementById("importOASite");
          const button = document.getElementById("importOpen");
          const samples = [];
          const start = performance.now();
          document.getElementById("monthTitle").click();
          do {
            await new Promise(requestAnimationFrame);
            samples.push({
              label: button.textContent,
              width: button.getBoundingClientRect().width,
              siteOffset:
                site.getBoundingClientRect().left -
                group.getBoundingClientRect().left,
              margin: getComputedStyle(site).marginInlineEnd,
              nestedMotion: site
                .getAnimations()
                .some((animation) => animation.transitionProperty),
              opacity: Number(getComputedStyle(group).opacity),
            });
          } while (performance.now() - start < 800);
          return samples;
        });
        assert.ok(
          incoming.some((frame) => frame.opacity > 0 && frame.opacity < 1),
        );
        for (const frame of incoming) {
          assert.equal(frame.label, originalLabel);
          assert.equal(frame.margin, "0px");
          assert.equal(frame.nestedMotion, false, "No icon slide on reveal");
          assert.ok(Math.abs(frame.width - incoming[0].width) < 1);
          assert.ok(Math.abs(frame.siteOffset - incoming[0].siteOffset) < 1);
        }
        await page.waitForFunction(
          () =>
            !document.getElementById("panelContent").inert &&
            getComputedStyle(document.getElementById("oaRecordActions"))
              .opacity === "1",
        );
        assert.equal(
          await page.locator("#importOpen").textContent(),
          originalLabel,
        );
        assert.equal(await page.locator("#importOASite").isVisible(), true);
      }
      // Ordinary returns still restore the import controls and remain usable.
      await page.locator("#importOpen").click();
      await page.locator("#importOpen").click();
      await page.waitForFunction(
        (label) =>
          !document.getElementById("importDialog").open &&
          document.getElementById("importOpen").textContent === label,
        originalLabel,
      );
      assert.equal(
        await page.locator("#importOpen").textContent(),
        originalLabel,
      );
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log(
      "Year sidebar header: stable outgoing label/width, no OA expansion, repeated switches and normal return passed at 1440/390px.",
    );
  } finally {
    await browser.close();
  }
}
verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
