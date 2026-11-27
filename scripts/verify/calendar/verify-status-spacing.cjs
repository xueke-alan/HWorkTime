"use strict";

// Resolve the card's padding cascade for common displays without a browser.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const postcss = require("postcss");
const root = path.resolve(__dirname, "../../..");
const css = postcss.parse(
  fs.readFileSync(path.join(root, "assets/css/calendar.css"), "utf8"),
);
const selectors = new Map([
  [".day", () => true],
  [".workspace .day", () => true],
  ['.calendar[data-weeks="6"] .day', (profile) => profile.weeks === 6],
  ['.calendar[data-weeks="5"] .day', (profile) => profile.weeks === 5],
  ["body .workspace .day", () => true],
  ["body .workspace .calendar > .day", () => true],
]);
function active(rule, profile) {
  for (let parent = rule.parent; parent; parent = parent.parent) {
    if (parent.type !== "atrule") continue;
    for (const [, bound, axis, size] of parent.params.matchAll(
      /\((min|max)-(width|height):\s*(\d+)px\)/g,
    )) {
      const actual =
        parent.name === "container" ? profile.calendarWidth : profile[axis];
      if (bound === "min" ? actual < Number(size) : actual > Number(size))
        return false;
    }
  }
  return true;
}
function padding(profile) {
  const winners = new Map();
  let order = 0;
  css.walkRules((rule) => {
    if (!active(rule, profile)) return;
    for (const selector of rule.selector
      .split(",")
      .map((part) => part.trim())) {
      if (!selectors.get(selector)?.(profile)) continue;
      const specificity =
        10 *
          ((selector.match(/\.[\w-]+/g) || []).length +
            (selector.match(/\[[^\]]*\]/g) || []).length) +
        (selector.startsWith("body ") ? 1 : 0);
      function write(property, value) {
        const next = { specificity, order: order++, value };
        const old = winners.get(property);
        if (
          !old ||
          next.specificity > old.specificity ||
          (next.specificity === old.specificity && next.order > old.order)
        )
          winners.set(property, next);
      }
      rule.walkDecls((decl) => {
        const parts = decl.value.split(/\s+/);
        if (decl.prop === "padding") {
          write("top", parts[0]);
          write("right", parts[1] || parts[0]);
          write("bottom", parts[2] || parts[0]);
          write("left", parts[3] || parts[1] || parts[0]);
        } else if (decl.prop === "padding-inline") {
          write("left", parts[0]);
          write("right", parts[1] || parts[0]);
        } else if (decl.prop === "padding-block") {
          write("top", parts[0]);
          write("bottom", parts[1] || parts[0]);
        } else if (decl.prop === "padding-bottom") {
          write("bottom", decl.value);
        } else if (decl.prop.startsWith("--")) {
          write(decl.prop, decl.value);
        }
      });
    }
  });
  const rem = Math.min(16.8, Math.max(14, profile.width * 0.004375 + 5.6));
  function resolve(value) {
    const variable = value.match(/^var\((--[^)]+)\)$/);
    if (variable) return resolve(winners.get(variable[1]).value);
    return parseFloat(value) * (value.endsWith("rem") ? rem : 1);
  }
  return (property) => resolve(winners.get(property).value);
}
function declaration(selector, property) {
  let result;
  css.walkRules((rule) => {
    if (rule.selector === selector)
      rule.walkDecls(property, (decl) => (result = decl.value));
  });
  return result;
}
const status = "body .calendar .day-footer .daystatus";
const horizontalInset = Number(
  declaration(status, "margin-inline").match(/^calc\((\d+)px/)[1],
);
const bottomInset = Number(
  declaration(status, "margin-bottom").match(/^calc\((\d+)px/)[1],
);
assert.equal(horizontalInset, 4);
assert.equal(bottomInset, 4);
for (const [width, height, calendarWidth] of [
  [1920, 1080, 1200],
  [2560, 1440, 1800],
  [1920, 768, 1200],
  [390, 844, 390],
])
  for (const weeks of [5, 6]) {
    const value = padding({ width, height, calendarWidth, weeks });
    for (const side of ["left", "right"])
      assert.equal(
        value(side) + horizontalInset - value("--day-inline-padding"),
        4,
        `${width}x${height}, ${weeks} weeks, ${side}`,
      );
    assert.equal(
      value("bottom") + bottomInset - value("--day-bottom-padding"),
      4,
      `${width}x${height}, ${weeks} weeks, bottom`,
    );
  }
const pill = "body .calendar .day-footer .daystatus .pill";
assert.equal(declaration(pill, "height"), "20px");
assert.equal(declaration(pill, "min-height"), "20px");
assert.equal(declaration(pill, "box-sizing"), "border-box");
assert.equal(declaration(pill, "font-size"), "11px");
assert.equal(declaration(pill, "padding"), "0 4px");
assert.equal(declaration(".day-status-tags > div", "display"), "flex");
assert.equal(
  declaration("body .calendar .worktime-corner", "align-self"),
  "center",
);
assert.equal(
  fs.existsSync(path.join(root, "assets/js/ui-alignment.js")),
  false,
  "Tag alignment uses CSS",
);
console.log(
  "1K/2K, short and narrow screens: fixed 4px tag insets, 20px badges and centered icons verified.",
);
