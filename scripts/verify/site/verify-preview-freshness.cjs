"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { chromium } = require("playwright");

const base = "/HWorkTime/";
const root = path.resolve(__dirname, "../../..");
const entry = (version) => `<!doctype html><h1>${version}</h1>
  <script>navigator.serviceWorker.register("./service-worker.js", {
    updateViaCache: "none"
  });</script>`;
const legacyWorker = `
  self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
  });
  self.addEventListener("fetch", (event) => {
    if (event.request.mode === "navigate")
      event.respondWith(new Response(${JSON.stringify(entry("old"))}, {
        headers: { "Content-Type": "text/html" }
      }));
  });
`;

async function verify() {
  const { preview } = await import("vite");
  const fixture = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), "hworktime-preview-"),
  );
  const legacy = http.createServer((request, response) => {
    const worker = request.url === base + "service-worker.js";
    response.setHeader(
      "Content-Type",
      worker ? "text/javascript" : "text/html",
    );
    response.end(worker ? legacyWorker : entry("old"));
  });
  let browser, server;
  try {
    await new Promise((resolve) => legacy.listen(0, "127.0.0.1", resolve));
    const { port } = legacy.address();
    const url = `http://127.0.0.1:${port}${base}`;
    browser = await chromium.launch({ channel: "msedge", headless: true });
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await page.reload();
    assert.equal(await page.locator("h1").textContent(), "old");

    const html = path.join(fixture, "index.html");
    await fs.writeFile(html, entry("rebuilt"));
    await new Promise((resolve, reject) =>
      legacy.close((error) => (error ? reject(error) : resolve())),
    );
    server = await preview({
      root,
      base,
      build: { outDir: fixture },
      preview: { host: "127.0.0.1", port, strictPort: true },
    });
    await page.evaluate(async () => {
      window.previousController = navigator.serviceWorker.controller;
      await (await navigator.serviceWorker.ready).update();
    });
    await page.waitForFunction(
      () =>
        navigator.serviceWorker.controller &&
        navigator.serviceWorker.controller !== window.previousController,
    );
    await page.reload();
    assert.equal(await page.locator("h1").textContent(), "rebuilt");

    await fs.writeFile(html, entry("rebuilt again"));
    await page.reload();
    assert.equal(await page.locator("h1").textContent(), "rebuilt again");
    const missing = await page.request.get(url + "assets/missing.js");
    assert.equal(missing.status(), 404);
    assert.doesNotMatch(await missing.text(), /rebuilt again/);
    console.log(
      "Preview worker replaces the old controller, reloads current builds, and returns 404 for missing scripts.",
    );
  } finally {
    await browser?.close();
    await server?.close();
    if (legacy.listening) await new Promise((resolve) => legacy.close(resolve));
    const tempRoot = await fs.realpath(os.tmpdir());
    if (
      path.dirname(fixture) === tempRoot &&
      path.basename(fixture).startsWith("hworktime-preview-")
    )
      await fs.rm(fixture, { recursive: true, force: true });
  }
}
verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
