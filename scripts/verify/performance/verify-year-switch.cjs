"use strict";
// Run the real year renderer in Node; DOM painting is deliberately excluded.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { performance } = require("node:perf_hooks");
const root = path.resolve(__dirname, "../../..");
let drawnMonths;
let dataBuilds = 0,
  badgeBuilds = 0,
  markup = "",
  revision = 0;
let drawingInserted = false;
const layoutRead = () => {
  assert.ok(
    !drawingInserted,
    "Year DOM insertion must not be followed by forced geometry reads",
  );
};
const elements = new Map();
function element(id) {
  if (elements.has(id)) return elements.get(id);
  const children = new Map();
  const node = {
    id,
    dataset: {},
    textContent: "",
    innerHTML: "",
    get scrollWidth() {
      layoutRead();
      return 24;
    },
    style: { setProperty() {}, removeProperty() {} },
    classList: { toggle() {}, add() {}, remove() {}, contains: () => false },
    setAttribute() {},
    removeAttribute() {},
    getAttribute() {
      return null;
    },
    addEventListener() {},
    contains: () => false,
    getBoundingClientRect: () => {
      layoutRead();
      return { width: 24 };
    },
    querySelector(selector) {
      if (!children.has(selector))
        children.set(selector, element(id + " " + selector));
      return children.get(selector);
    },
    querySelectorAll: () => [],
  };
  elements.set(id, node);
  node.parentElement = node;
  return node;
}
const events = new Map();
const document = {
  querySelector: element,
  addEventListener: (name, listener) => events.set(name, listener),
  hidden: false,
};
const idle = new Map(),
  frames = new Map();
let taskId = 0;
const preparedYears = [];
function enqueue(queue, fn) {
  queue.set(++taskId, fn);
  return taskId;
}
function runOne(queue, argument) {
  const [id, fn] = queue.entries().next().value;
  queue.delete(id);
  fn(argument);
}
const window = {
  addEventListener() {},
  setTimeout() {},
  clearTimeout() {},
  setInterval: () => 1,
  clearInterval() {},
  requestIdleCallback: (fn) => enqueue(idle, fn),
  cancelIdleCallback: (id) => idle.delete(id),
  requestAnimationFrame: (fn) => enqueue(frames, fn),
  cancelAnimationFrame: (id) => frames.delete(id),
};
const app = {
  data: {},
  domain: {},
  services: { dateInfo: {} },
  i18n: {
    language: "zh-CN",
    locale: "zh-CN",
    config: { cjk: true },
    t: (key) => key,
    message: (text) => text,
    number: (value) => String(value),
    month: (value) => value,
  },
  ui: {
    animationCompat: {
      preference: () => ({ matches: false, addEventListener() {} }),
    },
    renderYearMonth() {},
    motion: { setToggleIcon() {} },
    native: {
      createBadge({ className }) {
        badgeBuilds++;
        return { outerHTML: `<span class="${className}"></span>` };
      },
    },
    createCalendarRenderer: () => ({
      prepareYearGrid({ markup: html }) {
        const year = Number(html.match(/data-year-month="(\d+)-01"/)[1]);
        preparedYears.push(year);
        return true;
      },
      updateText: (node, text) => {
        node.textContent = text;
      },
      updateYearCalendar: ({ markup: html, months }, { month }) => {
        drawnMonths = months;
        if (markup !== html) {
          assert.equal(
            (html.match(/class="year-day-layer year-detail-cells"/g) || [])
              .length,
            12,
          );
          assert.ok(
            !html.includes("<template>"),
            "Both label layers are ready when the year mounts",
          );
          drawingWrites++;
        }
        markup = html;
        assert.equal(month, view.month);
        drawingInserted = true;
      },
    }),
  },
};
const realm = vm.createContext({
  WorkTimeApp: app,
  document,
  window,
  getComputedStyle: () => {
    layoutRead();
    return { columnGap: "0" };
  },
});
for (const file of [
  "assets/data/calendars.js",
  "assets/data/major-festivals.js",
  "assets/data/struggle-days.js",
  "assets/data/lunar-months.js",
  "assets/js/date-info.js",
  ...["time", "state", "calendar", "records", "schedule", "statistics"].map(
    (name) => "assets/js/domain/" + name + ".js",
  ),
  "assets/js/year-view.js",
  "assets/js/ui/calendar.js",
])
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), realm);
let state = app.domain.state.defaultState();
state.days = new Proxy(state.days, {
  ownKeys() {
    throw Error("Building one year must not enumerate the entire archive");
  },
});
let view = {
  today: "2026-11-28",
  month: "2026-11",
  selected: "2026-11-28",
  viewYear: 2026,
  yearMode: true,
  yearViewMode: "heatmap",
};
const year = {
  ...app.ui.year,
  calendarMonths(...args) {
    dataBuilds++;
    return app.ui.year.calendarMonths(...args);
  },
};
const metricKeys = [
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
];
const paints = new Map();
let drawingWrites = 0,
  trackScans = 0;
element("calendar").querySelectorAll = (selector) => {
  assert.equal(selector, ".year-ink:not(.is-outgoing) [data-year-note-date]");
  trackScans++;
  return [];
};
const rows = metricKeys.map((key) => {
  const row = element(key);
  row.dataset.yearMetric = key;
  return row;
});
element("yearAnalysisCards").querySelectorAll = () => rows;
const calendar = app.ui.createCalendar({
  core: { ...app.domain.time, ...app.domain.calendar },
  element,
  document,
  window,
  year,
  escape: (value) => String(value),
  getState: () => state,
  getRevision: () => revision,
  getView: () => view,
  numbers: {
    set(node, value, options) {
      paints.set(node.id.split(" ")[0], { value, options });
    },
  },
  updateNotificationEmptyState() {},
});
function timeRender() {
  drawingInserted = false;
  const start = performance.now();
  calendar.renderYear();
  return performance.now() - start;
}
const cold = timeRender();
for (const key of ["average", "dailyHours"]) {
  assert.equal(
    paints.get(key).value,
    0,
    "Empty averages enter the rolling number renderer as numeric zero",
  );
  assert.equal(paints.get(key).options.decimals, 2);
  assert.equal(paints.get(key).options.unit, "h");
  assert.equal(paints.get(key).options.retainIntegerWidth, true);
}
for (const { value } of paints.values()) assert.equal(typeof value, "number");
const original = markup;
const initialBadges = badgeBuilds;
const warm = Array.from({ length: 20 }, timeRender).sort((a, b) => a - b)[10];
console.log(
  JSON.stringify({
    coldMs: +cold.toFixed(2),
    repeatedMedianMs: +warm.toFixed(2),
    dataBuilds,
    badgeBuilds,
    markupBytes: Buffer.byteLength(markup),
    labelTemplateElements: (markup.match(/<[a-z][\w-]*\b/g) || []).length,
    monthLayers: (markup.match(/class="year-day-layer /g) || []).length,
  }),
);
if (process.argv.includes("--baseline")) process.exit(0);
assert.equal(
  dataBuilds,
  1,
  "Returning to an unchanged year must reuse its data",
);
assert.equal(
  badgeBuilds,
  initialBadges,
  "Returning to an unchanged year must reuse its drawing markup",
);
assert.equal(markup, original);
assert.equal(drawnMonths.flatMap((m) => m.days).length, 365);
assert.equal((markup.match(/class="year-day-layer /g) || []).length, 12);
assert.ok(
  !markup.includes("<button"),
  "Year templates only parse headings and labels",
);
assert.equal(initialBadges, 2);
assert.equal(drawingWrites, 1);

view.month = "2026-10";
timeRender();
assert.equal(
  dataBuilds,
  1,
  "Selecting a month does not recalculate annual data",
);
assert.equal(
  markup,
  original,
  "Selecting a different month reuses the year drawing",
);
assert.equal(idle.size, 0);
view.yearViewMode = "calendar";
const change = events.get("worktime:yearviewchange");
change();
assert.equal(idle.size, 0);
assert.equal(
  frames.size,
  0,
  "First switch must not queue frames to finish revealing cold months",
);
assert.equal(
  drawingWrites,
  1,
  "The first mode click does not mount any label nodes",
);
for (let i = 0; i < 4; i++) {
  view.yearViewMode = i % 2 ? "calendar" : "heatmap";
  change();
}
assert.equal(frames.size + idle.size, 0);
assert.equal(drawingWrites, 1);
assert.equal(trackScans, 0);
timeRender();
assert.equal(dataBuilds, 1, "Heatmap and calendar use the same annual data");
const notes = markup;
assert.ok(
  notes.includes("data-note=") &&
    notes.includes("data-year-note-date=") &&
    notes.includes("year-day-badge is-work") &&
    notes.includes("year-day-badge is-rest"),
);
assert.equal(badgeBuilds, 2);
timeRender();
assert.equal(badgeBuilds, 2);

console.log(
  "Year display switches: all twelve pre-parsed months ready on first click, 0 frame waits, 4 warm toggles did 0 writes or grid scans.",
);
view.yearViewMode = "heatmap";
// Revisions cover in-place writes; replacement state covers imports/restores.
state.days["2026-11-02"] = {
  actual: { start: "08:00", end: "20:00", nextDay: false },
};
revision++;
timeRender();
assert.equal(dataBuilds, 2);
assert.equal(drawingWrites, 2);
view.yearViewMode = "calendar";
change();
assert.equal(
  drawingWrites,
  2,
  "A mode click after data invalidation reuses the live labels",
);
assert.ok(
  paints.get("average").value > 0,
  "A real value replaces zero through the same numeric paint contract",
);
assert.notEqual(markup, original);
state = { ...state, settings: { ...state.settings, standardMinutes: 420 } };
timeRender();
assert.equal(dataBuilds, 3);
view.today = "2026-11-29";
timeRender();
assert.equal(dataBuilds, 4);
app.i18n.language = "zh-TW";
timeRender();
assert.equal(dataBuilds, 5);
view.viewYear = 2028;
timeRender();
assert.equal(dataBuilds, 6);
assert.equal(drawnMonths.flatMap((m) => m.days).length, 366);
view.viewYear = 2026;
timeRender();
assert.equal(dataBuilds, 6, "Navigating back reuses the previous year's data");
view.viewYear = 2028;
revision++;
timeRender();
assert.equal(dataBuilds, 7, "An offscreen year's data follows record edits");
calendar.prepareNeighboringYears(-1);
const idleBudget = { timeRemaining: () => 30 };
const tooBusy = { timeRemaining: () => 1 };
runOne(idle, tooBusy);
assert.deepEqual(
  preparedYears,
  [],
  "Neighbor work yields the frame when the budget is low",
);
const beforeWarm = dataBuilds;
runOne(idle, idleBudget);
assert.deepEqual(preparedYears, [2027]);
assert.equal(dataBuilds, beforeWarm + 1);
runOne(idle, idleBudget);
assert.deepEqual(preparedYears, [2027, 2029]);
assert.equal(dataBuilds, beforeWarm + 2);
runOne(idle, idleBudget);
runOne(idle, idleBudget);
assert.deepEqual(preparedYears, [2027, 2029, 2026, 2030]);
assert.equal(idle.size, 0);
const afterWarm = dataBuilds;
for (const yr of [2026, 2028, 2030, 2029, 2027]) {
  view.viewYear = yr;
  timeRender();
  assert.equal(
    dataBuilds,
    afterWarm,
    "Both years in each direction have colors and labels ready",
  );
}
calendar.prepareNeighboringYears();
assert.equal(idle.size, 1);
view.viewYear = 2026;
runOne(idle, idleBudget);
assert.deepEqual(
  preparedYears,
  [2027, 2029, 2026, 2030],
  "A stale callback cannot prepare the wrong year",
);
assert.equal(idle.size, 0);
view.viewYear = 2030;
calendar.prepareNeighboringYears(1);
let checks = 0;
// Enough time to calculate the detailed year but not parse it.
const limitedBudget = { timeRemaining: () => (checks++ < 1 ? 9 : 1) };
runOne(idle, limitedBudget);
assert.deepEqual(
  preparedYears,
  [2027, 2029, 2026, 2030],
  "Parsing yields after a data build that uses most of the idle budget",
);
const afterBuild = dataBuilds;
runOne(idle, idleBudget);
assert.deepEqual(preparedYears, [2027, 2029, 2026, 2030, 2031]);
assert.equal(
  dataBuilds,
  afterBuild,
  "The queued year parses without recomputing its data",
);
assert.equal(
  idle.size,
  1,
  "The other neighbor waits for its own idle callback",
);
view.yearMode = false;
view.month = "1900-01";
calendar.prepareYearEntry();
const beforeEntry = preparedYears.length;
while (idle.size) runOne(idle, idleBudget);
assert.deepEqual(preparedYears.slice(beforeEntry), [1900, 1901, 1902]);

let lunarReads = 0;
const lookupLunar = (date) => {
  lunarReads++;
  return app.services.dateInfo.calendarLunar(date);
};
const visited = new Set();
for (const yr of [2026, 2027, 2028, 2029, 2030, 2028, 2027]) {
  const reads = lunarReads;
  const months = app.ui.year.calendarMonths(state, yr, view.today, lookupLunar);
  const count = months.reduce((sum, m) => sum + m.days.length, 0);
  assert.equal(lunarReads - reads, visited.has(yr) ? 0 : count);
  visited.add(yr);
}
console.log(
  "Neighbor data: idle preparation, fast navigation and cancellation verified.",
);

console.log(
  "Annual rendering: reuse, month selection, data edits, settings, date, language and leap-year invalidation verified.",
);

// Stopping nested effects must inspect tracked effects, not every calendar node.
const motionApp = {
  i18n: {},
  ui: {
    animationCompat: {
      preference: () => ({ matches: false }),
      listen: () => () => {},
    },
  },
};
const motionRealm = vm.createContext({
  WorkTimeApp: motionApp,
  document: { hidden: false, querySelector: () => null, addEventListener() {} },
  setTimeout: () => 1,
  clearTimeout() {},
});
vm.runInContext(
  fs.readFileSync(path.join(root, "assets/js/motion.js"), "utf8"),
  motionRealm,
);
function surface(parentElement = null) {
  const classes = new Set();
  return {
    parentElement,
    classes,
    style: { setProperty() {}, removeProperty() {} },
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
    },
    contains(node) {
      for (; node; node = node.parentElement) if (node === this) return true;
      return false;
    },
    querySelectorAll() {
      throw Error("Animation cleanup must not traverse all descendants");
    },
  };
}
const content = surface(),
  child = surface(content),
  nested = surface(child),
  outside = surface();
for (const node of [content, child, nested, outside])
  motionApp.ui.motion.play(node, "test-effect");
motionApp.ui.motion.stopWithin(content);
assert.equal(child.classes.size, 0);
assert.equal(nested.classes.size, 0);
assert.ok(
  content.classes.has("test-effect"),
  "Parent page transition remains active",
);
assert.ok(
  outside.classes.has("test-effect"),
  "Unrelated effects remain active",
);
console.log(
  "Animation cleanup: only nested tracked effects are stopped without scanning year nodes.",
);
