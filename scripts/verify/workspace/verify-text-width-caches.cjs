"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const postcss = require("postcss");
const root = path.resolve(__dirname, "../../..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
function sources(directory) {
  return fs
    .readdirSync(path.join(root, directory), { withFileTypes: true })
    .flatMap((entry) => {
      const file = directory + "/" + entry.name;
      if (entry.isDirectory())
        return entry.name === "file-chunks" ? [] : sources(file);
      return file.endsWith(".js") && !file.endsWith(".min.js") ? [file] : [];
    });
}
for (const file of sources("assets/js"))
  assert(
    !/\.measureText\s*\(/.test(read(file)),
    file + " must not measure Canvas text",
  );
assert(!read("assets/js/date-info-ui.js").includes("fitAlmanac"));
assert(
  !/monthSlotWidths|monthMeasureContext|getComputedStyle/.test(
    read("assets/js/ui/calendar.js")
      .split("function updateMonthTitle(")[1]
      .split("function monthWorkdayNumber(")[0],
  ),
);
assert(!read("assets/js/ui/analysis.js").includes("clearTextWidths"));

const css = postcss.parse(read("assets/css/calendar.css"));
function width(selector) {
  return css.nodes
    .filter((node) => node.type === "rule" && node.selector === selector)
    .flatMap((rule) =>
      rule.nodes.filter((node) => node.prop === "--month-label-width"),
    )
    .at(-1)?.value;
}
assert.equal(width("body .month-controls .month-title"), "2ch");
assert.equal(width("body .month-controls .month-title.has-word-month"), "3em");

const locales = ["zh-CN", "zh-TW", "zh-HK", "en", "ja", "ko"];
const translations = { data: {} };
const localeRealm = vm.createContext({ WorkTimeApp: translations });
for (const locale of locales)
  vm.runInContext(read(`assets/js/locales/runtime/${locale}.js`), localeRealm);
const app = { ui: {}, i18n: { duration: String } };
const realm = vm.createContext({
  WorkTimeApp: app,
  getComputedStyle: () =>
    assert.fail("Month changes must not read font geometry"),
  document: {
    createElement: () =>
      assert.fail("Text layout must not create Canvas elements"),
  },
});
vm.runInContext(read("assets/js/ui/analysis-graphics.js"), realm);
vm.runInContext(read("assets/js/ui/presentation.js"), realm);
const day = {
  date: "2026-11-01",
  work: true,
  start: 480,
  end: 1500,
  overtime: 60,
};
const data = {
  referenceStart: 480,
  referenceEnd: 1020,
  chartDays: [day],
  days: [day],
  calendarDays: [day],
  longest: { dates: [], count: 0 },
  asOf: day.date,
};
for (const locale of locales) {
  const graphics = app.ui.createAnalysisGraphics({
    escape: (s) => s,
    number: String,
    date: (s) => s,
    t: (key) => translations.data.locales[locale]["analysis." + key] || key,
    window: {
      document: {
        createElement: () =>
          assert.fail("Charts must not create Canvas elements"),
      },
    },
  });
  assert.equal(graphics.clearTextWidths, undefined);
  assert(
    graphics
      .clock(1500)
      .startsWith(translations.data.locales[locale]["analysis.nextDay"] + " "),
  );
  for (const viewportWidth of [320, 760, 1280]) {
    const svg = graphics.chart(data, viewportWidth, 420);
    assert(svg.includes('<line x1="112"'));
    assert(!/NaN|Infinity/.test(svg));
    for (const [, coordinate] of svg.matchAll(/\b(?:x|x1|x2|cx)="([\d.-]+)"/g))
      assert(
        Number(coordinate) >= 0 && Number(coordinate) <= viewportWidth,
        `${locale}: coordinate ${coordinate}`,
      );
    assert.equal(graphics.chart(data, viewportWidth, 420), svg);
  }
}

const year = { setAttribute() {} },
  month = {
    setAttribute(name, value) {
      this[name] = value;
    },
  };
const classes = new Set();
let initialized = false;
const title = {
  querySelector(selector) {
    if (selector === ".month-title-divider") return initialized ? {} : null;
    return selector === ".year-month-year" ? year : month;
  },
  set innerHTML(value) {
    initialized = value.includes("month-title-divider");
  },
  classList: {
    toggle(name, enabled) {
      if (enabled) classes.add(name);
      else classes.delete(name);
    },
  },
  style: {
    setProperty: () => assert.fail("Month slots must be controlled by CSS"),
  },
};
realm.$ = () => title;
realm.dateDivider = '<span class="month-title-divider">/</span>';
realm.renderYearMonth = (label, yearValue, monthValue, options) =>
  app.ui.renderYearMonth(label, yearValue, monthValue, {
    ...options,
    numbers: {
      set(field, value) {
        field.value = value;
      },
    },
  });
const calendarSource = read("assets/js/ui/calendar.js");
vm.runInContext(
  calendarSource.slice(
    calendarSource.indexOf("  function updateMonthTitle("),
    calendarSource.indexOf("  function monthWorkdayNumber("),
  ),
  realm,
);
for (const locale of locales) {
  app.i18n.config = { cjk: locale !== "en" };
  app.i18n.monthName = (value) =>
    new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" })
      .format(new Date(value + "T12:00:00Z"))
      .replace(/\bSept\b/g, "Sep");
  for (let index = 1; index <= 12; index++) {
    for (const yearMode of [false, true]) {
      realm.updateMonthTitle(2026, index, yearMode);
      assert.equal(year.value, "2026");
      assert.equal(
        month.value,
        locale === "en"
          ? app.i18n.monthName(`2026-${String(index).padStart(2, "0")}-01`)
          : String(index),
      );
      assert.equal(classes.has("has-word-month"), locale === "en");
      assert.equal(classes.has("is-year-title"), yearMode);
      assert.equal(month["aria-hidden"], String(yearMode));
    }
  }
}
console.log(
  "Six-language month/year switching and fixed chart gutters verified with Canvas/font measurements forbidden in all first-party sources.",
);
