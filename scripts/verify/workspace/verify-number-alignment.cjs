"use strict";

// Guard CSS-only text alignment and removal of its runtime/layout observers.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const postcss = require("postcss");
const root = path.resolve(__dirname, "../../..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
assert(!fs.existsSync(path.join(root, "assets/js/ui-alignment.js")));
const prepare = read("scripts/site/prepare-assets.cjs");
assert(!prepare.includes('"ui-alignment"'));
function files(directory) {
  return fs
    .readdirSync(path.join(root, directory), { withFileTypes: true })
    .flatMap((entry) => {
      const file = directory + "/" + entry.name;
      return entry.isDirectory() ? files(file) : [file];
    });
}
for (const file of files("assets/js").filter(
  (file) =>
    file.endsWith(".js") &&
    !file.endsWith(".min.js") &&
    !file.includes("/file-chunks/"),
)) {
  assert(!read(file).includes("WorkTimeApp.ui.alignment"), file);
}
const rules = [];
for (const name of [
  "base",
  "calendar",
  "agenda",
  "summary",
  "editor",
  "onboarding",
  "vocabulary",
  "date-info",
]) {
  const css = postcss.parse(
    read(`assets/css/${name}.css`).replace(/\r\n/g, "\n"),
  );
  css.walkDecls((declaration) =>
    assert(
      !/--ui-ink-offset|--date-ink-height/.test(declaration.value),
      `${name}: ${declaration.toString()}`,
    ),
  );
  css.walkRules((rule) => rules.push(rule));
}
function value(selector, property) {
  return rules
    .filter((rule) => rule.selector === selector)
    .flatMap((rule) =>
      rule.nodes.filter(
        (node) => node.type === "decl" && node.prop === property,
      ),
    )
    .at(-1)?.value;
}
assert.equal(value(".onboarding-node", "place-items"), "center");
assert.equal(
  value("body #onboardingDialog .onboarding-node-text", "position"),
  undefined,
);
assert.equal(
  value("body .calendar .day-date .daynum", "align-items"),
  "center",
);
assert.equal(
  value("body .calendar .day-date .daynum", "justify-content"),
  "center",
);
assert.equal(
  value("body .calendar .day-date .daynum-text", "line-height"),
  "1.3",
);
assert.equal(
  value(".calendar-today-number,\n.calendar-today-weekday", "line-height"),
  "1.3",
);
const activities = "body #dateInfoPanel.almanac-panel .almanac-activities";
assert.equal(value(activities, "display"), "flex");
assert.equal(value(activities, "flex-wrap"), "wrap");
assert.equal(value(activities, "justify-content"), "center");
assert.equal(
  value(".almanac-activities .almanac-activity-wide", "flex-basis"),
  "100%",
);
assert.equal(
  value(".almanac-activities .almanac-activity-wide", "overflow-wrap"),
  "anywhere",
);
assert.equal(
  value(
    "body #dateInfoPanel.almanac-panel .almanac-sheet",
    "grid-template-rows",
  ),
  "4.6rem minmax(9.6rem, auto) minmax(2.6rem, 1fr)",
);
const almanac = read("assets/js/date-info-ui.js");
assert(!/measureText|fitAlmanac|almanacResize|almanacWidths/.test(almanac));
console.log(
  "CSS date/step alignment, responsive almanac wrapping and removal of all alignment runtime hooks verified.",
);
