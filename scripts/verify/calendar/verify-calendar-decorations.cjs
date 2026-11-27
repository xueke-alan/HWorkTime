"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const postcss = require("postcss");
const root = path.resolve(__dirname, "../../..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
assert(!fs.existsSync(path.join(root, "assets/js/ui/agenda-edges.js")));
assert(!read("scripts/site/prepare-assets.cjs").includes('"agenda-edges"'));
assert(!/createAgendaEdges|dateEdges\./.test(read("assets/js/ui/agenda.js")));

class Node {
  className = "";
  children = [];
  parentElement = null;
  attributes = new Map();
  listeners = new Map();
  classList = {
    add: (name) => {
      this.className += " " + name;
    },
    remove: (name) => {
      this.className = this.className
        .split(" ")
        .filter((value) => value !== name)
        .join(" ");
    },
    contains: (name) => this.className.split(" ").includes(name),
  };
  setAttribute(name, value) {
    this.attributes.set(name, value);
  }
  append(node) {
    node.parentElement = this;
    this.children.push(node);
  }
  remove() {
    if (this.parentElement)
      this.parentElement.children = this.parentElement.children.filter(
        (node) => node !== this,
      );
    this.parentElement = null;
  }
  addEventListener(name, callback) {
    this.listeners.set(name, callback);
  }
  getBoundingClientRect() {
    assert.fail("Decorations must not measure positions");
  }
  getAnimations() {
    assert.fail("Highlighting must not sample native animation timing");
  }
}
const card = new Node(),
  calendar = new Node();
calendar.append(card);
let available = true;
calendar.querySelector = () => (available ? card : null);
const timers = new Map();
let timerId = 0;
const preference = { matches: false };
const app = {
  ui: {
    createEventScope: () => ({ dispose() {} }),
    animationCompat: {
      preference: () => preference,
      animate() {
        assert.fail("CSS owns the highlight animation");
      },
    },
    motion: { calendar: {} },
  },
};
const document = {
  hidden: false,
  createElement(tag) {
    assert.equal(tag, "span");
    return new Node();
  },
};
const context = vm.createContext({
  WorkTimeApp: app,
  document,
  window: {
    setTimeout(callback, delay) {
      const id = ++timerId;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
  },
  requestAnimationFrame() {
    assert.fail("Highlighting must not schedule tracking frames");
  },
  getComputedStyle() {
    assert.fail("Highlighting must not sample live styles");
  },
  MutationObserver: class {
    constructor() {
      assert.fail("Decorations must not observe DOM mutations");
    }
  },
  ResizeObserver: class {
    constructor() {
      assert.fail("Decorations must not observe layout sizes");
    }
  },
});
const navigationSource = read("assets/js/controllers/navigation.js");
assert(
  !/todayGlowFrame|todayGlows|todayEffects|calendar-today-glow/.test(
    navigationSource,
  ),
);
vm.runInContext(navigationSource, context);
const controller = app.ui.createNavigationController({
  model: { today: "2026-11-28" },
  actions: {},
  element: () => calendar,
});
controller.highlightToday();
assert.equal(card.children.length, 1);
assert.equal(timers.size, 1);
const first = card.children[0];
assert.equal(first.className, "calendar-today-attention");
assert.equal(first.attributes.get("aria-hidden"), "true");
const staleEnd = first.listeners.get("animationend");
controller.highlightToday();
assert.equal(
  card.children.length,
  1,
  "Repeating today replaces the local effect",
);
assert.equal(
  timers.size,
  1,
  "Repeating today cancels the previous cleanup timer",
);
const second = card.children[0];
assert.notEqual(first, second);
staleEnd();
assert.equal(
  card.children[0],
  second,
  "An obsolete animation event cannot remove a new highlight",
);
second.listeners.get("animationend")();
assert.equal(card.children.length, 0);
assert.equal(timers.size, 0);

preference.matches = true;
controller.highlightToday();
assert(card.children[0].classList.contains("is-static"));
const fallback = [...timers.values()][0];
assert.equal(fallback.delay, 900);
fallback.callback();
assert.equal(card.children.length, 0, "A disabled animation still cleans up");
assert.equal(timers.size, 0);
preference.matches = false;
controller.highlightToday();
document.hidden = true;
controller.highlightToday();
assert.equal(card.children.length, 0);
assert.equal(timers.size, 0);
document.hidden = false;
available = false;
controller.highlightToday();
assert.equal(
  timers.size,
  0,
  "A missing date creates no tracking or cleanup work",
);
available = true;
controller.highlightToday();
controller.finishCalendarNavigation();
assert.equal(card.children.length, 0);
assert.equal(timers.size, 0);
controller.highlightToday();
controller.dispose();
assert.equal(card.children.length, 0);
assert.equal(timers.size, 0);

const css = postcss.parse(read("assets/css/calendar.css"));
function value(selector, property) {
  let found;
  css.walkRules(selector, (rule) =>
    rule.walkDecls(property, (declaration) => {
      found = declaration.value;
    }),
  );
  return found;
}
const effect = ".calendar .day > .calendar-today-attention";
assert.equal(value(effect, "position"), "absolute");
assert.equal(value(effect, "inset"), "0");
assert.equal(value(effect, "pointer-events"), "none");
assert(value(effect, "box-shadow").startsWith("inset "));
assert.equal(
  value(effect, "animation"),
  "calendar-today-attention 800ms ease-out",
);
assert.equal(value(effect + ".is-static", "animation"), "none");
assert.equal(
  value(".calendar-navigation-copy .calendar-today-attention", "display"),
  "none",
);
assert(
  value(".day", "border").includes("solid"),
  "Native date borders remain CSS-owned",
);
let keyframes = 0;
css.walkAtRules("keyframes", (rule) => {
  if (rule.params !== "calendar-today-attention") return;
  keyframes++;
  rule.walkDecls((declaration) => assert.equal(declaration.prop, "opacity"));
});
assert.equal(keyframes, 1);
assert(!/agenda-date-edge/.test(read("assets/css/agenda-details.css")));
console.log(
  "Native CSS date borders and local opacity highlighting verified with geometry, style sampling, observers and tracking frames forbidden; restart, fallback, visibility and disposal cleanup passed.",
);
