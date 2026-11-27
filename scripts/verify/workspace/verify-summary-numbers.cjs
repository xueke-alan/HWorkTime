"use strict";

// Exercise the number renderer and summary props in Node, without a browser.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.resolve(__dirname, "../../..");

class Node {
  children = [];
  className = "";
  textContent = "";
  dataset = {};
  listeners = new Map();
  style = { setProperty() {}, removeProperty() {} };
  classList = {
    contains: (name) => this.className.split(" ").includes(name),
    add: (...names) => {
      this.className = [...new Set([...this.className.split(" "), ...names])]
        .filter(Boolean)
        .join(" ");
    },
    remove: (...names) => {
      this.className = this.className
        .split(" ")
        .filter((name) => !names.includes(name))
        .join(" ");
    },
    toggle: (name, on) =>
      on ? this.classList.add(name) : this.classList.remove(name),
  };
  append(...nodes) {
    for (const node of nodes) node.parent = this;
    this.children.push(...nodes);
  }
  replaceChildren(...nodes) {
    this.children = [];
    this.append(...nodes);
  }
  remove() {
    this.parent.children = this.parent.children.filter((node) => node !== this);
  }
  contains(node) {
    return this === node || this.children.some((child) => child.contains(node));
  }
  setAttribute() {}
  addEventListener(name, callback) {
    this.listeners.set(name, callback);
  }
  removeEventListener(name) {
    this.listeners.delete(name);
  }
  querySelectorAll(selector) {
    const names = selector.split(",").map((part) => part.trim().slice(1));
    return this.children.flatMap((child) => [
      ...(names.some((name) => child.classList.contains(name)) ? [child] : []),
      ...child.querySelectorAll(selector),
    ]);
  }
  querySelector(selector) {
    return this.querySelectorAll(selector)[0];
  }
}

const reduced = { matches: false };
const document = Object.assign(new Node(), {
  hidden: false,
  createElement: () => new Node(),
  documentElement: new Node(),
});
const app = {
  i18n: {
    t: (key) => key,
    number: (value, options) =>
      new Intl.NumberFormat("en", options).format(value),
    decimalSeparator: ".",
  },
  ui: {
    animationCompat: { preference: () => reduced, listen: () => () => {} },
  },
};
const context = vm.createContext({
  WorkTimeApp: app,
  document,
  Element: Node,
  setTimeout: () => 1,
  clearTimeout() {},
});
vm.runInContext(
  fs.readFileSync(path.join(root, "assets/js/summary-numbers.js"), "utf8"),
  context,
);
const numbers = app.ui.numbers;
const options = { decimals: 2, reserveSign: true, retainIntegerWidth: true };
const field = new Node();
const all = (selector) => field.querySelectorAll(selector);
const sign = () => all(".summary-number-sign")[0];
const finalDigits = () =>
  all(".summary-number-track").map((track) =>
    track.children[0].textContent.trim(),
  );

numbers.set(field, 19.54, options);
numbers.settle();
numbers.set(field, 0, options);
assert.deepEqual(finalDigits(), ["", "0", "0", "0"]);
assert.deepEqual(
  all(".summary-number-outgoing").map((node) => node.textContent),
  ["1", "9", "5", "4"],
  "Every previous digit rolls, including the high digit rolling to blank",
);
assert.equal(all(".summary-number-accessible")[0].textContent, "0.00");
assert.equal(
  all(".summary-number-track")[0].children[0].textContent,
  "\u00a0",
  "Blank slots retain a text baseline throughout the animation",
);
numbers.settle();
assert.equal(all(".summary-number-outgoing").length, 0);
assert.equal(all(".summary-number-column").length, 4);
numbers.set(field, 10, options);
numbers.settle();
numbers.set(field, 0, options);
assert.equal(all(".summary-number-outgoing")[0].textContent, "1");
assert.equal(finalDigits()[0], "", "10.00 -> 0.00 still animates the tens");
numbers.set(field, -0.4, options);
assert.ok(sign().classList.contains("number-sign-in"));
numbers.set(field, 0, options);
assert.ok(sign().classList.contains("number-sign-out"));
assert.equal(sign().textContent, "-");
numbers.settle();
assert.equal(sign().dataset.numberSignHidden, "true");
const unchanged = field.children[0];
numbers.set(field, 0, options);
assert.equal(field.children[0], unchanged, "Unchanged values do not restart");
numbers.set(field, -12.34, { ...options, deferAnimation: true });
assert.equal(sign().style.animationPlayState, "paused");
numbers.reveal(field);
assert.equal(sign().style.animationPlayState, "running");
reduced.matches = true;
numbers.set(field, 0, options);
assert.equal(all(".summary-number-outgoing").length, 0);
assert.ok(!sign().classList.contains("number-sign-out"));
reduced.matches = false;
const ordinary = new Node();
numbers.set(ordinary, "2026", { preserveText: true });
numbers.settle();
numbers.set(ordinary, "2027", { preserveText: true });
assert.equal(ordinary.querySelectorAll(".summary-number-column").length, 4);
assert.equal(
  ordinary.querySelectorAll(".summary-number-outgoing")[0].dataset.numberBefore,
  "6",
  "Existing date text and rolling remain supported",
);

vm.runInContext(
  fs.readFileSync(path.join(root, "assets/js/ui/presentation.js"), "utf8"),
  context,
);
const overtimeField = new Node();
for (const [minutes, expected] of [
  [-10, "-0h10m"],
  [0, "0h00m"],
  [10, "0h10m"],
  [59, "0h59m"],
  [60, "1h00m"],
  [-61, "-1h01m"],
  [1439, "23h59m"],
  [-0.1, "0h00m"],
])
  assert.equal(app.ui.hourMinuteParts(minutes).text, expected);
app.ui.renderHourMinutes(overtimeField, -10);
const overtimeHours = overtimeField.querySelector(".duration-hours"),
  overtimeMinutes = overtimeField.querySelector(".duration-minutes");
assert.equal(overtimeHours.children.at(-1).textContent, "h");
assert.equal(overtimeMinutes.children.at(-1).textContent, "m");
assert.ok(overtimeHours.classList.contains("summary-number-value"));
assert.ok(overtimeMinutes.classList.contains("summary-number-value"));
assert.equal(
  overtimeHours.querySelector(".summary-number-sign").dataset.numberSignHidden,
  "false",
);
assert.equal(
  overtimeMinutes.querySelectorAll(".summary-number-column").length,
  2,
);
app.ui.renderHourMinutes(overtimeField, 65);
assert.equal(overtimeField.querySelector(".duration-hours"), overtimeHours);
assert.equal(overtimeField.querySelector(".duration-minutes"), overtimeMinutes);
assert.ok(overtimeHours.querySelectorAll(".number-roll-up").length > 0);
assert.ok(overtimeMinutes.querySelectorAll(".number-roll-down").length > 0);
assert.ok(overtimeHours.querySelectorAll(".number-sign-out").length > 0);
numbers.settle();
assert.equal(
  overtimeHours.querySelectorAll(".summary-number-spacer").length,
  0,
);
assert.equal(
  overtimeMinutes.querySelectorAll(".summary-number-sign").length,
  0,
);
app.ui.renderHourMinutes(overtimeField, 59, { motion: false });
assert.equal(
  overtimeHours.querySelectorAll(".summary-number-outgoing").length,
  0,
);
assert.equal(
  overtimeMinutes.querySelectorAll(".summary-number-outgoing").length,
  0,
);
const monthLabel = new Node();
const yearField = new Node();
yearField.className = "year-month-year";
const monthField = new Node();
monthField.className = "year-month-month";
monthLabel.append(yearField, monthField);
monthLabel.querySelector = (selector) =>
  monthLabel.querySelectorAll(selector)[0];
for (const [before, after, expected, outgoing] of [
  ["12", "1", ["1", ""], ["2"]],
  ["10", "9", ["9", ""], ["1", "0"]],
  ["9", "10", ["1", "0"], ["9", "\u00a0"]],
  ["1", "12", ["1", "2"], ["\u00a0"]],
]) {
  app.ui.renderYearMonth(monthLabel, "2026", before);
  numbers.settle();
  app.ui.renderYearMonth(monthLabel, "2026", after);
  assert.deepEqual(
    monthField
      .querySelectorAll(".summary-number-track")
      .map((track) => track.children[0].textContent.trim()),
    expected,
    "Numeric month keeps its first digit in the left column",
  );
  assert.deepEqual(
    monthField
      .querySelectorAll(".summary-number-outgoing")
      .map((node) => node.textContent),
    outgoing,
    "Month digits roll within their left-aligned columns",
  );
  assert.ok(
    monthField
      .querySelectorAll(".summary-number-digit")
      .every((node) => node.textContent.length > 0),
    "All final and outgoing rows retain a text baseline",
  );
  numbers.settle();
  assert.equal(monthField.querySelectorAll(".summary-number-column").length, 2);
  assert.ok(!monthLabel.classList.contains("has-single-digit-month"));
}
app.ui.renderYearMonth(monthLabel, "2026", "January", { wordMonth: true });
assert.equal(monthField.querySelectorAll(".summary-number-word").length, 1);
assert.equal(
  monthField.querySelectorAll(".summary-number-accessible")[0].textContent,
  "January",
);

// Read the actual TSX view with lightweight hooks, capturing its paint contract.
let tree;
const exportsObject = {};
const jsx = (type, props) => ({ type, props });
const transpiled = ts.transpileModule(
  fs.readFileSync(path.join(root, "src/workspace/SummaryCards.tsx"), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  },
).outputText;
vm.runInNewContext(transpiled, {
  exports: exportsObject,
  WorkTimeApp: app,
  require: (name) => {
    if (name === "react/jsx-runtime") return { jsx, jsxs: jsx, Fragment: "" };
    if (name === "react")
      return {
        useRef: () => ({ current: new Node() }),
        useLayoutEffect: (callback) => callback(),
      };
    if (name === "antd/es/card") return { default: "card" };
    if (name === "../mount-view")
      return { mountView: () => ({ render: (value) => (tree = value) }) };
    throw Error("Unexpected dependency: " + name);
  },
});
const paints = [];
const metrics = Array.from({ length: 8 }, (_, i) => ({
  label: String(i),
  title: String(i),
  value: i === 7 ? 2.25 : null,
  options: {
    unit: i === 2 || i === 6 ? "d" : "h",
    decimals: 2,
    ...(i === 7 ? { reserveSign: false } : {}),
  },
  parts: i === 2 ? { days: "17", hours: "6.5" } : undefined,
}));
exportsObject.mountSummary(new Node()).render({
  metrics,
  negative: false,
  target: {
    target: 1.5,
    total: null,
    daily: null,
    restDays: 2,
    remainingText: null,
  },
  paint: (element, value, options) => paints.push({ value, ...options }),
});
const rowLabels = [];
function visit(node) {
  if (Array.isArray(node)) return node.forEach(visit);
  if (!node || typeof node !== "object") return;
  if (typeof node.type === "function") return visit(node.type(node.props));
  if (node.type === "dt") rowLabels.push(node.props.children);
  visit(node.props?.children);
}
visit(tree);
assert.deepEqual(rowLabels, ["5", "7", "2", "3", "4", "6"]);
assert.equal(paints.length, 14);
assert.ok(paints.every(({ value }) => value !== null));
const dailyTarget = paints.find(({ value }) => value === 1.5);
assert.equal(dailyTarget.reserveSign, false);
assert.equal(dailyTarget.retainIntegerWidth, false);
assert.ok(
  paints
    .filter((paint) => paint !== dailyTarget)
    .every(({ retainIntegerWidth }) => retainIntegerWidth),
);
const targetField = new Node();
numbers.set(targetField, dailyTarget.value, dailyTarget);
assert.equal(targetField.querySelectorAll(".summary-number-sign").length, 0);
assert.equal(targetField.querySelectorAll(".summary-number-column").length, 3);
assert.equal(
  targetField.querySelectorAll(".summary-number-accessible")[0].textContent,
  "1.50",
);
// Clearing a month's balance keeps exactly the same numeric slots, including
// its invisible sign. Layout must allow for those slots rather than split a title.
const balanceHours = new Node();
const balanceMinutes = new Node();
const balanceOptions = { reserveSign: true, retainIntegerWidth: true };
const balanceSlots = () =>
  [balanceHours, balanceMinutes].map(
    (field) =>
      field.querySelectorAll(".summary-number-column").length +
      field.querySelectorAll(".summary-number-sign").length,
  );
numbers.set(balanceHours, "-33", balanceOptions);
numbers.set(balanceMinutes, "52", { ...balanceOptions, reserveSign: false });
numbers.settle();
const occupiedSlots = balanceSlots();
numbers.set(balanceHours, "00", balanceOptions);
numbers.set(balanceMinutes, "00", { ...balanceOptions, reserveSign: false });
assert.deepEqual(balanceSlots(), occupiedSlots);
numbers.settle();
assert.deepEqual(balanceSlots(), occupiedSlots);
assert.equal(
  balanceHours.querySelector(".summary-number-sign").dataset.numberSignHidden,
  "true",
);
assert.ok(paints.filter(({ decimals }) => decimals === 2).length >= 8);
assert.equal(paints.find(({ unit }) => unit === "h/d").value, 0);
assert.equal(paints.find(({ unit }) => unit === "m").value, "00");
const restDays = paints.find(
  ({ unit, decimals }) => unit === "d" && decimals === 0,
);
assert.equal(
  restDays.value,
  2,
  "Rest-day counts use the shared number renderer",
);
assert.equal(restDays.reserveSign, false);
const attendanceDays = paints.find(({ value }) => value === "17");
const attendanceHours = paints.find(({ value }) => value === "6.5");
const leave = paints.find(({ value }) => value === 2.25);
for (const paint of [attendanceDays, attendanceHours, leave])
  assert.equal(paint.reserveSign, false);
const leaveField = new Node();
numbers.set(leaveField, 0, leave);
numbers.settle();
numbers.set(leaveField, leave.value, leave);
assert.ok(leaveField.querySelectorAll(".number-roll-up").length > 0);
assert.equal(
  leaveField.querySelectorAll(".summary-number-accessible")[0].textContent,
  "2.25",
);
assert.ok(
  paints
    .filter(
      (paint) =>
        paint.unit !== "m" &&
        ![
          restDays,
          dailyTarget,
          attendanceDays,
          attendanceHours,
          leave,
        ].includes(paint),
    )
    .every(({ reserveSign }) => reserveSign),
  "Signed summary fields, including workday overtime, reserve and fade their sign",
);
numbers.dispose();

// Use the real domain and controller to check leave totals and day/hour conversion.
let summaryProps;
const domainApp = {
  domain: {},
  data: {
    calendars: { schedules: {} },
    struggleDays: [],
    majorFestivals: { years: {}, fixed: {}, movableNames: [] },
  },
  i18n: { ...app.i18n, plural: (value) => String(value) },
  ui: {
    workspaceViews: {
      mountSummary: () => ({ render: (props) => (summaryProps = props) }),
    },
  },
};
const domainContext = vm.createContext({ WorkTimeApp: domainApp });
for (const file of [
  "domain/time",
  "domain/state",
  "domain/calendar",
  "domain/records",
  "domain/schedule",
  "domain/statistics",
  "ui/summary",
])
  vm.runInContext(
    fs.readFileSync(path.join(root, "assets/js", file + ".js"), "utf8"),
    domainContext,
  );
const core = Object.assign({}, ...Object.values(domainApp.domain));
core.pendingWorkdays = (state, start, end, asOf) =>
  domainApp.domain.statistics.pendingWorkdays(
    state,
    start,
    end,
    asOf,
    new Date("2026-10-27T04:00:00Z"),
  );
const state = core.defaultState();
const record = { start: "08:00", end: "17:30", nextDay: false };
state.days = {
  "2026-10-01": { kind: "work", actual: record },
  "2026-10-05": { kind: "work", actual: record, leaveMinutes: 90 },
  "2026-10-06": { kind: "work", leaveMinutes: 480 },
  "2026-10-07": {
    kind: "work",
    draft: { start: "08:00", end: "", nextDay: false },
    leaveMinutes: 60,
  },
  "2026-10-08": { kind: "rest", actual: record, leaveMinutes: 480 },
  "2026-10-09": { kind: "work", leaveMinutes: 999 },
  "2026-09-30": { kind: "work", leaveMinutes: 120 },
  "2026-11-01": { kind: "work", leaveMinutes: 60 },
};
state.scheduleRanges = [
  {
    start: "2026-10-09",
    end: "2026-10-09",
    schedule: { standardMinutes: 300 },
  },
];
assert.equal(core.summary(state, "2026-10-01", "2026-10-31").leaveMinutes, 930);
assert.equal(
  core.summary(state, "2026-10-01", "2026-10-31", false).leaveMinutes,
  930,
  "Leave includes incomplete/full-leave workdays, respects per-date schedules and excludes rest days and other months",
);
let range = ["2026-10-01", "2026-10-31"];
const controller = domainApp.ui.createSummary({
  core,
  element: () => ({ classList: { toggle() {} } }),
  getState: () => state,
  getView: () => ({ today: "2026-10-27" }),
  getRange: () => range,
  isStorageFailed: () => false,
  numbers: { set() {} },
});
controller.renderStats();
assert.equal(summaryProps.metrics[7].value, 15.5);
assert.equal(summaryProps.metrics[7].label, "summary.leaveHours");
assert.equal(summaryProps.metrics[2].parts.days, "01");
assert.equal(summaryProps.metrics[2].parts.hours, "6.5");
const referenceSummary = core.summary;
const targetMinutes = core.selectOvertimeRequirement(
  state,
  ...range,
).targetMinutes;
for (const difference of [-60, 0, 60]) {
  core.summary = (...args) => ({
    ...referenceSummary(...args),
    attendance: 1,
    workOvertime: targetMinutes + difference,
  });
  controller.renderStats();
  assert.equal(summaryProps.metrics[1].label, "short.hoursBalance");
  assert.equal(summaryProps.metrics[1].title, "summary.hoursBalance");
  assert.equal(summaryProps.metrics[1].value, Math.abs(difference));
  assert.equal(summaryProps.negative, difference < 0);
}
for (const [attendance, standardMinutes, days, hours] of [
  [0, 480, "00", "0.0"],
  [0.5, 480, "00", "4.0"],
  [17.8125, 480, "17", "6.5"],
  [17.99999, 480, "18", "0.0"],
  [2.5, 450, "02", "3.8"],
]) {
  core.summary = (...args) => ({ ...referenceSummary(...args), attendance });
  state.settings.standardMinutes = standardMinutes;
  controller.renderStats();
  assert.equal(summaryProps.metrics[2].parts.days, days);
  assert.equal(summaryProps.metrics[2].parts.hours, hours);
}
state.days = {};
core.summary = referenceSummary;
controller.renderStats();
assert.equal(summaryProps.metrics[7].value, 0, "No leave renders as 0.00 h");
state.settings.configured = false;
controller.renderStats();
assert.equal(summaryProps.metrics[2].parts.days, "00");
assert.equal(summaryProps.metrics[2].parts.hours, "0.0");
range = ["invalid", "invalid"];
controller.renderStats();
assert.equal(summaryProps.metrics[2].parts.days, "00");
console.log(
  "Summary formatting, leave aggregation, day/hour conversion and numeric rolls verified.",
);
