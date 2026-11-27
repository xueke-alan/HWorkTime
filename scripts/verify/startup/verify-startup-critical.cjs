"use strict";
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");
const { startupServer } = require("../../lib/startup-test-server.cjs");
const root = path.resolve(__dirname, "../../.."),
  site = path.resolve(process.argv[2] || path.join(root, "_site"));
const stages = ["core", "date", "view", "startup"];
const stageOf = (url) =>
  url.match(/\/(core|date|view|startup)-runtime\.min\.js/)?.[1];

async function audit(context) {
  await context.addInitScript(() => {
    const show = HTMLDialogElement.prototype.showModal;
    HTMLDialogElement.prototype.showModal = function (...args) {
      const value = show.apply(this, args);
      if (this.id === "onboardingDialog") this.close();
      return value;
    };
    window.criticalStartup = { executions: [] };
    document.addEventListener(
      "load",
      (event) => {
        if (event.target.tagName !== "SCRIPT") return;
        const stage = event.target.src.match(
          /\/(core|date|view|startup)-runtime\.min\.js/,
        )?.[1];
        if (!stage) return;
        window.criticalStartup.executions.push(stage);
        window.dispatchEvent(new Event("resize"));
      },
      true,
    );
  });
}
async function ready(page) {
  await page.waitForFunction(
    () =>
      document.documentElement.dataset.appState === "ready" &&
      !document.documentElement.classList.contains("app-loading"),
  );
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(resolve)),
  );
}
async function assertFirstFrame(page) {
  const state = await page.evaluate(() => ({
    ...window.criticalStartup,
    days: document.querySelectorAll(".day[data-date]").length,
    measurementRuntime: Boolean(WorkTimeApp.ui.alignment),
    overflow: document.body.scrollWidth - innerWidth,
  }));
  assert.deepEqual(state.executions, stages);
  assert.equal(state.measurementRuntime, false, "Text alignment uses CSS");
  assert.ok(state.days >= 28, "Reveal the complete calendar");
  assert.ok(state.overflow <= 1, "the complete first frame fits the viewport");
}
async function parallelAndRetry(browser, server) {
  const context = await browser.newContext({
    locale: "zh-CN",
    reducedMotion: "reduce",
    serviceWorkers: "block",
  });
  try {
    await audit(context);
    const arrivals = new Set(),
      requests = [];
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    await context.route(
      /\/(core|date|view|startup)-runtime\.min\.js/,
      async (route) => {
        arrivals.add(stageOf(route.request().url()));
        requests.push(route.request().url());
        await gate;
        await route.continue();
      },
    );
    const page = await context.newPage(),
      errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(server.url, { waitUntil: "domcontentloaded" });
    const deadline = Date.now() + 5000;
    while (arrivals.size < 4 && Date.now() < deadline)
      await new Promise((resolve) => setTimeout(resolve, 20));
    release();
    assert.deepEqual(
      [...arrivals].sort(),
      [...stages].sort(),
      "all four downloads start before any stage is released",
    );
    await ready(page);
    await assertFirstFrame(page);
    for (const stage of stages)
      assert.equal(
        requests.filter((url) => stageOf(url) === stage).length,
        1,
        stage + " preload is consumed without a second request",
      );
    const hints = await page.evaluate(() => {
      const children = [...document.head.children],
        theme = document.querySelector('script[src*="site-theme.js"]'),
        style = document.querySelector('link[rel="stylesheet"]');
      return [
        ...document.querySelectorAll('link[rel="preload"][as="script"]'),
      ].map((link) => ({
        priority: link.getAttribute("fetchpriority"),
        hash: new URL(link.href).searchParams.get("v"),
        expected:
          WorkTimeApp.data.assetVersions[new URL(link.href).pathname.slice(1)],
        afterCritical:
          children.indexOf(link) > children.indexOf(theme) &&
          children.indexOf(link) > children.indexOf(style),
      }));
    });
    assert.equal(hints.length, 4);
    assert.ok(
      hints.every(
        (hint) =>
          hint.priority === "low" &&
          hint.afterCritical &&
          hint.hash === hint.expected &&
          /^[a-f0-9]{16}$/.test(hint.hash),
      ),
    );
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }

  const retryContext = await browser.newContext({
    locale: "zh-CN",
    reducedMotion: "reduce",
    serviceWorkers: "block",
  });
  try {
    await audit(retryContext);
    let fail = true;
    await retryContext.route(/\/date-runtime\.min\.js/, (route) =>
      fail ? route.abort() : route.continue(),
    );
    const page = await retryContext.newPage();
    await page.goto(server.url, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () => document.documentElement.dataset.appState === "failed",
    );
    assert.equal(await page.locator("#startupFailure").isVisible(), true);
    assert.equal(await page.locator("#dayForm input:enabled").count(), 0);
    fail = false;
    await page.locator("#startupFailure button").click();
    await ready(page);
    await assertFirstFrame(page);
  } finally {
    await retryContext.close();
  }
}
async function closingBeforeExecution(browser, server) {
  const context = await browser.newContext({
    reducedMotion: "reduce",
    serviceWorkers: "block",
  });
  try {
    let release, arrived;
    const gate = new Promise((resolve) => {
        release = resolve;
      }),
      started = new Promise((resolve) => {
        arrived = resolve;
      });
    await context.route(/\/core-runtime\.min\.js/, async (route) => {
      arrived();
      await gate;
      await route.continue();
    });
    const page = await context.newPage();
    await page.goto(server.url, { waitUntil: "domcontentloaded" });
    await started;
    await page.evaluate(() =>
      window.dispatchEvent(new PageTransitionEvent("pagehide")),
    );
    release();
    await page.waitForTimeout(200);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.dataset.appState || "",
      ),
      "",
    );
    assert.equal(
      await page.locator('script[src*="startup-runtime.min.js"]').count(),
      0,
      "downloaded preloads never execute after departure",
    );
  } finally {
    await context.close();
  }
}
async function onboardingLayout(browser, url, locale, width) {
  const context = await browser.newContext({
    locale,
    viewport: { width, height: 1000 },
    reducedMotion: "reduce",
    serviceWorkers: "block",
  });
  try {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await ready(page);
    await page.locator("#onboardingDialog[open]").waitFor();
    for (const node of await page.locator(".onboarding-node").all()) {
      const centered = await node.evaluate((circle) => {
        const box = circle.getBoundingClientRect();
        const text = circle
          .querySelector(".onboarding-node-text")
          .getBoundingClientRect();
        return (
          Math.abs(text.left + text.width / 2 - box.left - box.width / 2) < 1 &&
          Math.abs(text.top + text.height / 2 - box.top - box.height / 2) < 1
        );
      });
      assert(
        centered,
        `${locale}/${width}: onboarding text is centered by CSS`,
      );
    }
  } finally {
    await context.close();
  }
}
async function main() {
  const server = await startupServer(site),
    browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    await parallelAndRetry(browser, server);
    await closingBeforeExecution(browser, server);
    for (const locale of ["zh-CN", "en", "zh-TW", "zh-HK", "ja", "ko"])
      for (const width of [1440, 390]) {
        for (const url of [
          server.url,
          pathToFileURL(path.join(root, "index.html")).href,
        ]) {
          const context = await browser.newContext({
            locale,
            viewport: { width, height: 1000 },
            reducedMotion: width === 390 ? "reduce" : "no-preference",
            serviceWorkers: "block",
          });
          try {
            await audit(context);
            const page = await context.newPage(),
              errors = [];
            page.on("pageerror", (error) => errors.push(error.message));
            await page.goto(url, { waitUntil: "domcontentloaded" });
            await ready(page);
            await assertFirstFrame(page);
            assert.equal(
              await page.evaluate(() => WorkTimeApp.i18n.language),
              locale,
            );
            assert.deepEqual(errors, []);
          } finally {
            await context.close();
          }
        }
        await onboardingLayout(browser, server.url, locale, width);
      }
    console.log(
      "Critical startup: parallel hashed downloads, ordered single execution, one aligned complete frame, retry, departure, six locales and desktop/mobile HTTP/file entries verified.",
    );
  } finally {
    await browser.close();
    await server.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
