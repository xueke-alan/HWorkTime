"use strict";
const assert = require("node:assert/strict");
const path = require("node:path");
const { chromium } = require("playwright");
const {
  installRuntimeFixture,
  runtimeServer,
} = require("../../lib/runtime-test-helpers.cjs");

async function verify() {
  const server = await runtimeServer(path.resolve(process.argv[2] || "_site"));
  const browser = await chromium.launch({
    channel: process.env.WORKTIME_BROWSER_CHANNEL || "msedge",
    headless: true,
  });
  try {
    const context = await browser.newContext({
      locale: "zh-CN",
      permissions: ["clipboard-read"],
    });
    await context.route(/^https?:/, (route) =>
      route
        .request()
        .url()
        .startsWith(new URL(server.url).origin + "/")
        ? route.continue()
        : route.abort(),
    );
    await context.addInitScript(installRuntimeFixture);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.clock.setFixedTime(new Date("2026-11-27T04:00:00Z"));
    await page.goto(server.url);
    await page.waitForFunction(
      () =>
        document.documentElement.dataset.appState === "ready" &&
        WorkTimeApp.services.runtimeFolder.state.status === "available",
    );
    if (await page.locator("#onboardingDialog[open]").count())
      await page.locator("[data-onboarding-next]").click();

    await page.locator("#importOpen").click();
    await page
      .getByRole("textbox", {
        name: "请粘贴从 OA 系统复制的考勤记录",
      })
      .fill("11/1\n周日\n--\n11/2\n周一\n08:00\n17:30\n11/3\n周二\n08:00");
    await page.getByRole("button", { name: "确认导入", exact: true }).click();
    const card = (date) => page.locator(`.day[data-date="${date}"]`);
    const manualTimes = async (date, expected) => {
      const fields = card(date).locator(".day-time-value");
      assert.deepEqual(
        await fields.evaluateAll((elements) =>
          elements.map((element) => element.classList.contains("manual-time")),
        ),
        expected,
      );
      assert.equal(
        await card(date)
          .locator(".manual-time")
          .evaluateAll((elements) => {
            const reference = document.createElement("span");
            reference.style.color = "var(--amber)";
            document.body.append(reference);
            const yellow = getComputedStyle(reference).color;
            reference.remove();
            return elements.every(
              (element) => getComputedStyle(element).color === yellow,
            );
          }),
        true,
      );
    };
    assert.equal(
      await card("2026-11-01").locator(".record-source-dot").count(),
      0,
    );
    assert.equal(
      await card("2026-11-02").locator(".record-source-dot.oa").count(),
      0,
    );
    for (const date of ["2026-11-01", "2026-11-08"]) {
      await card(date).locator(".day-select").click();
      await page.locator("#dayStart").fill("08:00");
      await page.locator("#dayEnd").fill("17:30");
      await page.locator("#dayEnd").press("Tab");
      await card(date).locator(".record-source-dot.manual").waitFor();
      assert.equal(await card(date).locator(".record-source-dot").count(), 1);
      assert.equal(await card(date).locator(".source-toggle").count(), 0);
      await manualTimes(date, [true, true]);
    }
    await manualTimes("2026-11-02", [false, false]);
    await card("2026-11-09").locator(".day-select").click();
    await page.locator("#dayStart").fill("09:00");
    await page.locator("#dayStart").press("Tab");
    await manualTimes("2026-11-09", [true, false]);
    // A real OA punch plus manual completion still offers both sources.
    await card("2026-11-03").locator(".day-select").click();
    await page.locator("#dayEnd").fill("19:00");
    await page.locator("#dayEnd").press("Tab");
    const toggle = card("2026-11-03").locator(".source-toggle");
    await toggle.waitFor();
    assert.equal(await toggle.locator(".record-source-dot").count(), 2);
    await manualTimes("2026-11-03", [false, true]);
    await toggle.click();
    await page.waitForFunction(
      () =>
        document
          .querySelector('[data-source-date="2026-11-03"]')
          .getAttribute("aria-pressed") === "true",
    );
    await manualTimes("2026-11-03", [true, true]);
    assert.deepEqual(errors, []);
    console.log(
      "Source dots and yellow manual times verified for complete, incomplete and mixed-source records.",
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
