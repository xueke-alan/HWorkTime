"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { bundleSite } = require("./bundle-site.cjs");
const { versionSite } = require("./version-site.cjs");
const root = path.resolve(__dirname, "..");
const site = path.join(root, "_site");
// Only this fixed generated directory may be replaced.
fs.rmSync(site, { recursive: true, force: true });
fs.mkdirSync(site);
for (const entry of [
  "index.html",
  "manifest.webmanifest",
  "service-worker.js",
  "offline-shell.js",
  "assets",
  "licenses",
  "tools",
  "data",
]) {
  const source = path.join(root, entry);
  if (entry === "data" && !fs.existsSync(source)) continue;
  fs.cpSync(source, path.join(site, entry), { recursive: true });
}
bundleSite(site);
fs.cpSync(path.join(root, "dist/workspace"), path.join(site, "workspace"), {
  recursive: true,
});
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(root, "dist/workspace/.vite/manifest.json"),
    "utf8",
  ),
);
const agendaModule = manifest["src/agenda/mount.ts"].file;
const stylesheet = manifest["style.css"].file;
const entry = path.join(site, "index.html");
fs.writeFileSync(
  entry,
  fs
    .readFileSync(entry, "utf8")
    .replace(
      "</head>",
      `<link rel="stylesheet" href="workspace/${stylesheet}"><meta name="workspace-module" content="workspace/${manifest["src/workspace-entry.ts"].file}"><meta name="agenda-editor-module" content="workspace/${agendaModule}"></head>`,
    ),
);
const converter = path.join(site, "tools/convert-backup.html");
fs.writeFileSync(
  converter,
  fs
    .readFileSync(converter, "utf8")
    .replace(
      "</head>",
      `<link rel="stylesheet" href="../workspace/${stylesheet}"></head>`,
    )
    .replace(
      "</body>",
      `<script type="module" src="../workspace/${manifest["src/converter/mount.ts"].file}"></script></body>`,
    ),
);
versionSite(site);
fs.writeFileSync(
  path.join(site, "offline-shell.js"),
  require("./lib/offline-shell.cjs").offlineShell(site, {
    published: true,
    version: require("../package.json").version,
  }),
);
fs.writeFileSync(path.join(site, ".nojekyll"), "");
console.log("Prepared _site for GitHub Pages.");
