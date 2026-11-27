"use strict";
// Check the real Ant Design markup and footer constraints without a browser.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const postcss = require("postcss");
const root = path.resolve(__dirname, "../../..");
const source = fs.readFileSync(
  path.join(root, "src/workspace/tabs.tsx"),
  "utf8",
);
const moduleEntry = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText,
  {
    module: moduleEntry,
    exports: moduleEntry.exports,
    WorkTimeApp: { i18n: { t: (key) => key } },
    require(name) {
      if (name === "../mount-view") return {};
      return require(name.replace("antd/es/", "antd/lib/"));
    },
  },
);
const ids = [
  "notifications",
  "countdown",
  "weather",
  "games",
  "music",
  "tools",
];
const tabs = [...ids, "history"].map((id) => ({
  id,
  label: id === "history" ? "节日、历史、农历" : id,
  icon: "calendar",
  controls: id === "history" ? "dateInfoPanel" : id + "Panel",
  divider: id === "history",
}));
for (const active of [...ids, "history"]) {
  const markup = renderToStaticMarkup(
    React.createElement(moduleEntry.exports.FunctionTabs, {
      tabs,
      active,
      activate: () => {},
    }),
  );
  assert.equal((markup.match(/role="tab"/g) || []).length, ids.length);
  assert.equal(
    (markup.match(/aria-selected="true"/g) || []).length,
    active === "history" ? 0 : 1,
  );
  const ancestors = [];
  let found = false;
  for (const match of markup.matchAll(/<(\/?)([\w-]+)\b([^>]*)>/g)) {
    const [, closing, tag, attributes] = match;
    if (closing) {
      ancestors.pop();
      continue;
    }
    if (attributes.includes('id="date-tab-history"')) {
      found = true;
      assert.equal(tag, "button");
      assert.ok(!ancestors.some((node) => node.includes('role="tablist"')));
      assert.ok(!ancestors.some((node) => node.includes("ant-tabs-nav")));
      assert.ok(attributes.includes('aria-controls="dateInfoPanel"'));
      assert.ok(attributes.includes(`aria-pressed="${active === "history"}"`));
      assert.ok(!attributes.includes('role="tab"'));
    }
    if (
      !["input", "img", "br", "hr", "link", "meta"].includes(tag) &&
      !match[0].endsWith("/>")
    )
      ancestors.push(attributes);
  }
  assert.equal(found, true, "date information has its own command button");
}
const css = postcss.parse(
  fs.readFileSync(path.join(root, "src/styles/sidebar-layout.css"), "utf8"),
);
function declaration(selector, property) {
  let value;
  css.walkRules(selector, (rule) => {
    rule.walkDecls(property, (decl) => (value = decl.value));
  });
  return value;
}
const item =
  "body .editor .function-tabs.ant-tabs > .ant-tabs-nav .ant-tabs-tab";
assert.equal(declaration(item, "padding"), "0");
assert.equal(declaration(item, "flex"), "0 0 32px");
assert.equal(declaration(item, "height"), "100%");
assert.equal(
  declaration("body .editor .function-tabs .ant-tabs-nav-list", "width"),
  "auto",
);
assert.equal(
  declaration(
    "body .editor .function-tabs.ant-tabs > .ant-tabs-nav::before",
    "border",
  ),
  "0",
);
assert.equal(
  declaration(
    "body .editor .notification-tabs .date-info-trigger",
    "margin-inline-start",
  ),
  "auto",
);
const controller = fs.readFileSync(
  path.join(root, "assets/js/date-info-ui.js"),
  "utf8",
);
assert.ok(controller.includes('node("article", undefined, "history-event")'));
assert.ok(
  controller.includes('node("section", undefined, "festival-section")'),
);
assert.ok(controller.includes('node("dl", undefined, "date-info-rows")'));
assert.ok(controller.includes('node("div", undefined, "almanac-sheet")'));
assert.ok(!controller.includes("workspaceViews.DateInformation"));
console.log(
  "Compact bottom Tabs, separate right-aligned date button, one separator, and original date-card markup verified without a browser.",
);
