"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const source = fs.readFileSync(
  path.resolve(__dirname, "../../../src/vocabulary/calendar.ts"),
  "utf8",
);
const context = vm.createContext({ exports: {} });
vm.runInContext(
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
  context,
);
const { studyCalendar } = context.exports;

for (const [anchor, first, last, monthDays] of [
  ["2026-11-28", "2026-10-26", "2026-12-06", 30],
  ["2024-02-29", "2024-01-29", "2024-03-03", 29],
  ["2021-02-14", "2021-02-01", "2021-02-28", 28],
  ["2027-01-01", "2026-12-28", "2027-01-31", 31],
  ["2026-12-31", "2026-11-30", "2027-01-03", 31],
]) {
  const calendar = studyCalendar([{ day: anchor, fresh: 4, reviews: 7 }]);
  assert.equal(calendar[0].day, first);
  assert.equal(calendar.at(-1).day, last);
  assert.equal(calendar.length % 7, 0);
  assert.equal(calendar.filter((day) => !day.outsideMonth).length, monthDays);
  for (const [index, day] of calendar.entries()) {
    const date = new Date(day.day + "T12:00:00Z");
    assert.equal(date.getUTCDay(), (index + 1) % 7);
    assert.equal(day.outsideMonth, day.day.slice(0, 7) !== anchor.slice(0, 7));
    if (index) {
      const previous = new Date(calendar[index - 1].day + "T12:00:00Z");
      assert.equal(date - previous, 86400000);
    }
  }
  const activity = calendar.find((day) => day.day === anchor);
  assert.equal(activity.fresh, 4);
  assert.equal(activity.reviews, 7);
}

const boundary = studyCalendar([
  { day: "2026-10-31", fresh: 2, reviews: 5 },
  { day: "2026-11-01", fresh: 3, reviews: 1 },
]);
assert.equal(boundary.find((day) => day.day === "2026-10-31").reviews, 5);
assert.equal(
  boundary.find((day) => day.day === "2026-10-31").outsideMonth,
  true,
);
assert.equal(
  boundary.find((day) => day.day === "2026-11-01").outsideMonth,
  false,
);
assert(studyCalendar([]).length >= 28);
console.log(
  "Study calendar verified: Monday-first complete months, leap days, year boundaries, adjacent-month markers and activity counts.",
);
