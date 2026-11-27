"use strict";

// Exercise the real navigation controller with measured DOM fixtures, without
// starting a browser. In particular, interrupted travel must release snapshots.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const postcss = require("postcss");
const root = path.resolve(__dirname, "../../..");
const contentSelector =
  ":scope > .daytime, :scope > .dayhours, :scope > .day-footer, .date-markers";

class Element {
  constructor(className = "", top = 0, height = 20) {
    this.className = className;
    this.rect = { left: 0, top, width: 140, height, bottom: top + height };
    this.children = [];
    this.dataset = {};
    this.attributes = new Map();
    this.style = { setProperty: (key, value) => (this.style[key] = value) };
    this.classList = {
      contains: (name) => this.className.split(" ").includes(name),
      add: (name) => (this.className += " " + name),
      remove: (name) =>
        (this.className = this.className
          .split(" ")
          .filter((item) => item !== name)
          .join(" ")),
    };
    this.clientLeft = this.clientTop = 1;
  }
  getBoundingClientRect() {
    return this.rect;
  }
  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }
  setAttribute(name, value) {
    this.attributes.set(name, value);
  }
  removeAttribute(name) {
    this.attributes.delete(name);
  }
  animate() {}
  closest() {
    return null;
  }
  all() {
    return this.children.flatMap((child) => [child, ...child.all()]);
  }
  querySelectorAll(selector) {
    if (selector === "*") return this.all();
    if (selector === "[id]")
      return this.all().filter((node) => node.attributes.has("id"));
    if (selector === ":scope > .day")
      return this.children.filter((node) => node.classList.contains("day"));
    if (selector === contentSelector)
      return this.children.filter((node) =>
        ["daytime", "dayhours", "day-footer"].includes(node.className),
      );
    if (
      selector ===
      ":scope > .calendar-weather-icon, :scope > .calendar-weather-outgoing"
    )
      return this.children.filter((node) =>
        ["calendar-weather-icon", "calendar-weather-outgoing"].includes(
          node.className,
        ),
      );
    if (selector === ".daynum small")
      return this.all().filter((node) => node.className === "small");
    if (/^\.[\w-]+$/.test(selector))
      return this.all().filter((node) =>
        node.classList.contains(selector.slice(1)),
      );
    return [];
  }
  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
  append(...nodes) {
    for (const node of nodes) {
      node.remove();
      node.parentElement = this;
      this.children.push(node);
    }
  }
  after(node) {
    const parent = this.parentElement;
    node.remove();
    parent.children.splice(parent.children.indexOf(this) + 1, 0, node);
    node.parentElement = parent;
  }
  before(node) {
    const parent = this.parentElement;
    node.remove();
    parent.children.splice(parent.children.indexOf(this), 0, node);
    node.parentElement = parent;
  }
  replaceWith(node) {
    this.before(node);
    this.remove();
  }
  remove() {
    const parent = this.parentElement;
    if (parent) parent.children.splice(parent.children.indexOf(this), 1);
    this.parentElement = null;
  }
  cloneNode(deep = false) {
    const clone = new Element(this.className, this.rect.top, this.rect.height);
    clone.dataset = { ...this.dataset };
    clone.textContent = this.textContent;
    clone.attributes = new Map(this.attributes);
    if (deep)
      clone.append(...this.children.map((child) => child.cloneNode(true)));
    return clone;
  }
}
function day(date, adjacent, top, height = 100) {
  const card = new Element("day" + (adjacent ? " adjacent" : ""), top, height);
  card.dataset[adjacent ? "previewDate" : "date"] = date;
  const number = new Element("daynum");
  if (adjacent) {
    const suffix = new Element("small");
    suffix.textContent = "11月";
    number.append(suffix);
  }
  card.append(number);
  for (const [index, name] of ["daytime", "dayhours", "day-footer"].entries()) {
    if (adjacent && index > 0) continue;
    const field = new Element(
      name,
      name === "day-footer" ? top + height - 27 : top + 25 + index * 24,
    );
    field.textContent = adjacent
      ? "十三"
      : ["08:00 – 17:30", "8.00 h", "加班"][index];
    field.setAttribute("id", "source-" + name);
    card.append(field);
  }
  return card;
}
function fixture() {
  const host = new Element();
  const calendar = new Element("calendar", 0, 600);
  host.append(calendar);
  const preference = { matches: false };
  const batches = [];
  const app = {
    ui: {
      createEventScope: () => ({}),
      animationCompat: { preference: () => preference },
      motion: {
        calendar: {
          pageNavigationDuration: 420,
          pageNavigationEasing: "ease",
        },
        stop() {},
        stopWithin() {},
        animateCalendar(plans) {
          const handles = plans.map(() => {
            let resolve;
            const finished = new Promise((done) => (resolve = done));
            return { finished, cancel: resolve };
          });
          batches.push({ plans, handles });
          return handles;
        },
      },
    },
  };
  const document = { hidden: false, createElement: () => new Element() };
  vm.runInNewContext(
    fs.readFileSync(
      path.join(root, "assets/js/controllers/navigation.js"),
      "utf8",
    ),
    {
      WorkTimeApp: app,
      document,
      getComputedStyle: (node) => {
        const opacity = node.classList.contains("adjacent") ? "0.4" : "1";
        return {
          opacity,
          borderBottomWidth: "1px",
          [Symbol.iterator]: function* () {
            yield "color";
          },
          getPropertyValue: () => "rgb(30, 40, 50)",
        };
      },
    },
  );
  const controller = app.ui.createNavigationController({
    model: {},
    actions: { closeImport() {} },
    element: () => calendar,
  });
  function render(cards) {
    for (const child of [...calendar.children]) child.remove();
    calendar.append(...cards);
  }
  return { host, calendar, preference, batches, document, controller, render };
}
function verifyOverlayPosition() {
  const css = postcss.parse(
    fs.readFileSync(path.join(root, "assets/css/calendar.css"), "utf8"),
  );
  // This selector must outrank .day[data-holiday] > div and .day.full-leave > div.
  let position;
  css.walkRules(".calendar .day > .calendar-day-content-outgoing", (rule) => {
    rule.walkDecls("position", ({ value }) => (position = value));
  });
  assert.equal(
    position,
    "absolute",
    "The outgoing layer stays out of date-card layout",
  );
}

async function verify() {
  verifyOverlayPosition();
  for (const direction of [1, -1]) {
    const f = fixture();
    const entering = direction === 1;
    const previous = day("2016-11-01", entering, entering ? 500 : 0);
    const weather = new Element(
      "calendar-weather-icon",
      previous.rect.bottom - 36,
    );
    const previousWeatherTop = weather.rect.top;
    previous.append(weather);
    f.render([day("2016-10-31", false, entering ? 400 : 100), previous]);
    const target = day("2016-11-01", !entering, entering ? 0 : 500, 140);
    const sharedOffset = entering ? 500 : -540;
    let completed = 0;
    f.controller.animateCalendarNavigation(
      direction,
      () => {
        assert.equal(f.calendar.dataset.calendarTravel, "month");
        weather.rect = { ...weather.rect, top: target.rect.bottom - 36 };
        target.append(weather);
        f.render([target, day("2016-11-02", false, entering ? 100 : 400)]);
      },
      () => completed++,
    );
    assert.equal(f.calendar.dataset.calendarTravel, undefined);
    const { plans, handles } = f.batches[0];
    assert.equal(
      plans[0].frames[1].transform,
      "translateY(" + -sharedOffset + "px)",
    );
    assert.equal(
      plans[1].frames[0].transform,
      "translateY(" + sharedOffset + "px)",
    );
    assert.ok(plans[0].element.style.clipPath.startsWith("inset("));

    const weatherPlan = plans.find((plan) => plan.element === weather);
    assert.equal(
      weather.parentElement,
      target,
      "The retained date keeps its weather image",
    );
    if (entering) {
      assert.ok(
        weatherPlan,
        "A taller forward row needs a weather position correction",
      );
      const [from, to] = weatherPlan.frames;
      assert.equal(from.translate, "0px -40px");
      assert.equal(to.translate, "0px 0px");
      assert.equal(
        weather.rect.top +
          sharedOffset +
          parseFloat(from.translate.split(" ")[1]),
        previousWeatherTop,
        "Weather starts at its previous visible position",
      );
      assert.ok(!("opacity" in from), "Weather owns its own fades");
      assert.equal(weatherPlan.options, plans[1].options);
    } else {
      assert.equal(weather.rect.top + sharedOffset, previousWeatherTop);
      assert.equal(
        weatherPlan,
        undefined,
        "Bottom-aligned weather already starts in place",
      );
    }

    const outgoing = target.querySelector(".calendar-day-content-outgoing");
    assert.ok(outgoing, "Retained dates crossfade in both directions");
    assert.equal(outgoing.getAttribute("aria-hidden"), "true");
    assert.equal(outgoing.inert, true);
    assert.equal(outgoing.querySelectorAll("[id]").length, 0);
    if (entering) {
      assert.equal(outgoing.children[0].style.top, "24px");
      assert.equal(outgoing.children[0].style.bottom, "auto");
    } else {
      const footer = outgoing.querySelector(".day-footer");
      assert.equal(footer.style.top, "auto");
      assert.equal(footer.style.bottom, "6px");
      const displayedBottom =
        target.getBoundingClientRect().bottom +
        sharedOffset -
        1 -
        parseFloat(footer.style.bottom);
      assert.equal(
        displayedBottom,
        previous.querySelector(".day-footer").getBoundingClientRect().bottom,
        "The outgoing tag starts at the old visible position across unequal row heights",
      );
    }
    assert.equal(outgoing.children[0].style.color, "rgb(30, 40, 50)");
    assert.equal(outgoing.children.length, entering ? 1 : 3);
    for (const field of target.querySelectorAll(contentSelector)) {
      const plan = plans.find((plan) => plan.element === field);
      assert.equal(plan.frames[0].opacity, 0);
      assert.equal(Number(plan.frames[1].opacity), 1);
      assert.equal(plan.options.duration, plans[0].options.duration);
      assert.ok(
        plan.frames.every((frame) => Object.keys(frame).length === 1),
        "Incoming rows only fade; layout motion belongs to the calendar slide",
      );
    }
    // Finishing normally and interrupting before completion share cleanup.
    if (entering) {
      handles.forEach((handle) => handle.cancel());
      await new Promise(setImmediate);
    } else {
      f.controller.animateCalendarNavigation(1, () => f.render([]));
      f.controller.finishCalendarNavigation();
      await new Promise(setImmediate);
    }
    assert.equal(outgoing.parentElement, null);
    assert.equal(target.querySelector(".calendar-month-suffix-outgoing"), null);
    assert.equal(f.host.children[0], f.calendar);
    assert.equal(completed, 1);
  }
  for (const direction of [1, -1]) {
    const f = fixture();
    f.render([day("2016-10-01", false, 100)]);
    f.controller.animateCalendarNavigation(direction, () =>
      f.render([day("2016-11-01", false, 100)]),
    );
    const { plans } = f.batches[0];
    assert.equal(plans.length, 2);
    assert.equal(
      plans[0].frames[1].transform,
      "translateY(" + -direction * 600 + "px)",
    );
    assert.equal(
      plans[1].frames[0].transform,
      "translateY(" + direction * 600 + "px)",
    );
    assert.ok(plans.every((plan) => plan.options.duration === 420));
    f.controller.finishCalendarNavigation();
    assert.equal(f.host.children[0], f.calendar);
  }
  for (const disabled of ["reduced", "hidden", "unavailable", "no-overlap"]) {
    const f = fixture();
    f.render([day("2016-11-01", true, 500)]);
    if (disabled === "reduced") f.preference.matches = true;
    if (disabled === "hidden") f.document.hidden = true;
    if (disabled === "unavailable") f.calendar.animate = undefined;
    const target = day(
      disabled === "no-overlap" ? "2017-01-01" : "2016-11-01",
      false,
      0,
    );
    f.controller.animateCalendarNavigation(1, () => f.render([target]));
    assert.equal(target.querySelector(".calendar-day-content-outgoing"), null);
    f.controller.finishCalendarNavigation();
  }
  console.log(
    "Vertical month slides, stable weather and tag positions, fallback and interruption verified without a browser.",
  );
}
verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
