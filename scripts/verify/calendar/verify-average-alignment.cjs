"use strict";

// Guard the calendar average's baseline without launching a browser.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const postcss = require("postcss");
const root = path.resolve(__dirname, "../../..");

const rules = [];
for (const file of ["calendar", "summary"])
  postcss
    .parse(fs.readFileSync(path.join(root, `assets/css/${file}.css`), "utf8"))
    .walkRules((rule) => rules.push(rule));
function declaration(selector, property) {
  return rules
    .filter((rule) => rule.selector === selector)
    .flatMap((rule) =>
      rule.nodes.filter(
        (node) => node.type === "decl" && node.prop === property,
      ),
    )
    .at(-1)?.value;
}
const lineHeight = declaration(".summary-number-digit", "line-height");
for (const selector of [
  "body .calendar .day-average-value",
  "body .calendar .day-footer .day-average",
  ".summary-number",
  ".summary-number-visual",
  ".summary-number-track",
])
  assert.equal(declaration(selector, "line-height"), lineHeight, selector);
assert.equal(
  declaration("body .calendar .day-average-value", "transform"),
  "none",
);
assert.equal(declaration("body .calendar .day-average-value", "top"), "2px");
assert.equal(
  declaration("body .calendar .day-average-value", "inset-inline-end"),
  "16px",
);
assert.equal(
  declaration("body .calendar .day-footer .day-average", "margin-inline-end"),
  "0",
);
assert.equal(
  declaration("body .calendar .day-footer .day-average", "overflow"),
  "visible",
);
assert.equal(declaration(".day-average:not(:empty)::before", "right"), "0");
assert.equal(
  declaration(".day-average:not(:empty)::before", "width"),
  "calc(100% + 16px)",
);
assert.equal(declaration("body .day-average", "font-size"), "16px");
assert.equal(
  declaration("body .calendar .day-footer .daystatus", "grid-row"),
  "2",
);
console.log(
  "CSS number line height and reserved tag row verified without a browser.",
);
