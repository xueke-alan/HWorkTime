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
    assert.deepEqual(errors, []);
    console.log(
      "Pages entry, calendar, Vue weather setting and saved value after reload passed.",
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
