"use strict";
// Source and published SVG verification; deliberately requires no browser.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const postcss = require("postcss");
const root = path.resolve(__dirname, "../../..");
const site = process.argv.includes("--site") ? path.join(root, "_site") : root;
const catalog = require("../../../assets/icons/tabler.json");
const { controlIconCatalog } = require("../../site/tabler-icons.cjs");
const read = (file) => fs.readFileSync(path.join(site, file), "utf8");
const normalize = (text) => text.trim().replace(/>\s+</g, "><");

function verifySprite(file, entries) {
  const html = read(file);
  const symbols = [
    ...html.matchAll(/<symbol id="icon-([^"]+)"([^>]*)>([\s\S]*?)<\/symbol>/g),
  ];
  assert.equal(
    symbols.length,
    Object.keys(entries).length,
    file + ": complete sprite",
  );
  assert.equal(
    new Set(symbols.map((m) => m[1])).size,
    symbols.length,
    "Unique symbol IDs",
  );
  for (const [, id, attrs, body] of symbols) {
    assert.match(attrs, /viewBox="0 0 24 24"/, id + ": Tabler coordinates");
    assert.ok(entries[id], id + ": mapped official icon");
    const group =
      /^<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">([\s\S]*)<\/g>$/.exec(
        body,
      );
    assert.ok(group, id + ": isolated 2 outline drawing");
    const svg = fs.readFileSync(
      require.resolve(`@tabler/icons/outline/${entries[id]}.svg`),
      "utf8",
    );
    const official = svg.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/)[1];
    assert.equal(
      normalize(group[1]),
      normalize(official),
      id + ": unchanged official geometry",
    );
  }
  assert.ok(
    fs.existsSync(path.join(site, "licenses/tabler-icons.txt")),
    "Shipped MIT license",
  );
}

verifySprite("index.html", catalog);
verifySprite("tools/convert-backup.html", controlIconCatalog);
assert.match(read("assets/icons/local-cafe.svg"), /stroke-width="2"/);
assert.doesNotMatch(read("assets/icons/local-cafe.svg"), /256/);

function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? files(file) : [file];
  });
}
// Validate literal references in templates, React adapters, CSS and compiled chunks.
const sources = [
  path.join(site, "index.html"),
  ...files(path.join(site, "assets/js")),
  ...files(path.join(site, "assets/css")),
];
if (site === root) sources.push(...files(path.join(root, "src")));
else sources.push(...files(path.join(site, "workspace")));
let references = 0;
for (const file of sources.filter((p) =>
  /\.(?:html|[cm]?js|tsx?|css)$/.test(p),
)) {
  const text = fs.readFileSync(file, "utf8");
  for (const [, id] of text.matchAll(
    /#icon-([a-z0-9]+(?:-[a-z0-9]+)*)(?=["'\s<>}])/g,
  )) {
    assert.ok(catalog[id], `${path.relative(site, file)}: missing icon ${id}`);
    references++;
  }
}
assert.ok(references > 0, "Site references the sprite");
const manifest = require("../../../package.json");
assert.equal(
  manifest.devDependencies["@tabler/icons"],
  require("@tabler/icons/package.json").version,
);
assert.ok(
  !manifest.devDependencies["@phosphor-icons/core"],
  "Removed direct legacy dependency",
);
for (const file of [
  "assets/icons/phosphor.json",
  "licenses/phosphor-icons.txt",
])
  assert.ok(
    !fs.existsSync(path.join(site, file)),
    "Removed legacy resource: " + file,
  );

const css = postcss.parse(read("assets/css/icons.css"));
const outline = css.nodes.find(
  (node) => node.selector === "body .ui-icon:has(> use)",
);
assert.ok(outline, "Scoped library-icon styles preserve custom SVGs");
const declarations = Object.fromEntries(
  outline.nodes.map((node) => [node.prop, node.value]),
);
assert.equal(declarations.fill, "none");
assert.equal(declarations.stroke, "currentColor");
assert.equal(declarations["stroke-width"], "2");
console.log(
  `Verified ${Object.keys(catalog).length} Tabler mappings and ${references} references in ${site === root ? "source assets" : "_site"}.`,
);
