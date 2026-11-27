"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");
const { clickSettingsControl } = require("../../lib/settings-test-helpers.cjs");

async function verify() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    for (const width of [1365, 390]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        reducedMotion: "reduce",
        locale: "zh-CN",
      });
      const page = await context.newPage();
      await page.addInitScript(() => {
        const showModal = HTMLDialogElement.prototype.showModal;
        HTMLDialogElement.prototype.showModal = function () {
          if (
            ["onboardingDialog", "startupPermissionsDialog"].includes(this.id)
          )
            return;
          return showModal.call(this);
        };
      });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const fixture = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, "../../../data/weather.json"),
          "utf8",
        ),
      );
      const now = Date.now();
      fixture.updatedAt = new Date(now).toISOString();
      for (const city of Object.values(fixture.cities)) {
        city.result.now.uptime = new Date(now + 8 * 3600000)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
        city.result.forecasts.forEach((row, index) => {
          row.date = new Date(now + 8 * 3600000 + index * 86400000)
            .toISOString()
            .slice(0, 10);
        });
      }
      await page.route(
        "https://raw.githubusercontent.com/xueke-alan/WorkTime/main/data/weather.json",
        (route) => route.fulfill({ json: fixture }),
      );
      const entry =
        process.env.WORKTIME_ENTRY ||
        pathToFileURL(
          path.resolve(
            process.argv[2] || path.join(__dirname, "../../.."),
            "index.html",
          ),
        ).href;
      await page.goto(entry);
      await page.reload();
      await page.waitForFunction(
        () =>
          document.documentElement.dataset.appState === "ready" &&
          !document.documentElement.classList.contains("app-loading"),
      );
      await page.evaluate(() =>
        document.querySelector("#onboardingDialog[open]")?.close(),
      );
      const result = await page.evaluate(() => {
        const input = WorkTimeApp.domain.state.defaultState();
        input.preferences.motionMode = "reduce";
        const restored = WorkTimeApp.domain.validation.validateBackup(input);
        const probe = document.createElement("div");
        document.body.append(probe);
        WorkTimeApp.ui.motion.play(probe);
        const animations = probe.getAnimations().length;
        WorkTimeApp.ui.motion.stop(probe);
        probe.remove();
        return {
          legacyPreference: Object.hasOwn(restored.preferences, "motionMode"),
          reduced: WorkTimeApp.ui.animationCompat.preference().matches,
          animations,
        };
      });
      assert.deepEqual(result, {
        legacyPreference: false,
        reduced: false,
        animations: 1,
      });
      await clickSettingsControl(page, "#pageSettingsOpen");
      assert.equal(
        await page
          .locator("#motionTrigger, #motionMode, #motionOptions")
          .count(),
        0,
      );
      assert.equal(
        await page.locator("#weather-settings .preference-select").count(),
        2,
      );
      await clickSettingsControl(page, "#pageSettingsOpen");
      await page.locator("#date-tab-weather").click();
      await page.evaluate(() => WorkTimeApp.services.weather.setCity("东莞"));
      await page.waitForFunction(
        () =>
          [
            ...document.querySelectorAll(
              ".weather-condition img, .calendar-weather-icon img",
            ),
          ].length > 1 &&
          [
            ...document.querySelectorAll(
              ".weather-condition img, .calendar-weather-icon img",
            ),
          ].every((image) => image.complete && image.naturalWidth > 0),
      );
      assert.equal(await page.locator(".weather-condition source").count(), 0);
      assert.match(
        await page.locator(".weather-condition img").getAttribute("src"),
        /meteocons\/svg\//,
      );
      assert.ok(
        await page
          .locator("#date-tab-weather use")
          .evaluate(
            (use) => !!document.querySelector(use.getAttribute("href")),
          ),
      );
      const image = page.locator(".weather-condition img");
      const first = await image.screenshot({ animations: "allow" });
      await page.waitForTimeout(650);
      const second = await image.screenshot({ animations: "allow" });
      assert.equal(
        first.equals(second),
        false,
        "weather SVG must animate even when the OS requests reduced motion",
      );
      if (process.env.WORKTIME_SHOT && width === 1365)
        await page.screenshot({ path: process.env.WORKTIME_SHOT });
      assert.deepEqual(errors, []);
      await context.close();
    }
    console.log(
      "Always-on animation, legacy preference migration, settings and animated weather verified on desktop and mobile.",
    );
  } finally {
    await browser.close();
  }
}
verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
