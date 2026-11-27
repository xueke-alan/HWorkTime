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
const manual = { start: "08:00", end: "19:30", nextDay: false };
function oa(start = "08:00", end = "17:30") {
  return {
    start,
    end,
    nextDay: false,
    status: "complete",
    source: "test",
    raw: "",
  };
}
function analyze(date, day) {
  const state = domain.state.defaultState();
  state.days[date] = day;
  const before = JSON.stringify(state);
  const result = domain.statistics
    .monthlyAnalysis(state, date.slice(0, 7), date, true)
    .chartDays.find((item) => item.date === date);
  assert.ok(result, "Complete fixture must appear in chart: " + date);
  assert.equal(JSON.stringify(state), before);
  return result;
}
for (const [day, expected] of [
  [{ oa: oa(), actual: manual }, [false, false]],
  [{ actual: manual }, [true, true]],
  [{ oa: oa(), actual: manual, sourcePriority: "manual" }, [true, true]],
  [{ oa: oa("", "17:30"), actual: manual }, [true, false]],
  [{ oa: oa("08:00", ""), actual: manual }, [false, true]],
  [{ oa: oa("08:00", ""), draft: manual }, [false, true]],
]) {
  const result = analyze("2026-11-02", day);
  assert.deepEqual([result.manualStart, result.manualEnd], expected);
  assert.equal(result.manual, expected.some(Boolean));
}
for (const [date, work, holiday] of [
  ["2026-11-01", false, false], // Ordinary Sunday.
  ["2026-10-01", false, true], // Published holiday on a weekday.
  ["2026-10-03", false, true], // Weekend inside the published holiday.
  ["2026-10-07", false, true], // Last day of the published break.
  ["2026-10-08", true, false], // First day after the break.
  ["2026-10-10", true, false], // Saturday designated as a makeup workday.
  ["2026-11-11", true, false], // A festival/observance is not a holiday.
  ["2028-01-01", false, false], // No published schedule: no holiday inference.
]) {
  const result = analyze(date, { oa: oa() });
  assert.equal(result.work, work, date);
  assert.equal(result.holiday, holiday, date);
}
assert.equal(analyze("2026-10-01", { kind: "work", oa: oa() }).holiday, false);
const customRest = analyze("2026-11-02", { kind: "rest", oa: oa() });
assert.equal(customRest.work, false);
assert.equal(customRest.holiday, false);
console.log(
  "Analysis sources verified: field-level manual provenance, OA priority, published holidays, holiday weekends, makeup workdays, custom date types and unknown-year fallback.",
);
