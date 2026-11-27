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
for (const [index, end] of [
  "17:29",
  "17:30",
  "20:29",
  "20:30",
  "20:59",
  "21:00",
  "21:59",
  "22:00",
  "23:59",
  "00:30",
  "17:45",
].entries()) {
  const date = "2026-11-" + String(index + 1).padStart(2, "0");
  state.days[date] = {
    kind: "work",
    oa: {
      date,
      start: "08:00",
      end,
      nextDay: end === "00:30",
      status: "complete",
      source: "test",
      raw: "",
    },
  };
}
state.scheduleRanges = [
  {
    start: "2026-11-11",
    end: "2026-11-11",
    schedule: { ...state.settings, workEnd: "18:00" },
  },
];
state.days["2026-11-12"] = {
  kind: "rest",
  actual: { start: "08:00", end: "23:00", nextDay: false },
};
state.days["2026-11-13"] = {
  kind: "work",
  actual: { start: "08:00", end: "", nextDay: false },
};
state.days["2026-11-28"] = {
  kind: "work",
  actual: { start: "08:00", end: "23:00", nextDay: false },
};
const analyze = (input = state) =>
  domain.statistics.monthlyAnalysis(input, "2026-11", "2026-11-27", true, {
    workdaysOnly: true,
  });
const counts = (input) =>
  Array.from(analyze(input).departureDistribution, (item) => item.count);
const before = JSON.stringify(state);
assert.deepEqual(counts(state), [2, 2, 2, 3]);
assert.equal(analyze().count, 11);
assert.equal(JSON.stringify(state), before);

const changed = domain.state.cloneState(state);
changed.settings.workEnd = "18:00";
assert.deepEqual(counts(changed), [1, 2, 2, 3]);
changed.scheduleRanges[0].schedule.workEnd = "17:00";
assert.deepEqual(counts(changed), [2, 2, 2, 3]);
changed.settings.workEnd = "21:30";
changed.scheduleRanges = [];
assert.deepEqual(counts(changed), [0, 2, 2, 3]);
assert.deepEqual(counts(domain.state.defaultState()), [0, 0, 0, 0]);
console.log(
  "Departure distribution verified: four exclusive intervals, exact boundaries, per-date schedule changes, next-day departures, early departures, empty data and excluded records.",
);
