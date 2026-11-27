"use strict";
// Exercise real Ant components and controller contracts without a browser.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { ConfigProvider, Button, Input, Select, theme } = require("antd");
const postcss = require("postcss");
const { createCache, extractStyle, StyleProvider } = require(
  require.resolve("@ant-design/cssinjs", {
    paths: [path.dirname(require.resolve("antd"))],
  }),
);
const root = path.resolve(__dirname, "../../..");
const modules = new Map();
class FakeInput {
  text = "";
  get value() {
    return this.text;
  }
  set value(value) {
    this.text = String(value);
  }
}
function load(relative) {
  const file = path.resolve(root, relative);
  if (modules.has(file)) return modules.get(file).exports;
  const module = { exports: {} };
  modules.set(file, module);
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  vm.runInNewContext(
    source,
    {
      module,
      exports: module.exports,
      URL,
      HTMLInputElement: FakeInput,
      queueMicrotask,
      require(name) {
        if (name.endsWith(".css")) return {};
        if (!name.startsWith("."))
          return require(name.replace("antd/es/", "antd/lib/"));
        const base = path.resolve(path.dirname(file), name);
        const target = [base, base + ".ts", base + ".tsx"].find((candidate) =>
          fs.existsSync(candidate),
        );
        return load(target);
      },
    },
    { filename: file },
  );
  return module.exports;
}
function components() {
  const { SidebarTheme } = load("src/sidebar-theme.tsx");
  const { NumberField, bindNumberValue, setNumberValue } = load(
    "src/workspace/number-field.tsx",
  );
  for (const dark of [false, true]) {
    for (const locale of [
      "zh_CN",
      "zh_TW",
      "zh_HK",
      "en_US",
      "ja_JP",
      "ko_KR",
    ]) {
      let outer, inner;
      function Probe({ inside }) {
        const value = theme.useToken().token;
        if (inside) inner = value;
        else outer = value;
        return null;
      }
      const markup = renderToStaticMarkup(
        React.createElement(
          ConfigProvider,
          {
            locale: require("antd/lib/locale/" + locale).default,
            theme: {
              algorithm: [
                dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
                theme.compactAlgorithm,
              ],
              token: { borderRadius: 8, colorPrimary: "#1677ff" },
            },
          },
          React.createElement(Probe),
          React.createElement(
            SidebarTheme,
            null,
            React.createElement(Probe, { inside: true }),
            React.createElement(Button, null, "Action"),
            React.createElement(Input, { defaultValue: "08:00" }),
            React.createElement(NumberField, {
              id: "requirement",
              min: 0,
              max: 24,
              step: 0.1,
              precision: 1,
              defaultValue: 1.5,
              required: true,
            }),
            React.createElement(Select, {
              value: 5,
              options: [{ value: 5, label: "5 天" }],
            }),
          ),
        ),
      );
      assert.equal(
        outer.borderRadius,
        8,
        "Sidebar must not alter the parent theme",
      );
      for (const key of [
        "borderRadius",
        "borderRadiusSM",
        "borderRadiusLG",
        "borderRadiusXS",
      ])
        assert.equal(inner[key], 4);
      assert.equal(inner.colorPrimary, outer.colorPrimary);
      assert.equal(inner.colorBgBase, dark ? "#000" : "#fff");
      assert.equal(inner.fontSizeLG, 14);
      assert.equal(
        inner.fontHeightLG,
        Math.round(inner.fontSizeLG * inner.lineHeightLG),
      );
      assert.equal(inner.controlHeightLG, 36);
      assert.equal(inner.colorBorder, inner.colorBorderSecondary);
      assert.equal(inner.fontFamily, "var(--font-ui-medium)");
      assert.ok(markup.includes("ant-btn-lg"));
      assert.ok(markup.includes("ant-input-lg"));
      assert.ok(markup.includes("ant-select-lg"));
      assert.ok(markup.includes('type="number"'));
      assert.ok(markup.includes('step="0.1"'));
      assert.ok(markup.includes('value="1.5"'));
    }
  }
  for (const tracked of [false, true]) {
    const input = new FakeInput();
    let writes = 0;
    if (tracked)
      Object.defineProperty(input, "value", {
        configurable: true,
        get() {
          return this.text;
        },
        set(value) {
          writes++;
          this.text = String(value);
        },
      });
    const values = [];
    const dispose = bindNumberValue(input, (value) => values.push(value));
    for (const text of ["0", "1.5", "24", "", "-1", "invalid"])
      setNumberValue(input, text);
    assert.deepEqual(
      values,
      [0, 1.5, 24, null, -1, null],
      "Preserve blank and invalid values for controller validation, without silently clamping",
    );
    if (tracked)
      assert.equal(writes, 6, "React's existing value tracker must be called");
    // rc-input-number writes its native input while committing a render.
    // Such writes must never call our state update callback (React error #185).
    input.value = "";
    input.value = "2";
    assert.equal(values.length, 6, "React commits do not feed back into state");
    dispose();
    setNumberValue(input, "3");
    assert.equal(values.length, 6, "Unbound inputs no longer update React");
  }
}
async function personal() {
  const elements = new Map();
  const listeners = new Map();
  function element(id) {
    if (!elements.has(id))
      elements.set(id, {
        id,
        value: "",
        hidden: false,
        selectionStart: 0,
        selectionEnd: 0,
        setSelectionRange(start, end) {
          this.selectionStart = start;
          this.selectionEnd = end;
        },
        select() {
          this.setSelectionRange(0, this.value.length);
        },
      });
    return elements.get(id);
  }
  function listen(target, type, callback) {
    listeners.set(target.id + ":" + type, callback);
  }
  function fire(id, type, extra = {}) {
    return listeners.get(id + ":" + type)?.({
      target: element(id),
      preventDefault() {},
      ...extra,
    });
  }
  let cityOptions,
    disposed = false,
    persisted = true;
  const writes = [],
    errors = [];
  const model = {
    state: { personal: { employmentDate: "2026-01-01", workCity: "东莞市" } },
  };
  const app = {
    data: {
      weatherCities: {
        cities: [
          {
            id: "dongguan",
            name: "东莞",
            label: "东莞",
            office: "Weather office",
          },
        ],
      },
    },
    i18n: {
      city: (value) => value,
      message: (value) => value,
      t: (key) => key,
    },
    ui: {
      secondary: {},
      createEventScope: () => ({
        listen,
        handler: (target, name, fn) => listen(target, name.slice(2), fn),
        dispose() {},
      }),
      workspaceViews: {
        mountCityField: () => ({
          sync(next) {
            cityOptions = next;
          },
          close() {},
          dispose() {
            disposed = true;
          },
        }),
      },
      fieldErrors: {
        clear() {},
        show(_, value) {
          if (value) errors.push(value.code);
        },
      },
    },
  };
  vm.runInNewContext(
    fs.readFileSync(
      path.join(root, "assets/js/controllers/personal-settings.js"),
      "utf8",
    ),
    { WorkTimeApp: app, document: { id: "document" } },
  );
  const controller = app.ui.secondary.personal({
    core: {
      validDate: (value) =>
        /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)),
    },
    element,
    model,
    actions: { render() {}, saveFeedback() {} },
    application: {
      async savePersonal(value) {
        writes.push(value);
        if (persisted) Object.assign(model.state.personal, value);
        return { persisted, changed: true };
      },
    },
  });
  controller.bind();
  assert.equal(cityOptions[0].detail, "Weather office");
  assert.equal(element("workCity").value, "东莞");
  for (const [text, expected] of [
    ["2000-9-9", "2000-09-09"],
    ["20000909", "2000-09-09"],
  ]) {
    fire("employmentDate", "paste", { clipboardData: { getData: () => text } });
    await new Promise(setImmediate);
    assert.equal(element("employmentDate").value, expected);
    assert.equal(writes.at(-1).employmentDate, expected);
  }
  element("employmentDate").value = "2026-01-01";
  fire("employmentDate", "focus");
  fire("employmentDate", "keydown", { key: "ArrowRight" });
  fire("employmentDate", "beforeinput", {
    cancelable: true,
    inputType: "insertText",
    data: "9",
  });
  fire("employmentDate", "keydown", { key: "ArrowRight" });
  assert.equal(
    element("employmentDate").value,
    "2026-09-01",
    "Retain segmented input and zero padding",
  );
  element("employmentDate").value = "not a date";
  const count = writes.length;
  fire("personalSettingsForm", "input", { target: element("employmentDate") });
  await new Promise(setImmediate);
  assert.equal(writes.length, count, "Incomplete dates must not be saved");
  assert.equal(controller.hasDraft(), true);
  persisted = false;
  fire("personalSettingsForm", "input", { target: element("workCity") });
  await new Promise(setImmediate);
  assert.equal(writes.at(-1).workCity, "东莞市", "Preserve stored city format");
  assert.ok(errors.includes("UNSAVED"));
  controller.dispose();
  assert.equal(disposed, true);
}
function borderlessButtons() {
  const shared = postcss.parse(
    fs.readFileSync(path.join(root, "src/styles/sidebar-controls.css"), "utf8"),
  );
  let variables;
  shared.walkRules((rule) => {
    if (
      rule.selector ===
      "body .editor .ant-btn:is(.ant-btn-variant-text, .ant-btn-variant-link)"
    )
      variables = Object.fromEntries(
        rule.nodes
          .filter((node) => node.type === "decl")
          .map((node) => [node.prop, node.value]),
      );
  });
  assert(
    variables,
    "Borderless behavior must be shared across text/link buttons",
  );
  const cache = createCache();
  for (const type of ["text", "link", "default"]) {
    const markup = renderToStaticMarkup(
      React.createElement(
        StyleProvider,
        { cache },
        React.createElement(Button, { type }, type),
      ),
    );
    assert.equal(
      /ant-btn-variant-(text|link)\b/.test(markup),
      type !== "default",
      "Outlined buttons retain their intentional borders",
    );
  }
  const ant = postcss.parse(extractStyle(cache, { plain: true }));
  for (const [state, colorVariable] of [
    [null, "--ant-btn-border-color"],
    [":hover", "--ant-btn-border-color-hover"],
    [":active", "--ant-btn-border-color-active"],
  ]) {
    let border;
    ant.walkRules((rule) => {
      if (
        state
          ? rule.selector.endsWith(state) &&
            rule.selector.includes(".ant-btn:not(:disabled)")
          : rule.selector.endsWith(".ant-btn")
      )
        rule.walkDecls("border", (declaration) => {
          border = declaration.value;
        });
    });
    assert(
      border?.includes("var(--ant-btn-border-width)"),
      "Ant's actual border declaration must consume the shared width variable",
    );
    assert(border.includes(`var(${colorVariable})`));
    assert.equal(variables["--ant-btn-border-width"], "0px");
    assert.equal(variables[colorVariable], "transparent");
  }
}
async function main() {
  borderlessButtons();
  components();
  await personal();
  console.log(
    "Sidebar themes in six locales/light/dark, real Ant controls, number synchronization, segmented dates, paste, city persistence and failed saves verified without a browser.",
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
