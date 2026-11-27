"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const postcss = require("postcss");
const acorn = require("acorn");
const root = path.resolve(__dirname, "../../..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const toolbarSource = read("src/workspace/ToolbarSegmented.tsx");
assert(toolbarSource.includes("import Segmented, { type SegmentedProps }"));
assert(!toolbarSource.includes('from "antd/es/radio"'));
assert(
  !/getBoundingClientRect|ResizeObserver|useLayoutEffect|--view-left|--view-right/.test(
    toolbarSource,
  ),
);
const moduleEntry = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(toolbarSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText,
  {
    module: moduleEntry,
    exports: moduleEntry.exports,
    require(name) {
      return name.endsWith(".css")
        ? {}
        : require(name.replace("antd/es/", "antd/lib/"));
    },
  },
);
const Toolbar = moduleEntry.exports.default;
for (const size of [undefined, "small"]) {
  const received = [];
  const element = Toolbar({
    size,
    value: "ordered",
    options: ["ordered", "random"],
    onChange: (value) => received.push(value),
  });
  const group = element;
  group.props.onChange("random");
  assert.deepEqual(received, ["random"]);
  assert.equal(
    group.props.className.includes("toolbar-segmented--small"),
    size === "small",
    "Small controls opt in without changing existing toolbar sizing",
  );
}
for (const options of [
  ["calendar", "analysis"],
  [1, 2, 0],
  [
    {
      value: "calendar",
      label: React.createElement("span", { "data-view": "calendar" }, "日历"),
      icon: React.createElement("svg"),
    },
    { value: "analysis", label: "分析", disabled: true },
  ],
]) {
  const first = typeof options[0] === "object" ? options[0].value : options[0];
  for (const disabled of [false, true]) {
    const received = [];
    const props = {
      value: first,
      options,
      disabled,
      name: "toolbar-test",
      "aria-label": "Views",
      "aria-controls": "calendar",
      onChange: (value) => received.push(value),
    };
    const element = Toolbar(props);
    const group = element;
    group.props.onChange(first);
    assert.deepEqual(
      received,
      [first],
      "Numeric and string values retain their types",
    );
    const markup = renderToStaticMarkup(React.createElement(Toolbar, props));
    const inputs = [...markup.matchAll(/<input\b[^>]*>/g)].map(
      (match) => match[0],
    );
    assert.equal(inputs.length, options.length);
    assert(
      inputs.every(
        (input) =>
          input.includes('type="radio"') &&
          input.includes('name="toolbar-test"'),
      ),
    );
    assert.equal(
      inputs.filter((input) => input.includes('checked=""')).length,
      1,
    );
    if (disabled)
      assert(inputs.every((input) => input.includes('disabled=""')));
    assert(
      markup.includes('role="radiogroup"') &&
        markup.includes('aria-controls="calendar"'),
    );
    assert(markup.includes("ant-segmented-item-selected"));
  }
}

const rules = [];
for (const file of [
  "src/styles/toolbar-segmented.css",
  "assets/css/calendar.css",
  "assets/css/analysis.css",
  "assets/css/editor.css",
]) {
  const css = postcss.parse(read(file));
  css.walkRules((rule) => rules.push(rule));
  css.walkDecls((decl) =>
    assert(
      !/--view-left|--view-right|--year-footer-shift|--analysis-legend-inset|--leave-value-offset|--leave-unit-offset/.test(
        decl.value,
      ),
    ),
  );
}
function value(selector, property) {
  return rules
    .filter((rule) => rule.selector === selector)
    .flatMap((rule) => rule.nodes.filter((node) => node.prop === property))
    .at(-1)?.value;
}
assert.equal(
  value(
    ".toolbar-segmented.ant-segmented .ant-segmented-item-selected::before,\n.toolbar-segmented.ant-segmented .ant-segmented-thumb::before",
    "opacity",
  ),
  "1",
);
assert.equal(
  value(".toolbar-segmented.ant-segmented .ant-segmented-item::after", "width"),
  "auto",
  "Hover paint stays within the option",
);
assert.equal(
  value(".toolbar-segmented.ant-segmented .ant-segmented-thumb", "background"),
  "transparent",
  "The library thumb uses the same inset paint as the resting selection",
);
assert(
  !/visibility:\s*hidden|transition:\s*none/.test(
    rules
      .find(
        (rule) =>
          rule.selector ===
          ".toolbar-segmented.ant-segmented .ant-segmented-thumb",
      )
      .toString(),
  ),
  "The library thumb and its movement/width transitions remain enabled",
);
assert.equal(value(".analysis-legends", "padding-inline-start"), "108px");
assert.equal(
  value(
    "body .calendar-footer .year-scale > :is(.year-min, .year-max)",
    "width",
  ),
  "auto",
);
for (const selector of [
  "body .editor #dayForm .leave-inline #dayLeave",
  "body .editor #dayForm .leave-inline-unit",
])
  assert.equal(value(selector, "transition"), "opacity 180ms ease");

const calendar = read("assets/js/ui/calendar.js");
assert(
  !/updateYearFooterShift|prepareYearLegendLabel|scrollWidth|_clearTimer/.test(
    calendar,
  ),
);
const legendRealm = vm.createContext({});
const calendarFactory = acorn
  .parse(calendar, { ecmaVersion: "latest" })
  .body.find((node) => node.expression?.type === "AssignmentExpression")
  .expression.right;
const legendFunction = calendarFactory.body.body.find(
  (node) =>
    node.type === "FunctionDeclaration" &&
    node.id.name === "setYearLegendLabels",
);
assert(legendFunction);
vm.runInContext(
  calendar.slice(legendFunction.start, legendFunction.end),
  legendRealm,
);
const labels = [0, 1].map(() => ({
  textContent: "",
  setAttribute(name, text) {
    this[name] = text;
  },
  getBoundingClientRect() {
    assert.fail("Legend updates must not measure labels");
  },
}));
legendRealm.setYearLegendLabels([
  [labels[0], "-12.5 h"],
  [labels[1], "20 h"],
]);
assert.equal(labels[0].textContent, "-12.5 h");
assert.equal(labels[1]["aria-hidden"], "false");
legendRealm.setYearLegendLabels([
  [labels[0], ""],
  [labels[1], ""],
]);
assert(
  labels.every(
    (label) => label.textContent === "" && label["aria-hidden"] === "true",
  ),
);

function node() {
  const attributes = new Map();
  return {
    inert: false,
    unavailable: false,
    classList: {
      toggle(name, enabled) {
        this[name] = enabled;
      },
    },
    matches() {
      return this.unavailable;
    },
    setAttribute(name, text) {
      attributes.set(name, text);
    },
    getAttribute: (name) => attributes.get(name),
    focus() {
      this.focused = true;
    },
    getBoundingClientRect() {
      assert.fail("Leave editing must not measure positions");
    },
  };
}
const panel = node(),
  toggle = node(),
  area = node(),
  action = node(),
  unavailable = node();
unavailable.unavailable = true;
const row = {
  children: [area, action, unavailable],
  classList: node().classList,
};
area.closest = () => row;
const editor = read("assets/js/ui/editor.js");
const leaveRealm = vm.createContext({
  $: (id) =>
    ({ dayLeavePanel: panel, dayLeaveToggle: toggle, dayLeaveArea: area })[id],
});
vm.runInContext(
  editor.slice(
    editor.indexOf("  function setLeavePanel("),
    editor.indexOf("  function openLeavePanel("),
  ),
  leaveRealm,
);
leaveRealm.setLeavePanel(true);
assert.equal(panel.inert, false);
assert.equal(toggle.getAttribute("aria-expanded"), "true");
assert.equal(area.inert, false);
assert.equal(action.inert, true);
leaveRealm.setLeavePanel(false, true);
assert.equal(panel.inert, true);
assert.equal(toggle.inert, false);
assert.equal(toggle.focused, true);
assert.equal(action.inert, false);
assert.equal(unavailable.inert, true);

let reads = 0,
  draws = 0;
const plot = {
  getBoundingClientRect() {
    reads++;
    return { width: 760, height: 420 };
  },
  querySelector() {
    assert.fail("Legend indentation must not query SVG geometry");
  },
};
const analysis = read("assets/js/ui/analysis.js");
const chartRealm = vm.createContext({
  currentData: {},
  getView: () => ({ analysisMode: true }),
  window: { matchMedia: () => ({ matches: true }), document: {} },
  plot,
  groupFrom: () => null,
  lastSize: "",
  selectedDate: null,
  syncMarkup() {
    draws++;
  },
  chart: () => "svg",
  selectDate() {},
});
vm.runInContext(
  analysis.slice(
    analysis.indexOf("  function drawChart("),
    analysis.indexOf("  const resize ="),
  ),
  chartRealm,
);
chartRealm.drawChart();
chartRealm.drawChart();
assert.equal(reads, 2, "Only responsive plot dimensions are read");
assert.equal(draws, 1);
assert(!/getScreenCTM|legendX|analysis-legend-inset/.test(analysis));
console.log(
  "Native toolbar Segmented, inset thumb paint, input states, typed callbacks, legend labels, leave focus/inert handling and measurement-free legend indentation verified.",
);
