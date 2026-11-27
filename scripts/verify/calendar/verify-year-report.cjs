"use strict";
// Verify annual aggregation and the three-card view without a browser.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.resolve(__dirname, "../../..");
const app = {
  data: {},
  domain: {},
  ui: {},
  i18n: { t: (key) => key, message: (value) => value },
};
const realm = vm.createContext({ WorkTimeApp: app });
for (const file of [
  "assets/data/calendars.js",
  "assets/data/major-festivals.js",
  "assets/data/struggle-days.js",
  ...["time", "state", "calendar", "records", "schedule", "statistics"].map(
    (name) => "assets/js/domain/" + name + ".js",
  ),
  "assets/js/year-view.js",
])
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), realm);

const state = app.domain.state.defaultState();
Object.assign(state.settings, {
  workStart: "09:00",
  workEnd: "17:00",
  breaks: [],
});
const record = (end, start = "09:00") => ({ start, end, nextDay: false });
state.days = {
  "2025-12-31": { kind: "work", actual: record("23:00") },
  "2026-01-02": { kind: "work", actual: record("19:00") },
  "2026-01-03": { kind: "rest", actual: record("13:00") },
  "2026-02-02": { kind: "work", actual: record("16:00") },
  "2026-02-03": {
    kind: "work",
    leaveMinutes: 240,
    actual: record("17:00", "13:00"),
  },
  "2026-02-04": { kind: "work", draft: record("") },
  "2026-02-05": { kind: "rest", plannedOvertime: true },
};
const report = (data = state, year = 2026) =>
  app.ui.year.annualReport(app.ui.year.months(data, year, "2026-01-01"));
const before = JSON.stringify(state);
const result = report();
assert.equal(JSON.stringify(state), before, "Reporting must not alter records");
assert.equal(result.total, 25);
assert.equal(
  result.completeDays,
  4,
  "Incomplete and planned records are excluded",
);
assert.equal(
  result.attendance,
  2.5,
  "Partial leave uses equivalent attendance",
);
assert.equal(
  result.average,
  0.4,
  "Annual average is weighted by attendance, not months",
);
assert.equal(result.workOvertime, 1);
assert.equal(result.restOvertime, 4);
assert.equal(result.totalOvertime, 5);
assert.equal(result.dailyHours, 6.25, "Daily hours include recorded rest days");
assert.equal(result.restOvertimeDays, 1);
assert.equal(
  result.holidayOvertimeDays,
  1,
  "A Saturday within the published New Year break counts as holiday overtime",
);
assert.equal(result.weekendOvertimeDays, 0);
assert.equal(result.leaveDays, 0.5);
assert.equal(result.leaveHours, 4);

const deficit = report({
  ...state,
  days: { "2026-01-02": { kind: "work", actual: record("15:00") } },
});
assert.equal(deficit.totalOvertime, -2);
assert.equal(deficit.average, -2);
assert.equal(deficit.restOvertimeDays, 0);
const empty = report(state, 2027);
assert.equal(empty.total, 0);
assert.equal(empty.restOvertimeDays, 0);
assert.equal(empty.leaveDays, 0);
assert.equal(empty.leaveHours, 0);
for (const key of ["average", "dailyHours"]) assert.equal(empty[key], null);
const restOnly = report({
  ...state,
  days: { "2026-01-03": state.days["2026-01-03"] },
});
assert.equal(restOnly.average, null);
assert.equal(restOnly.dailyHours, 4);
assert.equal(restOnly.totalOvertime, 4);

const leave = report({
  ...state,
  scheduleRanges: [
    {
      start: "2026-02-01",
      end: null,
      schedule: {
        workStart: "09:00",
        workEnd: "15:00",
        breaks: [],
        standardMinutes: 360,
      },
    },
  ],
  days: {
    "2026-01-05": { kind: "work", leaveMinutes: 480 },
    "2026-02-02": { kind: "work", leaveMinutes: 180 },
    "2026-02-07": { kind: "rest", leaveMinutes: 360 },
  },
});
assert.equal(leave.completeDays, 0);
assert.equal(
  leave.leaveDays,
  1.5,
  "Leave without punches is prorated by each day's schedule",
);
assert.equal(
  leave.leaveHours,
  11,
  "Full-day leave is included and rest-day leave is ignored",
);

const restBreakdown = report({
  ...state,
  days: {
    "2026-10-01": { actual: record("13:00") },
    "2026-10-03": { actual: record("13:00") },
    "2026-10-10": { actual: record("19:00") },
    "2026-11-01": { actual: record("13:00") },
    "2026-11-02": { kind: "rest", actual: record("13:00") },
    "2026-11-07": { plannedOvertime: true },
    "2026-11-08": { draft: record("") },
  },
});
assert.equal(
  restBreakdown.restOvertimeDays,
  4,
  "Only complete rest-day overtime records count",
);
assert.equal(
  restBreakdown.weekendOvertimeDays,
  1,
  "Makeup Saturdays and holiday weekends do not count twice",
);
assert.equal(restBreakdown.holidayOvertimeDays, 2);
const unknownHoliday = report(
  { ...state, days: { "2028-01-01": { actual: record("13:00") } } },
  2028,
);
assert.equal(
  unknownHoliday.holidayOvertimeDays,
  0,
  "An unpublished holiday schedule is not inferred from festivals",
);
assert.equal(unknownHoliday.weekendOvertimeDays, 1);

const exportsObject = {};
const jsx = (type, props) => ({ type, props });
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync(path.join(root, "src/workspace/YearReport.tsx"), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  ).outputText,
  {
    exports: exportsObject,
    WorkTimeApp: app,
    require(name) {
      if (name === "react/jsx-runtime")
        return { jsx, jsxs: jsx, Fragment: "fragment" };
      if (name === "antd/es/card") return { default: "card" };
      if (name === "../ApplicationTheme") return { useLanguage() {} };
      throw Error("Unexpected dependency: " + name);
    },
  },
);
const metrics = [],
  cards = [],
  paragraphs = [];
function walk(node) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) return node.forEach(walk);
  if (node.type === "card") cards.push(node);
  if (node.type === "p") paragraphs.push(node);
  if (node.props?.["data-year-metric"])
    metrics.push(node.props["data-year-metric"]);
  walk(node.props?.children);
}
walk(exportsObject.default());
assert.equal(cards.length, 3, "Annual report contains exactly three cards");
assert.equal(metrics.length, 11);
assert.equal(
  paragraphs.length,
  0,
  "The bottom explanatory paragraph is removed",
);
assert.deepEqual(
  metrics,
  [
    "average",
    "totalOvertime",
    "workOvertime",
    "dailyHours",
    "total",
    "attendance",
    "leaveDays",
    "leaveHours",
    "restOvertimeDays",
    "weekendOvertimeDays",
    "holidayOvertimeDays",
  ],
  "The three cards display the requested metrics in order",
);
assert.equal(new Set(metrics).size, metrics.length);
for (const key of metrics)
  assert.ok(
    key in result,
    "Every displayed metric has a computed value: " + key,
  );
console.log(
  "Annual report: weighted averages, leave, rest days, shortfalls, empty years and three-card view verified.",
);
