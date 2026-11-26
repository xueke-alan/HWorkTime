"use strict";
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");
require("../../lib/browser-test-setup.cjs");

const url = pathToFileURL(path.resolve(__dirname, "../../../index.html"));

async function verifyMascotLayout(page) {
  await page.goto(url.href);
  await page.waitForFunction(
    () => document.documentElement.dataset.appState === "ready",
  );
  const cat = page.locator("button.calendar-mascot");
  const getCardLayout = () =>
    page.locator(".work-main").evaluate(async (card) => {
      await Promise.allSettled(
        card.getAnimations().map(({ finished }) => finished),
      );
      const { top, bottom, height } = card.getBoundingClientRect();
      return { top, bottomInset: window.innerHeight - bottom, height };
    });
  await cat.waitFor();
  const layout = await getCardLayout();
  assert.ok(Math.abs(layout.top - layout.bottomInset) < 1);
  assert.ok((await cat.boundingBox()).y >= 0);
  const sprite = cat.locator("img");
  await sprite.evaluate((image) => image.decode());
  await cat.click();
  assert.equal(await cat.getAttribute("data-raised"), "");
  assert.equal(
    await cat.evaluate((button) => getComputedStyle(button).backgroundColor),
    "rgba(0, 0, 0, 0)",
  );

  const settingsButton = page.locator("#pageSettingsOpen");
  await settingsButton.click();
  await page.locator("#settingsPersonalTab").click();
  const toggle = page.locator("#calendarMascotSwitch");
  const settingsLayout = await getCardLayout();
  await toggle.click();
  await cat.waitFor({ state: "detached" });
  assert.deepEqual(await getCardLayout(), settingsLayout);
  await toggle.click();
  await cat.waitFor();
  assert.deepEqual(await getCardLayout(), settingsLayout);
  await settingsButton.click();
  await page.locator("#settingsPane").waitFor({ state: "hidden" });

  for (const view of ["analysis", "calendar"]) {
    await page.locator(`.workspace-views [data-view="${view}"]`).click();
    await page.waitForFunction(
      (hidden) => document.getElementById("analysisPage").hidden === hidden,
      view !== "analysis",
    );
    assert.ok(await cat.isVisible());
    assert.deepEqual(await getCardLayout(), layout);
  }

  console.log(
    "Verified that mascot visibility preserves the workspace layout.",
  );
}

async function verifyDebouncedViews(page) {
  await page.goto(new URL("#dev", url).href);
  await page.waitForFunction(
    () => document.documentElement.dataset.appState === "ready",
  );
  await page.evaluate(() => WorkTimeApp.ui.selectWorkspaceView("calendar"));
  const views = page.locator(".workspace-views");
  const samples = await views.evaluate(async (control) => {
    const samples = [];
    for (const view of ["analysis", "agenda", "analysis"]) {
      control.querySelector(`[data-view="${view}"]`).closest("label").click();
      await new Promise((resolve) => setTimeout(resolve, 30));
      samples.push({
        selected: control
          .querySelector("input:checked")
          .closest("label")
          .querySelector("[data-view]").dataset.view,
        analysis: document.getElementById("analysisToggle").ariaPressed,
        agenda: document.getElementById("agendaMode").ariaPressed,
      });
    }
    return samples;
  });
  assert.deepEqual(
    samples.map(({ selected }) => selected),
    ["analysis", "agenda", "analysis"],
  );
  assert.ok(
    samples.every(
      ({ analysis, agenda }) => analysis === "false" && agenda === "false",
    ),
  );
  await page.waitForFunction(
    () => document.getElementById("analysisToggle").ariaPressed === "true",
  );
  console.log("Verified that rapid view clicks only commit the final choice.");
}

async function verifyAgendaAccess(page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "worktime.calendarView",
      JSON.stringify({ mode: "agenda", weeks: 0, analysis: false }),
    );
  });
  await page.goto(url.href);
  await page.waitForFunction(
    () => document.documentElement.dataset.appState === "ready",
  );
  const views = page.locator(".workspace-views");
  const agenda = views.locator('[data-view="agenda"]');
  const active = page.locator(".workspace.agenda-mode");
  await page.evaluate(async () => {
    document.getElementById("agendaMode").click();
    await WorkTimeApp.ui.selectWorkspaceView("agenda");
  });
  assert.equal(await active.count(), 0);
  assert.equal(await agenda.count(), 0);
  assert.ok(await page.locator("#agendaMode").isHidden());

  await page.evaluate(() => {
    localStorage.removeItem("worktime.calendarView");
    location.hash = "dev";
  });
  await agenda.click();
  await active.waitFor();
  await page.locator("#agendaNew").click();
  const title = page.locator("#agendaTitle");
  await title.fill("Retained draft");
  await page.evaluate(() => {
    location.hash = "";
  });
  await active.waitFor({ state: "detached" });
  await agenda.waitFor({ state: "detached" });
  assert.ok(
    await views.locator('label:has([data-view="calendar"]) input').isChecked(),
  );
  await page.evaluate(() => {
    location.hash = "dev";
  });
  await agenda.click();
  await active.waitFor();
  assert.equal(await title.inputValue(), "Retained draft");
  console.log(
    "Verified dev-only agenda access, saved view and draft retention.",
  );
}

async function verifyToolbarSegmented(control, count, labelPadding = "8px") {
  const hover = control.locator(
    "label:not(:has(input:checked)):has(input:enabled)",
  );
  await hover.first().hover();
  const appearance = await control.evaluate(async (root) => {
    await document.fonts.ready;
    await new Promise(requestAnimationFrame);
    await Promise.allSettled(
      root
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished),
    );
    const track = root.querySelector(".ant-segmented-group");
    const trackBounds = track.getBoundingClientRect();
    const items = [...track.querySelectorAll("label")];
    const labels = items.map((item) => item.getBoundingClientRect());
    const selected = track.querySelector("input:checked").closest("label");
    const painted = getComputedStyle(track, "::before");
    const [top, right = top, bottom = top, left = right] = painted.clipPath
      .split(" round")[0]
      .match(/[\d.]+(?=px)/g)
      .map(Number);
    const selectedBounds = selected.getBoundingClientRect();
    const hoverPaint = getComputedStyle(
      track.querySelector("label:hover"),
      "::after",
    );
    return {
      gaps: labels
        .slice(1)
        .map((label, index) => label.left - labels[index].right),
      labelPadding: items.map((item) => {
        const style = getComputedStyle(
          item.querySelector(".ant-segmented-item-label"),
        );
        return [style.paddingInlineStart, style.paddingInlineEnd];
      }),
      selectedInsets: [top, bottom],
      selectedAlignment: [
        left - (selectedBounds.left - trackBounds.left),
        right - (trackBounds.right - selectedBounds.right),
      ],
      hoverInsets: [
        hoverPaint.top,
        hoverPaint.bottom,
        hoverPaint.left,
        hoverPaint.right,
      ],
      hoverOpacity: hoverPaint.opacity,
      allVisible: labels.every(
        ({ left, right }) => left >= 0 && right <= innerWidth,
      ),
    };
  });
  assert.deepEqual(appearance.gaps, Array(count - 1).fill(4));
  assert.deepEqual(
    appearance.labelPadding,
    Array(count).fill([labelPadding, labelPadding]),
  );
  assert.deepEqual(appearance.selectedInsets, [4, 4]);
  assert.ok(
    appearance.selectedAlignment.every((offset) => Math.abs(offset) < 0.1),
  );
  assert.deepEqual(appearance.hoverInsets, ["4px", "4px", "0px", "0px"]);
  assert.equal(appearance.hoverOpacity, "1");
  assert.ok(appearance.allVisible, JSON.stringify(appearance));
}

async function verify(page) {
  await page.goto(new URL("#dev", url).href);
  await page.waitForFunction(
    () => document.documentElement.dataset.appState === "ready",
  );
  const views = page.locator(".workspace-views");
  await page.evaluate(() =>
    WorkTimeApp.services.preferences.page.saveTheme("blue"),
  );
  await page.waitForFunction(() => {
    const color = getComputedStyle(
      document.querySelector("#todayButton svg"),
    ).color;
    return (
      document.documentElement.dataset.theme === "blue" &&
      [
        ...document.querySelectorAll(
          ".workspace-views svg, .workspace-views [data-view]",
        ),
      ].every((child) => getComputedStyle(child).color === color)
    );
  });
  await verifyToolbarSegmented(views, 3);
  const appearance = await views.evaluate((group) => {
    const button = document.querySelector(".workspace-tool-buttons #restore");
    const border = (element) => {
      const style = getComputedStyle(element);
      return [style.borderTop, style.borderTopLeftRadius];
    };
    const items = [...group.querySelectorAll("label")];
    const selected = group.querySelector(".ant-segmented-item-selected");
    const middle = (element) => {
      const rect = element.getBoundingClientRect();
      return rect.top + rect.height / 2;
    };
    const today = document
      .getElementById("todayButton")
      .getBoundingClientRect();
    const views = group.getBoundingClientRect();
    const divider = document
      .querySelector(".workspace-view-divider")
      .getBoundingClientRect();
    const lineX = divider.left + divider.width / 2;
    const lineY = divider.top + divider.height / 2;
    return {
      sameRow: views.top < today.bottom,
      dividerVisible: divider.height > 0,
      dividerGaps: [lineX - today.right, views.left - lineX],
      dividerOffsets: [
        lineY - (today.top + today.height / 2),
        lineY - (views.top + views.height / 2),
      ],
      frame: border(group),
      activeBorder: getComputedStyle(selected, "::after").borderTopWidth,
      button: border(button),
      hitHeight: selected.getBoundingClientRect().height,
      groupHeight: group.getBoundingClientRect().height,
      inViewport: group.getBoundingClientRect().right <= window.innerWidth,
      fonts: items.map(
        (item) => getComputedStyle(item.querySelector("[data-view]")).fontSize,
      ),
      buttonHeight: button.getBoundingClientRect().height,
      selectedShadow: getComputedStyle(selected).boxShadow,
      offsets: items.map(
        (item) =>
          middle(item.querySelector("svg")) -
          middle(item.querySelector("[data-view]").parentElement),
      ),
    };
  });
  assert.equal(appearance.dividerVisible, appearance.sameRow);
  async function verifyDivider(selector) {
    const reference =
      selector === ".workspace-view-divider" ? "todayButton" : "restore";
    const divider = await page
      .locator(selector)
      .evaluate((element, buttonId) => {
        const line = getComputedStyle(element, "::before");
        const sidebarLine = getComputedStyle(
          document.querySelector(".summary-sidebar .oa-entry"),
          "::after",
        );
        const button = document.getElementById(buttonId);
        const buttonStyle = getComputedStyle(button);
        return {
          tag: element.tagName,
          thickness: line.width,
          height: parseFloat(line.height),
          buttonFaceHeight:
            button.getBoundingClientRect().height -
            parseFloat(buttonStyle.borderTopWidth) -
            parseFloat(buttonStyle.borderBottomWidth),
          matchesSidebar:
            line.backgroundColor === sidebarLine.backgroundColor &&
            line.borderRadius === sidebarLine.borderRadius &&
            line.width === sidebarLine.height,
        };
      }, reference);
    assert.equal(divider.tag, "SPAN");
    assert.equal(divider.thickness, "2px");
    assert.equal(divider.matchesSidebar, true);
    assert.ok(Math.abs(divider.height - divider.buttonFaceHeight * 0.6) < 0.1);
  }
  if (appearance.sameRow) {
    await verifyDivider(".workspace-view-divider");
    assert.ok(
      appearance.dividerGaps.every((gap) => Math.abs(gap - 12) <= 1),
      JSON.stringify(appearance),
    );
    assert.ok(
      appearance.dividerOffsets.every((offset) => Math.abs(offset) <= 1),
      JSON.stringify(appearance),
    );
  }
  assert.deepEqual(appearance.frame, appearance.button);
  assert.equal(appearance.activeBorder, "0px");
  assert.equal(appearance.groupHeight, appearance.buttonHeight);
  assert.equal(appearance.hitHeight, appearance.groupHeight - 2);
  assert.ok(appearance.inViewport);
  assert.deepEqual(appearance.fonts, ["14px", "14px", "14px"]);
  assert.equal(appearance.selectedShadow, "none");
  assert.ok(
    appearance.offsets.every((offset) => Math.abs(offset) <= 1),
    JSON.stringify(appearance),
  );
  const permanent = page.locator(".workspace-permanent-actions");
  const measureActions = () =>
    permanent.evaluate((node) => ({
      ...node.getBoundingClientRect().toJSON(),
      headerTop: node.closest(".workspace-header").getBoundingClientRect().top,
    }));
  const anchor = await measureActions();
  async function verifyActionGroups(view) {
    await page.waitForFunction(
      (visible) =>
        !!document.querySelector(".workspace-context-actions").getClientRects()
          .length === visible &&
        !document
          .querySelector(".workspace-tool-buttons")
          .getAnimations({ subtree: true })
          .some((animation) => animation.playState === "running"),
      view !== "analysis",
    );
    const bounds = await measureActions();
    const rowOffset = bounds.top - bounds.headerTop;
    const anchorOffset = anchor.top - anchor.headerTop;
    assert.ok(
      Math.abs(bounds.x - anchor.x) <= 1 &&
        (view === "agenda" || Math.abs(rowOffset - anchorOffset) <= 1),
      JSON.stringify({
        width: page.viewportSize().width,
        view,
        anchor,
        bounds,
      }),
    );
    if (view === "analysis") return;
    const action = await page
      .locator(view === "agenda" ? "#agendaViewToggle" : "#batchToggle")
      .boundingBox();
    const divider = await page
      .locator(".workspace-action-divider")
      .boundingBox();
    if (!divider) {
      assert.equal(view, "agenda");
      assert.ok(action.y + action.height <= bounds.y);
      return;
    }
    await verifyDivider(".workspace-action-divider");
    const center = divider.x + divider.width / 2;
    assert.ok(
      Math.abs(center - action.x - action.width - 12) <= 1,
      JSON.stringify({ view, action, divider, bounds }),
    );
    assert.ok(Math.abs(bounds.x - center - 12) <= 1);
    assert.ok(
      Math.abs(divider.y + divider.height / 2 - action.y - action.height / 2) <=
        1,
    );
  }
  await verifyActionGroups("calendar");

  // Exercise multiple intents during the first lazy load, before the page can commit.
  const immediate = await views.evaluate(async (group) => {
    const selected = [];
    for (const id of ["analysis", "agenda", "calendar"]) {
      group.querySelector(`[data-view="${id}"]`).closest("label").click();
      await Promise.resolve();
      selected.push(
        group
          .querySelector("input:checked")
          .closest("label")
          .querySelector("[data-view]").dataset.view,
      );
    }
    return selected;
  });
  assert.deepEqual(immediate, ["analysis", "agenda", "calendar"]);
  for (const view of ["agenda", "analysis", "calendar"]) {
    await views.locator(`[data-view="${view}"]`).click();
    await page.waitForFunction((view) => {
      const pressed = (id) =>
        document.getElementById(id)?.getAttribute("aria-pressed") === "true";
      return (
        pressed("analysisToggle") === (view === "analysis") &&
        pressed("agendaMode") === (view === "agenda")
      );
    }, view);
    await verifyActionGroups(view);
    if (view === "agenda") {
      const picker = page.locator("#agendaViewToggle");
      const toolbarWidth = await page
        .locator(".workspace-header-controls")
        .evaluate((toolbar) => {
          const style = getComputedStyle(toolbar);
          return (
            toolbar.clientWidth -
            parseFloat(style.paddingLeft) -
            parseFloat(style.paddingRight)
          );
        });
      await verifyToolbarSegmented(
        picker.locator(".toolbar-segmented"),
        4,
        toolbarWidth <= 460 ? "4px" : "8px",
      );
      assert.deepEqual(
        await picker.locator("[data-agenda-weeks]").allTextContents(),
        ["单周", "双周", "三周", "月视图"],
      );
      assert.equal(await picker.locator("label svg use").count(), 4);
      for (const weeks of [3, 1, 0, 2, 0]) {
        const label = picker.locator(
          `label:has([data-agenda-weeks="${weeks}"])`,
        );
        const box = await label.boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= page.viewportSize().width);
        await label.click();
        await page.waitForFunction(
          (weeks) =>
            document.getElementById("agendaViewToggle").dataset.agendaView ===
            String(weeks),
          weeks,
        );
        assert.ok(await label.getByRole("radio").isChecked());
        const count = await page
          .locator(
            weeks
              ? "#calendar > .day[data-agenda-week]"
              : "#calendar .day[data-date]",
          )
          .count();
        assert.ok(
          weeks ? count === weeks * 7 : count >= 28,
          JSON.stringify({ weeks, count }),
        );
      }
    }
  }
  if (page.viewportSize().width === 1440) await verifyInterruptedSlide(views);
  await page.waitForFunction(
    () => !document.getElementById("panelContent").inert,
  );
  await page.locator("#monthTitle").click();
  const year = page.locator("#yearViewToggle .toolbar-segmented");
  await verifyToolbarSegmented(year, 2);
  await verifyDivider(".workspace-action-divider");
  await page.waitForFunction(
    () => !document.getElementById("panelContent").inert,
  );
  const heatmap = year.getByRole("radio", { name: "热力图" });
  const yearlyCalendar = year.getByRole("radio", { name: "年历" });
  assert.ok(await heatmap.isChecked());
  await heatmap.press("ArrowRight");
  await yearlyCalendar
    .and(year.locator("input:checked"))
    .waitFor({ state: "attached" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() =>
    WorkTimeApp.services.preferences.page.saveMotionMode("system"),
  );
  await page.waitForFunction(
    () => document.documentElement.dataset.reducedMotion === "true",
  );
  const duration = await year
    .locator(".ant-segmented-group")
    .evaluate(
      (track) => getComputedStyle(track, "::before").transitionDuration,
    );
  assert.equal(duration, "0s");
}

async function verifyInterruptedSlide(views) {
  const result = await views.evaluate(async (control) => {
    const track = control.querySelector(".ant-segmented-group");
    const item = (view) =>
      control.querySelector(`[data-view="${view}"]`).closest("label");
    const frame = () => new Promise(requestAnimationFrame);
    function bounds() {
      const style = getComputedStyle(track, "::before");
      const insets = style.clipPath
        .split(" round")[0]
        .match(/[\d.]+(?=px)/g)
        .map(Number);
      const [top, right = top, bottom = top, left = right] = insets;
      return {
        left,
        width: track.clientWidth - left - right,
        top,
        bottom,
        opacity: style.opacity,
      };
    }
    await Promise.allSettled(
      track
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished),
    );
    const start = bounds();
    const target =
      item("analysis").getBoundingClientRect().left -
      track.getBoundingClientRect().left;
    item("analysis").click();
    const samples = [];
    const deadline = performance.now() + 1500;
    while (performance.now() < deadline) {
      await frame();
      const sample = bounds();
      samples.push(sample);
      if (sample.left > start.left + 1) break;
    }
    const turn = bounds();
    item("calendar").click();
    await Promise.resolve();
    const redirected = bounds();
    const end = performance.now() + 300;
    do {
      await frame();
      samples.push(bounds());
    } while (performance.now() < end);
    return { start, target, turn, redirected, samples, finish: bounds() };
  });
  const { start, target, turn, redirected, samples, finish } = result;
  assert.ok(
    turn.left > start.left && turn.left < target,
    JSON.stringify(result),
  );
  assert.ok(Math.abs(redirected.left - turn.left) < 1);
  assert.ok(Math.abs(redirected.width - turn.width) < 1);
  assert.ok(
    samples.every(
      (s) =>
        s.width >= start.width - 1 &&
        s.top === 4 &&
        s.bottom === 4 &&
        s.opacity === "1",
    ),
  );
  assert.deepEqual(finish, start);
}
async function main() {
  const browser = await chromium.launch({ channel: "msedge" });
  try {
    const mascot = await browser.newContext({
      locale: "zh-CN",
      viewport: { width: 1440, height: 900 },
    });
    await verifyMascotLayout(await mascot.newPage());
    await mascot.close();
    const access = await browser.newContext({
      locale: "zh-CN",
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    await verifyAgendaAccess(await access.newPage());
    await access.close();
    const rapidClicks = await browser.newContext({ reducedMotion: "reduce" });
    await verifyDebouncedViews(await rapidClicks.newPage());
    await rapidClicks.close();
    for (const width of [1440, 1152, 390, 320]) {
      const context = await browser.newContext({
        locale: "zh-CN",
        viewport: { width, height: 900 },
      });
      await verify(await context.newPage());
      await context.close();
    }
    console.log(
      "Verified shared toolbar segmented styling, keyboard selection and motion at desktop and mobile widths.",
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
