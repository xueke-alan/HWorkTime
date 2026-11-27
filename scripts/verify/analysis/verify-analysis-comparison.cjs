"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../../..");
const realm = vm.createContext({ WorkTimeApp: { data: {}, domain: {} } });
for (const file of [
  "assets/data/calendars.js",
  "assets/data/major-festivals.js",
  "assets/data/struggle-days.js",
  ...["time", "state", "calendar", "records", "schedule", "statistics"].map(
    (name) => "assets/js/domain/" + name + ".js",
  ),
])
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), realm);

const domain = realm.WorkTimeApp.domain;
const state = domain.state.defaultState();
function put(date, end, kind = "work", nextDay = false) {
  state.days[date] = {
    kind,
    oa: {
      date,
      start: "08:00",
      end,
      nextDay,
      status: "complete",
      source: "test",
      raw: "",
    },
  };
}
put("2026-10-01", "17:30");
put("2026-10-02", "19:30");
put("2026-10-03", "21:00");
put("2026-10-04", "21:30");
put("2026-10-28", "23:00");
put("2026-11-01", "17:30");
put("2026-11-02", "21:00");
put("2026-11-03", "00:00", "work", true);
put("2026-11-04", "23:00", "rest");
state.days["2026-11-28"] = {
  kind: "work",
  actual: { start: "08:00", end: "23:00", nextDay: false },
};
const compare = (input, manual = false) =>
  domain.statistics.monthlyAnalysisComparison(
    input,
    "2026-11",
    "2026-11-27",
    manual,
  );
const before = JSON.stringify(state);
const result = compare(state, true);
assert.equal(result.currentCount, 3);
assert.equal(result.previousCount, 4);
assert.equal(result.previousEnd, "2026-10-27");
assert.equal(result.averageEndChange, 57.5);
assert.equal(result.dailyOvertimeChange, 60);
assert.ok(Math.abs(result.overtimeRatioChange + 100 / 12) < 1e-9);
assert.ok(Math.abs(result.lateRatioChange - 100 / 12) < 1e-9);
assert.equal(result.overtimeMinutesChange, 60);
assert.equal(JSON.stringify(state), before);

const fields = [
  "averageEndChange",
  "dailyOvertimeChange",
  "overtimeRatioChange",
  "lateRatioChange",
  "overtimeMinutesChange",
];
for (const input of [
  domain.state.defaultState(),
  {
    ...state,
    days: Object.fromEntries(
      Object.entries(state.days).filter(([date]) => date.startsWith("2026-11")),
    ),
  },
]) {
  const unavailable = compare(input);
  for (const field of fields) assert.equal(unavailable[field], null, field);
}

const zero = domain.state.defaultState();
for (const date of ["2026-10-01", "2026-11-01"])
  zero.days[date] = {
    kind: "work",
    actual: { start: "08:00", end: "17:30", nextDay: false },
  };
for (const field of fields) assert.equal(compare(zero, true)[field], 0, field);
const manual = domain.state.cloneState(zero);
manual.days["2026-11-01"].actual.end = "22:00";
assert.equal(compare(manual).dailyOvertimeChange, null);
assert.equal(compare(manual, true).dailyOvertimeChange, 240);
assert.equal(compare(manual, true).lateRatioChange, 100);
console.log(
  "Five monthly comparisons verified: unequal record counts, 21:00 cutoff, next-day departures, matching date progress, rest days, future plans, missing months and zero overtime.",
);
