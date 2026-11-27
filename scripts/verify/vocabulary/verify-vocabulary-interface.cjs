"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const acorn = require("acorn");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "../../..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const loaded = new Map();
function load(relative) {
  if (loaded.has(relative)) return loaded.get(relative);
  const entry = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(read(relative), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    {
      exports: entry.exports,
      module: entry,
      WorkTimeApp: { i18n: { t: (key) => key } },
      require(name) {
        if (name.endsWith(".css")) return {};
        if (name.startsWith("."))
          return load(path.join(path.dirname(relative), name) + ".tsx");
        return require(name.replace("antd/es/", "antd/lib/"));
      },
    },
  );
  loaded.set(relative, entry.exports);
  return entry.exports;
}
const { Books } = load("src/vocabulary/Books.tsx");
for (const random of [false, true]) {
  const markup = renderToStaticMarkup(
    React.createElement(Books, {
      book: null,
      current: "daily",
      entries: [],
      disabled: false,
      initialQuery: "",
      initialLimit: 40,
      summaries: {},
      distribution: { unlearned: 20 },
      counts: {},
      estimate: "",
      dailyTotal: 20,
      mode: "recall",
      random,
    }),
  );
  assert(markup.includes("toolbar-segmented--small"));
  assert(markup.includes('role="radiogroup"'));
  assert(!markup.includes('role="switch"'));
  assert(
    markup.includes(
      '<strong class="vocabulary-current-book-title">vocabulary.daily</strong>',
    ),
    "The current book title is plain text without a nested button or label span",
  );
  assert(!markup.includes("vocabulary-current-book-open"));
  const checked = [
    ...markup.matchAll(/<label\b[^>]*>[\s\S]*?<\/label>/g),
  ].filter((match) =>
    /<input\b[^>]*type="radio"[^>]*checked=""/.test(match[0]),
  );
  assert.equal(checked.length, 1);
  assert(
    checked[0][0].includes(
      `title="vocabulary.${random ? "randomOrder" : "ordered"}"`,
    ),
  );
}

const booksAst = ts.createSourceFile(
  "Books.tsx",
  read("src/vocabulary/Books.tsx"),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
let currentCard;
function findCurrentCard(node) {
  if (
    ts.isJsxOpeningElement(node) &&
    node.attributes.properties.some(
      (attribute) =>
        ts.isJsxAttribute(attribute) &&
        attribute.name.text === "className" &&
        attribute.initializer?.text === "vocabulary-current-book",
    )
  )
    currentCard = node;
  ts.forEachChild(node, findCurrentCard);
}
findCurrentCard(booksAst);
assert(currentCard);
assert(
  !currentCard.attributes.properties.some(
    (attribute) =>
      ts.isJsxAttribute(attribute) &&
      ["onClick", "onKeyDown", "tabIndex"].includes(attribute.name.text),
  ),
  "Clicking the plain title must not navigate through a card-level handler",
);

// Run the actual controller render function with lightweight DOM surfaces.
const source = read("assets/js/ui/vocabulary.js");
const ast = acorn.parse(source, { ecmaVersion: "latest" });
const factory = ast.body.find(
  (node) =>
    node.type === "ExpressionStatement" &&
    node.expression.type === "AssignmentExpression",
).expression.right.callee;
const render = factory.body.body.find(
  (node) => node.type === "FunctionDeclaration" && node.id.name === "render",
);
class Surface {
  children = [];
  scrollTop = 0;
  append(child) {
    this.children.push(child);
  }
  replaceChildren() {
    this.children = [];
  }
  querySelector() {
    return null;
  }
  setAttribute() {}
}
let active = "learning";
const navigation = new Surface();
navigation.querySelector = () => ({ dataset: { page: active } });
const pageSurface = new Surface();
const played = [];
const stoppedWithin = [];
const realm = vm.createContext({
  miniMode: false,
  disposed: false,
  panel: new Surface(),
  pageSurface,
  visible: () => true,
  data: {},
  view: "books",
  session: [],
  pageView: null,
  renderCount: 0,
  navigation,
  content: { dataset: {} },
  node: () => new Surface(),
  books() {},
  study() {},
  analysis() {},
  preferences() {},
  home() {},
  speechStatus: "idle",
  notice: "saved",
  failed: null,
  t: (key) => key,
  E: { queue: () => ({ items: [] }) },
  entries: [],
  navView: {
    update: (page) => {
      active = page;
    },
  },
  WorkTimeApp: {
    ui: {
      mountVocabularyPage: () => ({ dispose() {} }),
      motion: {
        stopWithin: (surface) => stoppedWithin.push(surface),
        play: (surface) => played.push(surface),
      },
    },
  },
});
vm.runInContext(source.slice(render.start, render.end), realm);
for (const view of ["books", "analysis", "preferences", "study"]) {
  realm.view = view;
  const count = played.length;
  realm.render();
  assert.equal(
    played.length,
    count + 1,
    "Each destination page gets an entrance",
  );
  realm.render();
  assert.equal(
    played.length,
    count + 1,
    "Data refreshes must not restart the entrance",
  );
}
assert(played.every((surface) => surface === pageSurface));
assert(stoppedWithin.every((surface) => surface === pageSurface));
assert(
  !played.includes(navigation),
  "Navigation stays outside the animated content",
);
console.log(
  "Vocabulary interface verified: small Segmented ordering, persisted selections, animated page changes and stable content/navigation on refresh.",
);
