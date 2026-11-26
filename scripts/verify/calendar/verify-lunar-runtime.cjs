"use strict";
const assert = require("node:assert/strict");
const path = require("node:path");
const root = path.resolve(process.argv[2] || ".");
const source = require(path.join(root, "assets/vendor/lunar.js"));
const runtime = require(path.join(root, "assets/vendor/lunar.min.js"));
const vm = require("node:vm");
const fs = require("node:fs");
const context = vm.createContext({ WorkTimeApp: { data: {}, services: {} } });
for (const file of ["assets/data/lunar-months.js", "assets/js/date-info.js"])
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
assert.deepEqual(Object.keys(runtime).sort(), Object.keys(source).sort());
function describe(library, year, month, day) {
  const solar = library.Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  return {
    solar: solar.toFullString(),
    lunar: lunar.toFullString(),
    term: lunar.getJieQi(),
    festivals: lunar.getFestivals(),
    suitable: lunar.getDayYi(),
    unsuitable: lunar.getDayJi(),
  };
}
let count = 0;
for (let year = 1900; year <= 2100; year++) {
  for (let month = 1; month <= 12; month++) {
    for (const day of new Set([1, 15, new Date(year, month, 0).getDate()])) {
      const iso = [year, month, day]
        .map((n) => String(n).padStart(2, "0"))
        .join("-");
      const label = context.WorkTimeApp.services.dateInfo.calendarLunar(iso);
      const full = runtime.Solar.fromYmd(year, month, day).getLunar();
      for (const field of [
        "getMonth",
        "getDay",
        "getDayInChinese",
        "getMonthInChinese",
      ]) {
        const expected = full[field]();
        assert.equal(
          label[field](),
          typeof expected === "string"
            ? expected.replace(/^[闰閏]/, "")
            : expected,
          iso,
        );
      }
      assert.deepEqual(
        describe(runtime, year, month, day),
        describe(source, year, month, day),
        `${year}-${month}-${day}: compact lunar runtime differs from source`,
      );
      count++;
    }
  }
}
console.log(
  `Compact lunar exports, calendar, festivals, solar terms and almanac match upstream for ${count} dates across 1900–2100.`,
);
