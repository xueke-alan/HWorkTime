"use strict";
// Exercise actual navigation and DOM reconciliation with a small Node DOM stand-in.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const acorn = require("acorn");
const root = path.resolve(__dirname, "../../..");
function read(file) {
  if (!process.argv.includes("--published"))
    return fs.readFileSync(path.join(root, file), "utf8");
  const factory = {
    "navigation.js": "createNavigationController",
    "agenda-entry.js": "createAgendaEntry",
    "calendar-renderer.js": "createCalendarRenderer",
  }[path.basename(file)];
  const directory = path.join(root, "_site/assets/js/ui");
  for (const name of fs
    .readdirSync(directory)
    .filter((name) => name.endsWith("-runtime.min.js"))) {
    const source = fs.readFileSync(path.join(directory, name), "utf8");
    if (!source.includes(factory)) continue;
    const ast = acorn.parse(source, { ecmaVersion: "latest" });
    let assignment;
    function visit(node) {
      if (!node || typeof node !== "object" || assignment) return;
      if (
        node.type === "AssignmentExpression" &&
        node.left.type === "MemberExpression" &&
        node.left.property.name === factory
      ) {
        assignment = node;
        return;
      }
      for (const value of Object.values(node)) {
        if (Array.isArray(value)) value.forEach(visit);
        else if (value && typeof value === "object") visit(value);
      }
    }
    visit(ast);
    if (assignment) return source.slice(assignment.start, assignment.end) + ";";
  }
  throw Error("Published factory missing: " + factory);
}

class Element {
  constructor(tag = "div", attributes = {}) {
    this.localName = tag;
    this.tagName = tag.toUpperCase();
    this.attrs = { ...attributes };
    this.childNodes = [];
    this.parentElement = null;
    this.dataset = {};
    this.inert = false;
    this.hidden = false;
    this.style = {
      setProperty(name, value) {
        this[name] = value;
      },
      removeProperty(name) {
        delete this[name];
      },
    };
    this.classList = {
      contains: (name) => (this.attrs.class || "").split(" ").includes(name),
      add: (name) => {
        this.attrs.class = [this.attrs.class, name].filter(Boolean).join(" ");
      },
      remove: (name) => {
        this.attrs.class = (this.attrs.class || "")
          .split(" ")
          .filter((part) => part !== name)
          .join(" ");
      },
      toggle: (name, value) => {
        if (value) this.classList.add(name);
        else this.classList.remove(name);
      },
    };
    for (const [key, value] of Object.entries(attributes))
      this.setAttribute(key, value);
  }
  addEventListener(type, fn) {
    this[type] = fn;
  }
  removeEventListener(type) {
    delete this[type];
  }
  get attributes() {
    return Object.entries(this.attrs).map(([name, value]) => ({ name, value }));
  }
  get children() {
    return this.childNodes;
  }
  get lastElementChild() {
    return this.children.at(-1);
  }
  set innerHTML(value) {
    assert.equal(value, "");
    this.replaceChildren();
  }
  prepend(...nodes) {
    this.replaceChildren(...nodes, ...this.children);
  }
  append(...nodes) {
    this.replaceChildren(...this.children, ...nodes);
  }
  remove() {
    this.parentElement?.replaceChildren(
      ...this.parentElement.children.filter((child) => child !== this),
    );
  }
  cloneNode(deep) {
    const copy = new Element(this.localName, this.attrs);
    if (deep)
      copy.replaceChildren(
        ...this.children.map((child) => child.cloneNode(true)),
      );
    return copy;
  }
  replaceWith(node) {
    this.parentElement.replaceChildren(
      ...this.parentElement.children.map((child) =>
        child === this ? node : child,
      ),
    );
  }
  get innerHTML() {
    return this.childNodes.map((node) => node.outerHTML).join("");
  }
  get outerHTML() {
    return `<${this.localName} ${JSON.stringify(this.attrs)}>${this.innerHTML}</${this.localName}>`;
  }
  setAttribute(key, value) {
    this.attrs[key] = value;
    if (key.startsWith("data-"))
      this.dataset[
        key.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
      ] = value;
  }
  hasAttribute(key) {
    return key in this.attrs;
  }
  getAttribute(key) {
    return this.attrs[key] ?? null;
  }
  removeAttribute(key) {
    delete this.attrs[key];
    if (key.startsWith("data-"))
      delete this.dataset[
        key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())
      ];
  }
  matches(selector) {
    if (selector === "[data-year-date]")
      return this.hasAttribute("data-year-date");
    return selector
      .split(",")
      .some(
        (part) =>
          part.trim().startsWith(".") &&
          this.classList.contains(part.trim().slice(1)),
      );
  }
  closest(selector) {
    return this.matches(selector)
      ? this
      : this.parentElement?.closest(selector) || null;
  }
  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
  querySelectorAll(selector) {
    return this.childNodes.flatMap((node) => [
      ...(node.matches(selector) ? [node] : []),
      ...node.querySelectorAll(selector),
    ]);
  }
  replaceChildren(...nodes) {
    for (const node of this.childNodes) node.parentElement = null;
    this.childNodes = [];
    for (const node of nodes) {
      if (node.parentElement)
        node.parentElement.childNodes = node.parentElement.childNodes.filter(
          (child) => child !== node,
        );
      node.parentElement = this;
      this.childNodes.push(node);
    }
  }
  getClientRects() {
    return [{}];
  }
}

function verifyDOMReuse() {
  const calendar = new Element();
  let parses = 0;
  function fixture(html) {
    const cell = new Element("section", {
      class: "year-month",
      "data-year-month": html === "year-b" ? "2028-01" : "2026-01",
    });
    const grid = new Element("div", { class: "year-days" });
    grid.replaceChildren(
      new Element("div", { class: "year-ink", "data-label": html }),
    );
    cell.replaceChildren(
      new Element("span", { class: "year-month-stats" }),
      new Element("span", { class: "year-month-number" }),
      grid,
    );
    return [cell];
  }
  const snapshots = {};
  for (const [key, offset, year] of [
    ["year-a", 0, 2026],
    ["year-b", 2, 2028],
  ]) {
    const days = Array.from({ length: 31 }, (_, i) => ({
      date: year + "-01-" + String(i + 1).padStart(2, "0"),
      description: String(year) + " day " + (i + 1),
      color: { background: offset ? "red" : "white" },
      today: i === 0 && !offset,
      weekend: (i + offset) % 7 > 4,
    }));
    snapshots[key] = { markup: key, months: [{ offset, days }] };
  }
  let allocatedButtons = 0;
  const document = {
    hidden: true,
    activeElement: null,
    createElement(tag) {
      if (tag === "button") {
        allocatedButtons++;
        return new Element(tag);
      }
      if (tag === "div" || tag === "span") return new Element(tag);
      assert.equal(tag, "template");
      const content = new Element();
      return {
        content,
        set innerHTML(html) {
          parses++;
          content.replaceChildren(
            ...(html.startsWith("year") ? fixture(html) : [new Element()]),
          );
        },
      };
    },
  };
  const app = {
    ui: {
      animationCompat: { preference: () => ({ matches: true }) },
      motion: { animateCalendar() {} },
      calendarCells(cells) {
        const old = new Map(calendar.children.map((node) => [node.key, node]));
        const nodes = cells.map((cell) => {
          const node = old.get(cell.key) || new Element(cell.tag);
          node.key = cell.key;
          return node;
        });
        calendar.replaceChildren(...nodes);
        return nodes;
      },
    },
  };
  const timers = new Map();
  const revealFrames = new Map();
  vm.runInNewContext(read("assets/js/ui/calendar-renderer.js"), {
    requestAnimationFrame(fn) {
      revealFrames.set(1, fn);
      return 1;
    },
    cancelAnimationFrame(id) {
      revealFrames.delete(id);
    },
    setTimeout(fn) {
      timers.set(1, fn);
      return 1;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    WorkTimeApp: app,
    Element,
  });
  const renderer = app.ui.createCalendarRenderer({
    element: () => calendar,
    document,
    weatherLayer: { refresh() {} },
  });
  renderer.updateYearCalendar(snapshots["year-a"], {});
  const firstSlot = () => calendar.querySelector(".year-days").children[0];
  const originalButton = firstSlot();
  renderer.updateYearCalendar(snapshots["year-a"], { month: "2026-01" });
  assert.equal(calendar.children[0].getAttribute("aria-current"), "true");
  renderer.updateYearCalendar(snapshots["year-a"], { month: "2026-05" });
  assert.equal(calendar.children[0].hasAttribute("aria-current"), false);
  assert.equal(parses, 1);
  renderer.updateCalendar("month");
  assert.equal(parses, 2);
  renderer.updateYearCalendar(snapshots["year-a"], {});
  assert.equal(
    parses,
    2,
    "Returning to the same year does not parse HTML again",
  );
  assert.equal(firstSlot(), originalButton, "Date nodes survive a round trip");
  renderer.updateCalendar("month");
  assert.equal(
    renderer.prepareYearGrid(snapshots["year-b"], { timeRemaining: () => 1 }),
    false,
  );
  assert.equal(
    renderer.prepareYearGrid(snapshots["year-b"], { timeRemaining: () => 8 }),
    true,
  );
  const prebuiltButtons = allocatedButtons;
  assert.equal(parses, 4);
  renderer.prepareYearGrid(snapshots["year-b"]);
  assert.equal(parses, 4, "The same neighboring year only parses once");
  assert.equal(calendar.children.length, 1);
  renderer.updateYearCalendar(snapshots["year-b"], {});
  assert.equal(
    parses,
    4,
    "Switching to a prepared year needs no new HTML parse",
  );
  assert.equal(
    allocatedButtons,
    prebuiltButtons,
    "First entry reuses the prebuilt buttons and palette",
  );
  const liveGrid = calendar.querySelector(".year-days");
  const slots = liveGrid.children.slice(0, 42);
  const palette = liveGrid.children[42];
  assert.equal(palette.children.length, 42);
  assert.equal(palette.children[5].className, "is-weekend");
  const allocationsBeforeSwitch = allocatedButtons;
  assert.equal(firstSlot().disabled, true);
  const bInk = liveGrid.lastElementChild;
  renderer.prepareYearGrid(snapshots["year-a"]);
  const preparedParses = parses;
  assert.equal(firstSlot().style["--year-heat-bg"], undefined);
  assert.equal(bInk.classList.contains("is-outgoing"), false);
  renderer.updateYearCalendar(snapshots["year-a"], { animateYear: true });
  assert.equal(firstSlot().dataset.yearDate, "2026-01-01");
  assert.equal(firstSlot().disabled, false);
  assert.equal(firstSlot().style["--year-heat-bg"], "white");
  assert.equal(palette.children[0].className, "is-workday");
  assert.equal(liveGrid.children.length, 45);
  assert.ok(bInk.classList.contains("is-outgoing"));
  const aInk = liveGrid.lastElementChild;
  assert.ok(aInk.classList.contains("is-entering"));
  assert.equal(aInk.dataset.label, "year-a");
  assert.equal(revealFrames.size, 0);
  // Reverse before either fade completes. Both previously parsed layers are reused.
  renderer.updateYearCalendar(snapshots["year-b"], { animateYear: true });
  assert.equal(bInk.parentElement, liveGrid);
  assert.ok(
    !bInk.classList.contains("is-entering"),
    "Reverse the in-flight opacity transition in place",
  );
  assert.ok(!bInk.classList.contains("is-outgoing"));
  assert.ok(aInk.classList.contains("is-outgoing"));
  assert.ok(firstSlot().disabled);
  assert.equal(liveGrid.children[2].dataset.yearDate, "2028-01-01");
  assert.equal(liveGrid.children[2].style["--year-heat-bg"], "red");
  assert.equal(liveGrid.children.length, 45);
  renderer.updateYearCalendar(snapshots["year-b"], { animateYear: true });
  timers.get(1)();
  assert.equal(liveGrid.children.length, 44);
  assert.equal(timers.size, 0);
  assert.equal(liveGrid.lastElementChild, bInk);
  assert.equal(liveGrid.children[42], palette);
  slots.forEach((slot, i) => assert.equal(liveGrid.children[i], slot));
  renderer.updateYearCalendar(snapshots["year-a"], { animateYear: true });
  assert.equal(liveGrid.lastElementChild, aInk);
  assert.equal(parses, preparedParses);
  renderer.updateCalendar("month");
  assert.equal(timers.size, 0);
  renderer.updateYearCalendar(snapshots["year-a"], {});
  assert.equal(firstSlot(), slots[0]);
  assert.equal(
    allocatedButtons,
    allocationsBeforeSwitch,
    "Switches and reversals allocate no day buttons",
  );
  const current = snapshots["year-a"];
  const days = current.months[0].days.slice();
  days[0] = {
    ...days[0],
    color: { background: "blue" },
    description: "updated",
    today: false,
  };
  renderer.updateYearCalendar({ ...current, months: [{ offset: 0, days }] });
  assert.equal(firstSlot().style["--year-heat-bg"], "blue");
  assert.equal(firstSlot().getAttribute("aria-label"), "updated");
  assert.equal(firstSlot().getAttribute("aria-current"), null);
}

async function verifyYearToolbar() {
  const nodes = new Map(),
    listeners = new Map();
  function element(id) {
    if (!nodes.has(id)) {
      const node = new Element();
      node.after = () => {};
      nodes.set(id, node);
    }
    return nodes.get(id);
  }
  let props,
    toolbarRenders = 0,
    requests = 0,
    modeChanges = 0;
  const app = {
    isDevelopmentEnabled: () => false,
    services: {
      assets: {
        script: async () => {
          requests++;
        },
      },
    },
    i18n: { t: (key) => key },
    ui: {
      workspaceViews: {
        YearDisplay(host, value) {
          toolbarRenders++;
          props = value;
        },
      },
    },
  };
  const document = {
    createElement: () => new Element(),
    addEventListener: (name, listener) => listeners.set(name, listener),
    dispatchEvent(event) {
      if (event.type === "worktime:yearviewchange") modeChanges++;
    },
  };
  vm.runInNewContext(read("assets/js/ui/agenda-entry.js"), {
    WorkTimeApp: app,
    AbortController,
    Event,
  });
  const model = {
    today: "2026-11-29",
    month: "2026-11",
    yearMode: false,
    yearViewMode: "heatmap",
  };
  const entry = app.ui.createAgendaEntry({
    model,
    element,
    document,
    window: { addEventListener() {} },
    actions: {
      requestSettingsExit: (fn) => fn(),
      finishCalendarNavigation() {},
    },
  });
  await entry.bind();
  const title = element("monthTitle");
  title.id = "monthTitle";
  listeners.get("click")({
    target: {
      closest: (selector) =>
        selector.split(",").includes("#monthTitle") ? title : null,
    },
  });
  model.yearMode = true;
  entry.renderToolbar();
  assert.equal(props.getValue(), "heatmap");
  const beforeSwitch = toolbarRenders;
  props.onChange("calendar");
  assert.equal(model.yearViewMode, "calendar");
  assert.equal(modeChanges, 1);
  assert.equal(
    toolbarRenders,
    beforeSwitch,
    "Mode change does not flush the toolbar root",
  );
  assert.equal(props.getValue(), "calendar");
  assert.equal(
    requests,
    0,
    "First year entry and detail switching do not load the agenda feature",
  );
  model.yearMode = false;
  entry.render();
  assert.equal(element("batchToggle").hidden, false);
}

async function verifyNavigation() {
  const nodes = new Map();
  const element = (id) => {
    if (!nodes.has(id)) nodes.set(id, new Element());
    return nodes.get(id);
  };
  const handles = [],
    preference = { matches: false };
  let autoFinish = false;
  const app = {
    ui: {
      createEventScope: () => ({
        handler(node, event, fn) {
          node[event] = fn;
        },
        listen(node, event, fn, capture) {
          if (node === element("calendar") && !capture) node[event] = fn;
        },
      }),
      animationCompat: {
        preference: () => preference,
        listen() {},
        animate(node, frames, options) {
          let finish;
          const finished = new Promise((resolve) => {
            finish = resolve;
          });
          const handle = {
            finished,
            cancel: () => finish(),
            finish,
            node,
            position: 0,
            progress() {
              return this.position;
            },
            options,
            frames,
          };
          handles.push(handle);
          if (autoFinish) Promise.resolve().then(finish);
          return handle;
        },
      },
      motion: {
        calendar: {
          analysisEnterDuration: 280,
          analysisLeaveDuration: 180,
          pageNavigationDuration: 520,
          pageNavigationEasing: "cubic-bezier(0.4, 0, 0.2, 1)",
        },
        stop() {},
        stopWithin() {},
        play() {},
      },
    },
  };
  const document = {
    hidden: false,
    querySelector: element,
    querySelectorAll: () => [],
  };
  const frames = new Map(),
    timers = new Map();
  let frameId = 0;
  const window = {
    setTimeout(fn) {
      timers.set(++frameId, fn);
      return frameId;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    requestAnimationFrame(fn) {
      frames.set(++frameId, fn);
      return frameId;
    },
    cancelAnimationFrame(id) {
      frames.delete(id);
    },
  };
  function paint() {
    const queued = [...frames.values()];
    frames.clear();
    for (const frame of queued) frame();
  }
  vm.runInNewContext(read("assets/js/controllers/navigation.js"), {
    WorkTimeApp: app,
    document,
    window,
  });
  let renders = 0,
    completed = 0;
  const model = { yearMode: false, batchMode: false };
  const committedYears = [],
    summaries = [],
    reports = [];
  const navigation = app.ui.createNavigationController({
    model,
    element,
    core: { validDate: (value) => !Number.isNaN(Date.parse(value)) },
    actions: {
      render() {
        assert.ok(
          !model.yearMode,
          "Year entry must skip the full workspace render",
        );
        renders++;
      },
      renderYearToolbar() {},
      renderCalendar() {
        assert.ok(model.yearMode);
        renders++;
      },
      closeImport() {},
      renderStats() {
        summaries.push(model.viewYear);
      },
      prepareYearEntry() {},
      renderYearNavigation({ deferDetails } = {}) {
        const year = model.viewYear;
        committedYears.push(year);
        grid.replaceChildren(month(year));
        if (deferDetails) return () => reports.push(year);
        reports.push(year);
      },
      prepareNeighboringYears() {},
    },
  });
  const entering = navigation.transitionPage({
    direction: 1,
    sidebarTransition: true,
    yearTitle: true,
    update() {
      model.yearMode = true;
    },
    onComplete() {
      completed++;
    },
  });
  assert.equal(model.yearMode, false);
  assert.equal(renders, 0);
  const leaving = handles.splice(0);
  assert.ok(
    leaving.length &&
      leaving.every(
        (h) => h.options.duration === 180 && h.options.easing === "ease-in",
      ),
  );
  assert.equal(leaving[0].frames.at(-1).transform, "translateY(-24px)");
  for (const handle of leaving) handle.finish();
  await new Promise(setImmediate);
  assert.equal(model.yearMode, true);
  assert.equal(renders, 1);
  assert.ok(handles.length && handles.every((h) => h.options.duration === 280));
  assert.equal(handles[0].frames[0].transform, "translateY(24px)");
  for (const handle of handles) handle.finish();
  await entering;
  assert.equal(completed, 1);
  assert.equal(element("panelContent").inert, false);
  assert.equal(element("monthTitle").dataset.yearTitleTarget, undefined);

  handles.length = 0;
  model.yearMode = false;
  autoFinish = true;
  const ordinary = navigation.transitionPage({
    direction: 1,
    update() {
      renders++;
    },
  });
  assert.equal(
    renders,
    1,
    "Other page transitions still wait for their exit animation",
  );
  assert.ok(handles.every((handle) => handle.options.duration === 180));
  await ordinary;
  assert.equal(renders, 3);
  autoFinish = false;
  handles.length = 0;
  const interrupted = navigation.transitionPage({
    direction: 1,
    yearTitle: true,
    update() {
      model.yearMode = true;
    },
  });
  assert.equal(renders, 3);
  navigation.finishCalendarNavigation();
  await interrupted;
  assert.equal(
    renders,
    4,
    "Interrupting an entry must not render the year twice",
  );
  assert.equal(element("panelContent").inert, false);
  preference.matches = true;
  handles.length = 0;
  await navigation.transitionPage({
    direction: 1,
    yearTitle: true,
    update() {
      model.yearMode = true;
    },
  });
  assert.equal(
    handles.length,
    0,
    "Reduced motion remains immediate and animation-free",
  );

  preference.matches = false;
  const grid = element("calendar");
  const month = (year) =>
    new Element("section", { "data-year-month": year + "-01" });
  grid.replaceChildren(month(2026));
  grid.animate = () => {};
  grid.cloneNode =
    grid.after =
    grid.getBoundingClientRect =
      () => {
        throw Error(
          "Year navigation must not clone, slide or measure the live grid",
        );
      };
  navigation.bind();
  model.month = "2026-11";
  model.viewYear = 2026;
  const nextYear = element("nextMonth").onclick;
  const previousYear = element("prevMonth").onclick;
  nextYear();
  assert.equal(model.viewYear, 2027);
  assert.deepEqual(committedYears, [], "Clicks coalesce before the next paint");
  paint();
  assert.deepEqual(
    committedYears,
    [2027],
    "Cold years commit on the first frame",
  );
  assert.equal(summaries.length, 0);
  nextYear();
  nextYear();
  previousYear();
  nextYear();
  assert.deepEqual(committedYears, [2027]);
  assert.equal(frames.size, 1);
  assert.equal(timers.size, 0);
  paint();
  assert.deepEqual(committedYears, [2027, 2029]);
  assert.equal(timers.size, 1);
  for (const finish of timers.values()) finish();
  assert.deepEqual(summaries, [2029]);
  assert.deepEqual(reports, [2029]);
  assert.equal(handles.length, 0, "Year steps have no page motion");
  assert.equal(model.month, "2029-11");

  const june = new Element("section", {
    class: "year-month",
    "data-year-month": "2029-06",
  });
  const date = new Element("button", { "data-year-date": "2029-06-09" });
  june.replaceChildren(date);
  grid.replaceChildren(june);
  grid.click({ target: date });
  assert.equal(model.month, "2029-06");
  assert.equal(model.returnMonth, model.month);
  assert.equal(model.yearMode, true);
  preference.matches = true;
  element("settingsPane").hidden = true;
  grid.querySelector = () => null;
  await grid.dblclick({ target: date });
  assert.equal(model.yearMode, false);
  assert.equal(model.selected, "2029-06-09");
}

(async () => {
  verifyDOMReuse();
  await verifyYearToolbar();
  await verifyNavigation();
  console.log(
    "Year switching: 180ms exit, 280ms entry, fixed 42-slot month grids, coalesced text fades, date-node reuse, invalidation, cleanup and reduced motion verified.",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
