"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { chromium } = require("playwright");
const { installRuntimeFixture } = require("../../lib/runtime-test-helpers.cjs");

async function verify() {
  const source = { WorkTimeApp: { domain: {} } };
  vm.runInNewContext(
    fs.readFileSync(path.resolve("assets/js/domain/state.js"), "utf8"),
    source,
  );
  const state = source.WorkTimeApp.domain.state.defaultState();
  state.preferences.language = "zh-CN";
  state.scheduleRanges = [
    {
      start: "2026-11-27",
      end: "2026-11-27",
      schedule: { ...state.settings, workEnd: "18:00" },
    },
  ];
  const draft = { start: "08:55", end: "", nextDay: false };
  state.days = {
    "2026-11-26": { draft },
    "2026-11-27": {
      oa: {
        ...draft,
        date: "2026-11-27",
        status: "pending",
        source: "test",
        raw: "",
      },
    },
    "2026-11-30": { draft },
  };
  const browser = await chromium.launch({
    channel: process.env.WORKTIME_BROWSER_CHANNEL || "msedge",
    headless: true,
  });
  try {
    const context = await browser.newContext({
      locale: "zh-CN",
      permissions: ["clipboard-read"],
      viewport: { width: 1440, height: 1000 },
    });
    await context.addInitScript(installRuntimeFixture);
    await context.addInitScript((fixture) => {
      localStorage.setItem("worktime-local-v1", JSON.stringify(fixture));
      localStorage.setItem("worktime.installReminder.dismissed.v1", "true");
    }, state);
    const url = process.argv[2] || "http://127.0.0.1:4173/HWorkTime/";
    await context.route(/^https?:/, (route) =>
      route
        .request()
        .url()
        .startsWith(new URL(url).origin + "/")
        ? route.continue()
        : route.abort(),
    );
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const before = new Date("2026-11-27T17:59:00+08:00");
    await page.clock.install({ time: before });
    await page.goto(url);
    await page.waitForFunction(
      () =>
        document.documentElement.dataset.appState === "ready" &&
        WorkTimeApp.services.runtimeFolder.state.status === "available",
    );
    if (await page.locator("#onboardingDialog[open]").count())
      await page.locator("[data-onboarding-next]").click();
    await page.reload();
    await page.waitForFunction(
      () => document.documentElement.dataset.appState === "ready",
    );
    await page.clock.runFor(1500);
    const card = (date) => page.locator(`.day[data-date="2026-11-${date}"]`);
    const tag = (date) =>
      card(date)
        .locator(".daystatus .pill")
        .filter({ hasText: /等下班|待录入/ });
    assert.equal(await tag("27").textContent(), "等下班");
    assert.match(
      await card("27").locator(".day-select").getAttribute("aria-label"),
      /等下班/,
    );
    assert.equal(await tag("26").textContent(), "待录入");
    assert.equal(await tag("30").textContent(), "待录入");
    assert.equal(await tag("25").textContent(), "待录入");
    await page.screenshot({
      path: "test-results/calendar-waiting.png",
      animations: "disabled",
    });

    // The date's 18:00 schedule wins over the default 17:30. At its boundary
    // the existing page must update without navigation or reloading.
    await page.clock.fastForward(
      Date.parse("2026-11-27T18:00:00+08:00") -
        (await page.evaluate(() => Date.now())),
    );
    await page.waitForFunction(
      () =>
        document.querySelector('.day[data-date="2026-11-27"] .daystatus .pill')
          ?.textContent === "待录入",
    );

    // Verify manual entry and missing/complete clocks through the real editor.
    await page.clock.setFixedTime(before);
    await card("27").locator(".day-select").click();
    await page.locator("#dayStart").fill("09:00");
    await page.locator("#dayStart").press("Tab");
    assert.equal(await tag("27").textContent(), "等下班");
    await page.locator("#dayEnd").fill("17:00");
    await page.locator("#dayEnd").press("Tab");
    assert.equal(await tag("27").count(), 0);
    await page.locator("#dayEnd").fill("");
    await page.locator("#dayEnd").press("Tab");
    assert.equal(await tag("27").textContent(), "等下班");

    await card("25").locator(".day-select").click();
    await page.locator("#todayButton").click();
    await page.locator("#dayStart").fill("");
    await page.locator("#dayEnd").fill("17:00");
    await page.locator("#dayEnd").press("Tab");
    // An OA start still fills the manual record unless manual priority wins.
    const sourceToggle = card("27").locator(".source-toggle");
    if ((await sourceToggle.getAttribute("aria-pressed")) !== "true")
      await sourceToggle.click();
    assert.equal(await tag("27").textContent(), "待录入");
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      "Calendar waiting-for-clock-out verified on the built preview.",
    );
  } finally {
    await browser.close();
  }
}
verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
