"use strict";
const assert = require("node:assert/strict");
const http = require("node:http");
const { chromium } = require("playwright");
const { startupServer } = require("../../lib/startup-test-server.cjs");
require("../../lib/browser-test-setup.cjs");

async function verify(candidate, previous) {
  if (!previous)
    throw Error(
      "Supply the candidate and extracted previous release directories",
    );
  const current = await startupServer(candidate);
  const stable = await startupServer(previous);
  let deployed = current;
  let interrupted = false,
    refused = 0;
  const proxy = http.createServer((req, res) => {
    if (
      interrupted &&
      req.url.startsWith("/workspace/") &&
      req.url.includes(".js")
    ) {
      refused++;
      res.writeHead(503).end();
      return;
    }
    const upstream = http.get(new URL(req.url, deployed.url), (reply) => {
      res.writeHead(reply.statusCode, {
        ...reply.headers,
        "cache-control": "no-cache",
      });
      reply.pipe(res);
    });
    upstream.on("error", () => res.writeHead(502).end());
  });
  await new Promise((resolve) => proxy.listen(0, "127.0.0.1", resolve));
  const url = "http://127.0.0.1:" + proxy.address().port + "/";
  const browser = await chromium.launch({ channel: "msedge" });
  try {
    const context = await browser.newContext({
      locale: "zh-CN",
      reducedMotion: "reduce",
      viewport: { width: 1440, height: 900 },
    });
    async function waitForActivation(directory) {
      const shell = { self: {} };
      const file = require("node:path").resolve(directory, "offline-shell.js");
      require("node:vm").runInNewContext(
        require("node:fs").readFileSync(file, "utf8"),
        shell,
      );
      const expected = shell.self.WORKTIME_SHELL.cache;
      const deadline = Date.now() + 30000;
      while (Date.now() < deadline) {
        for (const worker of context.serviceWorkers()) {
          const active = await worker
            .evaluate(
              (name) =>
                self.WORKTIME_SHELL?.cache === name &&
                self.registration.active?.state === "activated" &&
                !self.registration.waiting &&
                !self.registration.installing,
              expected,
            )
            .catch(() => false);
          if (active) return;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      throw Error("Worker activation timed out for " + expected);
    }
    const open = async () => {
      const page = await context.newPage();
      await page.goto(new URL("#dev", url).href);
      await page.waitForFunction(
        () => document.documentElement.dataset.appState === "ready",
      );
      return page;
    };
    function compareWorkRecords() {
      const { records, statistics, state: archive } = WorkTimeApp.domain;
      const state = archive.defaultState();
      const settings = {
        ...state.settings,
        configured: true,
        breaks: [{ start: 720, end: 780 }],
      };
      state.settings = settings;
      const sample = (start, end, nextDay = false) => ({
        actual: { start, end, nextDay, effectiveMinutes: null },
      });
      state.days = {
        "2026-10-19": sample("22:00", "05:00", true),
        "2026-10-20": { ...sample("08:15", "15:20"), leaveMinutes: 120 },
        "2026-10-21": sample("08:00", "19:30"),
        "2026-10-24": { plannedOvertime: true },
        "2026-10-25": sample("09:00", "16:00"),
      };
      return {
        days: Object.entries(state.days).map(([date, day]) =>
          records.calculate(date, day, settings, true),
        ),
        totals: statistics.selectOvertimeRequirement(
          state,
          "2026-10-19",
          "2026-10-25",
        ),
      };
    }
    const page = await open();
    const candidateStats = await page.evaluate(compareWorkRecords);
    assert.ok(candidateStats.days.some((day) => day.minutes > 0));
    const date = await page.locator(".day.selected").getAttribute("data-date");
    await page.locator("#dayStart").fill("08:12");
    await page.locator("#dayEnd").fill("18:34");
    await page.locator("#dayEnd").press("Tab");
    await page.locator('.workspace-views [data-view="agenda"]').click();
    await page.locator("#agendaNew").click();
    await page.locator("#agendaTitle").fill("rollback-candidate");
    await page.locator("#agendaSave").click();
    await page.locator("#agendaForm").waitFor({ state: "hidden" });
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    const original = await page.evaluate(() => caches.keys());
    deployed = stable;
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
    });
    await page.waitForFunction(
      async () => !!(await navigator.serviceWorker.ready).waiting,
    );
    await page.close();
    await waitForActivation(previous);
    const restored = await open();
    await restored.waitForFunction(
      async (old) =>
        (await caches.keys()).some(
          (name) => name.startsWith("worktime-shell-") && !old.includes(name),
        ),
      original,
    );
    await restored.reload();
    await restored.waitForFunction(
      () => document.documentElement.dataset.appState === "ready",
    );
    const manifest = require(
      require("node:path").resolve(previous, "workspace/.vite/manifest.json"),
    );
    assert.equal(
      await restored
        .locator('meta[name="workspace-module"]')
        .getAttribute("content"),
      "workspace/" + manifest["src/workspace-entry.ts"].file,
    );
    const item = restored
      .locator("#agendaList [data-agenda-edit]")
      .filter({ hasText: "rollback-candidate" })
      .first();
    assert.deepEqual(
      await restored.evaluate(compareWorkRecords),
      candidateStats,
    );
    await item.click();
    await restored.locator("#agendaTitle").fill("rollback-stable");
    await restored.locator("#agendaSave").click();
    await restored.locator("#agendaForm").waitFor({ state: "hidden" });
    const calendar = restored.locator(
      '.workspace-views [data-view="calendar"]',
    );
    if (await calendar.isVisible()) await calendar.click();
    else await restored.locator("#agendaMode").click();
    await restored.locator('.day[data-date="' + date + '"]').click();
    assert.equal(await restored.locator("#dayStart").inputValue(), "08:12");
    assert.equal(await restored.locator("#dayEnd").inputValue(), "18:34");
    await restored.locator("#dayEnd").fill("19:07");
    await restored.locator("#dayEnd").press("Tab");
    await restored.waitForFunction(
      (date) =>
        new Promise((resolve, reject) => {
          const open = indexedDB.open("worktime-archive");
          open.onerror = () => reject(open.error);
          open.onsuccess = () => {
            const db = open.result;
            const read = db
              .transaction("records")
              .objectStore("records")
              .getAll();
            read.onsuccess = () => {
              db.close();
              resolve(
                read.result.some(
                  (row) => row.id === date && row.data.end === "19:07",
                ),
              );
            };
            read.onerror = () => {
              db.close();
              reject(read.error);
            };
          };
        }),
      date,
    );
    await restored.reload();
    await restored.waitForFunction(
      () => document.documentElement.dataset.appState === "ready",
    );
    await restored.locator('.day[data-date="' + date + '"]').click();
    assert.equal(await restored.locator("#dayEnd").inputValue(), "19:07");
    const agenda = restored.locator('.workspace-views [data-view="agenda"]');
    if (await agenda.isVisible()) await agenda.click();
    else await restored.locator("#agendaMode").click();
    await restored
      .locator("#agendaList [data-agenda-edit]")
      .filter({ hasText: "rollback-stable" })
      .first()
      .waitFor();
    console.log(
      "Previous release activated on the same origin and retained editable work and agenda records after reload.",
    );
    deployed = current;
    interrupted = true;
    const update = () =>
      restored.evaluate(async () => {
        const registration = await navigator.serviceWorker.ready;
        const changed = new Promise((resolve) =>
          registration.addEventListener(
            "updatefound",
            () => {
              const worker = registration.installing;
              worker.addEventListener("statechange", () => {
                if (["installed", "redundant"].includes(worker.state))
                  resolve(worker.state);
              });
            },
            { once: true },
          ),
        );
        await registration.update();
        return Promise.race([
          changed,
          new Promise((_, reject) =>
            setTimeout(
              () => reject(Error("Worker install did not settle")),
              30000,
            ),
          ),
        ]);
      });
    assert.equal(await update(), "redundant");
    assert.ok(refused > 0);
    await restored.evaluate(async () => {
      const module = await import(
        new URL(
          document.querySelector('meta[name="agenda-editor-module"]').content,
          document.baseURI,
        ).href
      );
      if (typeof module.mount !== "function")
        throw Error("Old editor dependency unavailable");
    });
    interrupted = false;
    assert.equal(await update(), "installed");
    await restored.close();
    await waitForActivation(candidate);
    const upgraded = await open();
    await upgraded.waitForFunction(
      async (name) => (await caches.keys()).includes(name),
      original.find((name) => name.startsWith("worktime-shell-")),
    );
    await context.setOffline(true);
    await upgraded.reload();
    await upgraded.waitForFunction(
      () => document.documentElement.dataset.appState === "ready",
    );
    await upgraded
      .locator("#agendaList [data-agenda-edit]")
      .filter({ hasText: "rollback-stable" })
      .first()
      .waitFor();
    console.log(
      "Interrupted candidate install retained the old editor. Retried upgrade replaced the old worker and reopened the saved agenda offline.",
    );
  } finally {
    await browser.close();
    await new Promise((resolve) => proxy.close(resolve));
    await Promise.all([current.close(), stable.close()]);
  }
}
verify(...process.argv.slice(2)).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
