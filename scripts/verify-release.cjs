"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "../_site");
const prefix = "/HWorkTime/";
const types = {
  ".js": "application/javascript",
  ".css": "text/css",
  ".html": "text/html",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
  ".webmanifest": "application/manifest+json",
};

function serve(request, response) {
  const pathname = new URL(request.url, "http://localhost").pathname;
  const target = path.resolve(
    root,
    pathname.slice(prefix.length) || "index.html",
  );
  if (
    !pathname.startsWith(prefix) ||
    !target.startsWith(root + path.sep) ||
    !fs.existsSync(target) ||
    !fs.statSync(target).isFile()
  ) {
    response.writeHead(404).end();
    return;
  }
  response.setHeader(
    "Content-Type",
    types[path.extname(target)] || "application/octet-stream",
  );
  fs.createReadStream(target).pipe(response);
}

async function verifyAgendaEditor(page) {
  await page.locator("#pageSettingsOpen").click();
  await page.locator("#agendaMode").click();
  await page.locator("#agendaNew").click();
  const title = page.locator("#agendaTitle");
  await title.fill("Pages agenda check");
  await page.locator("#agendaNote").fill("Range and status");
  const status = page.locator("#agendaItemStatus");
  const row = page
    .locator("#agendaList [data-agenda-edit]")
    .filter({ hasText: "Pages agenda check" });
  await page.locator("#agendaScheduleOpen").click();
  const start = await page.locator("#agendaDateInput").inputValue();
  const end = new Date(Date.parse(start + "T12:00:00Z") + 2 * 86400000)
    .toISOString()
    .slice(0, 10);
  await page.locator("#agendaEndDateInput").fill(end);
  await page.locator("[data-schedule-close]").click();
  for (const [index, value] of [
    "pending",
    "completed",
    "in-progress",
    "cancelled",
  ].entries()) {
    if (index) await row.click();
    if (index === 1) {
      await page.locator("#agendaScheduleOpen").click();
      await page.locator("label:has(#agendaAllDay)").click();
      await page.locator("#agendaStart").fill("09:30");
      await page.locator("#agendaEnd").fill("17:45");
      await page.locator("[data-schedule-close]").click();
    }
    await status.click();
    const options = page.getByRole("option");
    assert.equal(await options.count(), 4);
    await options.nth(index).click();
    if (index === 1) await page.locator("#agendaNote").press("Control+Enter");
    else await page.locator("#agendaSave").click();
    await page.locator("#agendaForm").waitFor({ state: "hidden" });
    await page
      .locator('#agendaList [data-agenda-status][data-status="' + value + '"]')
      .waitFor();
  }
  await page.reload();
  await row.click();
  assert.equal(
    await page.locator("#agendaNote").inputValue(),
    "Range and status",
  );
  assert.equal(
    await page.locator(".agenda-status-input").getAttribute("data-status"),
    "cancelled",
  );
  await page.locator("#agendaScheduleOpen").click();
  assert.equal(await page.locator("#agendaDateInput").inputValue(), start);
  assert.equal(await page.locator("#agendaEndDateInput").inputValue(), end);
  assert.equal(await page.locator("#agendaStart").inputValue(), "09:30");
  assert.equal(await page.locator("#agendaEnd").inputValue(), "17:45");
  await page.locator("[data-schedule-close]").click();
  await title.fill("Unsaved draft");
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator("#agendaCancel").click();
  await row.click();
  assert.equal(await title.inputValue(), "Pages agenda check");
}

async function verify(url) {
  const browser = await chromium.launch({
    channel: process.env.WORKTIME_BROWSER_CHANNEL || "msedge",
  });
  try {
    const context = await browser.newContext({ locale: "zh-CN" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url);
    for (const expected of [5, 7]) {
      await page.waitForFunction(
        () => document.documentElement.dataset.appState === "ready",
      );
      assert.ok((await page.locator(".day[data-date]").count()) >= 28);
      await page.locator("#pageSettingsOpen").click();
      const select = page.locator("#weatherDays");
      await select.waitFor();
      assert.match(await select.innerText(), new RegExp(String(expected)));
      if (expected === 5) {
        await select.click();
        await page.getByRole("option", { name: /7/ }).click();
        await page.waitForFunction(
          () =>
            WorkTimeApp.services.preferences.page.state.weatherDays === 7 &&
            document
              .querySelector("#weatherDays")
              ?.getAttribute("aria-disabled") !== "true",
        );
        await page.reload();
      }
    }
    await verifyAgendaEditor(page);
    assert.deepEqual(errors, []);
    console.log(
      "Pages entry, calendar, settings, four agenda statuses, range, discard and reload passed.",
    );
  } finally {
    await browser.close();
  }
}
async function main() {
  process.env.WORKTIME_TEST_DISABLE_AUTO_BACKUP = "1";
  require("./lib/browser-test-setup.cjs");
  if (process.argv[2]) return verify(process.argv[2]);
  const server = http.createServer(serve);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    await verify("http://127.0.0.1:" + server.address().port + prefix);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
