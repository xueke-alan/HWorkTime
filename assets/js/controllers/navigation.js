"use strict";
/** navigation controller. Instantiate once, then bind after all actions are connected. */
WorkTimeApp.ui.createNavigationController = function (options) {
  const events = WorkTimeApp.ui.createEventScope();
  const { core: C, model, actions, element: $, clock, application } = options;
  const animationCompat = WorkTimeApp.ui.animationCompat;
  const calendarMotion = WorkTimeApp.ui.motion.calendar;
  const reducedMotion = animationCompat.preference();
  let todayAttention = null,
    todayAttentionTimer = null,
    pageTransition = null,
    monthAnimations = [],
    monthTransition = null,
    yearDrawFrame = null,
    yearDetailsTimer = null,
    yearDirection = 1,
    unlistenMotion,
    resettingBatch = false;
  let batchSweep = null,
    suppressBatchClick = false;

  function stopBatchSweep() {
    batchSweep = null;
    $("calendar").classList.remove("is-batch-sweeping");
  }

  function sweepBatchDate(card) {
    const date = card?.dataset.date;
    if (
      !batchSweep ||
      !date ||
      date.slice(0, 7) !== model.month ||
      !C.canBatchEditDate(model.state, date) ||
      batchSweep.visited.has(date)
    )
      return;
    batchSweep.visited.add(date);
    const selected = model.batchDays.has(date);
    if (selected === batchSweep.select) return;
    if (batchSweep.select) model.batchDays.add(date);
    else model.batchDays.delete(date);
    refreshBatchPreview();
  }

  function stopTodayAttention() {
    if (todayAttentionTimer !== null) window.clearTimeout(todayAttentionTimer);
    todayAttentionTimer = null;
    todayAttention?.remove();
    todayAttention = null;
  }

  function commitPageTransition(transition) {
    if (transition.committed) return;
    transition.committed = true;
    const wasYearMode = model.yearMode;
    transition.update();
    if (transition.yearTitle === true && model.yearMode) {
      // Entering the year keeps the same selected month and records. The
      // summary, hidden day form and agenda do not need a workspace render.
      actions.renderYearToolbar();
      actions.renderCalendar();
    } else actions.render();
    if (transition.sidebarTransition) actions.closeImport();
    if (wasYearMode !== model.yearMode && $("settingsPane").hidden) {
      const content = document.querySelector(".editor .editor-content");
      WorkTimeApp.ui.motion?.stop(content);
      WorkTimeApp.ui.motion?.play(
        content,
        model.yearMode ? "motion-sidebar-forward" : "motion-sidebar-back",
      );
    }
    transition.afterRender?.();
    // Page transitions own the entire content surface; suppress nested reveals.
    WorkTimeApp.ui.motion?.stopWithin($("panelContent"));
  }

  function stopPageTransition(settle = true) {
    stopMonthTransition();
    const transition = pageTransition;
    if (!transition) return;
    pageTransition = null;
    for (const animation of transition.animations) animation.cancel();
    try {
      if (settle) commitPageTransition(transition);
    } finally {
      if (transition.yearTitle !== undefined)
        delete $("monthTitle").dataset.yearTitleTarget;
      for (const [element, inert] of transition.elements) element.inert = inert;
      if (settle) transition.onComplete?.();
    }
  }

  async function transitionPage({
    direction,
    update,
    afterRender,
    onComplete,
    sidebarTransition = false,
    yearTitle,
  }) {
    if (resettingBatch || model.batchMode || pageTransition) return;
    if (!sidebarTransition && !model.yearMode) actions.closeImport();
    stopMonthTransition();
    stopTodayAttention();
    const transition = {
      direction,
      update,
      afterRender,
      onComplete,
      yearTitle,
      committed: false,
      animations: [],
      elements: new Map(),
      sidebarTransition: sidebarTransition || model.yearMode,
      summaryTransition:
        (sidebarTransition || model.yearMode) &&
        document
          .querySelector(".summary-sidebar")
          .classList.contains("is-oa-open"),
    };
    pageTransition = transition;
    const play = (entering) => {
      const distance = -24 * transition.direction,
        offset = entering ? -distance : distance,
        shifted = {
          opacity: 0,
          transform: `translateY(${offset}px)`,
        },
        resting = { opacity: 1, transform: "none" };
      const content = $("panelContent"),
        elements = [
          content,
          $("calendarFoot"),
          $("yearLegend"),
          ...(transition.summaryTransition
            ? [
                ...document.querySelectorAll(
                  ".summary-sidebar > :is(.cards, .target-panel, .sidebar-oa-workspace)",
                ),
              ].filter((element) => element.getClientRects().length)
            : []),
          ...(transition.sidebarTransition
            ? []
            : [
                ...document.querySelectorAll(
                  "#dayForm, #analysisSidebar > .analysis-sidebar-section, #agendaDayDetails, #agendaEditor .agenda-editor-body",
                ),
              ].filter(
                (element) =>
                  element.getClientRects().length &&
                  getComputedStyle(element).display !== "none",
              )),
        ];
      transition.animations = elements.map((element) => {
        if (!transition.elements.has(element))
          transition.elements.set(element, element.inert);
        element.inert = true;
        WorkTimeApp.ui.motion?.stop(element);
        const sidebar = element.closest(".editor");
        const frames = sidebar
          ? [{ opacity: 0, transform: `translateY(${offset / 3}px)` }, resting]
          : element === content
            ? [shifted, resting]
            : [{ opacity: 0 }, { opacity: 1 }];
        return animationCompat.animate(
          element,
          entering ? frames : frames.toReversed(),
          {
            duration: entering
              ? calendarMotion.analysisEnterDuration
              : calendarMotion.analysisLeaveDuration,
            easing: entering ? calendarMotion.easing : "ease-in",
            fill: "both",
          },
        );
      });
      return Promise.all(
        transition.animations.map((animation) => animation.finished),
      );
    };
    try {
      if (reducedMotion.matches || document.hidden) {
        commitPageTransition(transition);
        return;
      }
      if (yearTitle !== undefined)
        $("monthTitle").dataset.yearTitleTarget = String(yearTitle);
      await play(false);
      if (pageTransition !== transition) return;
      commitPageTransition(transition);
      await play(true);
    } finally {
      if (pageTransition === transition) stopPageTransition();
    }
  }
  let analysisStyleRequest = 0,
    pendingAnalysis = null;
  async function transitionAnalysis(
    target,
    beforeRender = null,
    afterRender = null,
    { focusAttendance = false } = {},
  ) {
    const request = ++analysisStyleRequest;
    pendingAnalysis = target;
    if (target) {
      try {
        await WorkTimeApp.services.assets.style("assets/css/analysis.css");
      } catch (error) {
        if (request === analysisStyleRequest && bound) {
          pendingAnalysis = null;
          window.alert(WorkTimeApp.i18n.message(error.message));
        }
        return;
      }
    }
    if (request !== analysisStyleRequest || !bound) return;
    pendingAnalysis = null;
    return transitionPage({
      direction: target ? 1 : -1,
      update() {
        if (model.yearMode) {
          model.month = model.returnMonth;
          model.yearMode = false;
        }
        model.analysisMode = target;
        if (!target) {
          if (focusAttendance)
            model.selected = model.calendarSelected =
              WorkTimeApp.domain.calendar.attendanceFocusDate(
                model.month,
                clock.today(),
                model.state.days,
              );
          else model.calendarSelected = null;
        }
        beforeRender?.();
      },
      afterRender,
    });
  }
  function toggleAnalysis() {
    const target = !(pendingAnalysis ?? model.analysisMode);
    return transitionAnalysis(target, null, null, {
      focusAttendance: !target,
    });
  }
  function highlightToday() {
    stopTodayAttention();
    const card = $("calendar").querySelector(
      ".day[data-date=" + JSON.stringify(model.today) + "]",
    );
    if (!card || document.hidden) return;
    // A fresh child restarts the CSS effect without a layout flush or tracking frame.
    const attention = document.createElement("span");
    attention.className = "calendar-today-attention";
    attention.setAttribute("aria-hidden", "true");
    if (reducedMotion.matches) attention.classList.add("is-static");
    todayAttention = attention;
    card.append(attention);
    const finish = () => {
      if (todayAttention === attention) stopTodayAttention();
    };
    attention.addEventListener("animationend", finish, { once: true });
    // Also clean up when animations are disabled or the node leaves the document.
    todayAttentionTimer = window.setTimeout(finish, 900);
  }

  function stopMonthTransition() {
    const transition = monthTransition;
    monthTransition = null;
    for (const animation of monthAnimations) animation.cancel();
    monthAnimations = [];
    if (!transition) return;
    if (transition.copy) {
      transition.copy.remove();
      transition.onComplete();
      return;
    }
    const { element, viewport, style, suffixes, outgoingContents } = transition;
    for (const content of outgoingContents) content.remove();
    for (const suffix of suffixes) {
      suffix.parentElement?.classList.remove("calendar-month-suffix-host");
      suffix.remove();
    }
    viewport.replaceWith(element);
    if (style === null) element.removeAttribute("style");
    else element.setAttribute("style", style);
    transition.onComplete?.();
  }

  const monthContentSelector =
    ":scope > .daytime, :scope > .dayhours, :scope > .day-footer, .date-markers";
  const monthWeatherSelector =
    ":scope > .calendar-weather-icon, :scope > .calendar-weather-outgoing";
  function snapshotMonthContent(card, target, edge) {
    const bounds = card.getBoundingClientRect();
    const fromBottom = edge === "bottom";
    const border = fromBottom
      ? parseFloat(getComputedStyle(target).borderBottomWidth) || 0
      : target.clientTop;
    const outgoing = document.createElement("div");
    outgoing.className = "calendar-day-content-outgoing";
    outgoing.setAttribute("aria-hidden", "true");
    outgoing.inert = true;
    for (const field of card.querySelectorAll(monthContentSelector)) {
      const rect = field.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;
      const clone = field.cloneNode(true);
      const originals = [field, ...field.querySelectorAll("*")];
      const copies = [clone, ...clone.querySelectorAll("*")];
      // Freeze the old page's ink and layout before moving it into a card with
      // different adjacent-day styles and possibly a different row height.
      originals.forEach((original, index) => {
        const computed = getComputedStyle(original),
          copy = copies[index];
        copy.removeAttribute("id");
        for (const property of computed)
          copy.style.setProperty(property, computed.getPropertyValue(property));
        copy.style.animation = "none";
        copy.style.transition = "none";
      });
      Object.assign(clone.style, {
        position: "absolute",
        left: rect.left - bounds.left - target.clientLeft + "px",
        top: fromBottom ? "auto" : rect.top - bounds.top - border + "px",
        right: "auto",
        bottom: fromBottom
          ? bounds.bottom - rect.bottom - border + "px"
          : "auto",
        width: rect.width + "px",
        height: rect.height + "px",
        margin: "0",
        transform: "none",
        translate: "none",
        boxSizing: "border-box",
      });
      outgoing.append(clone);
    }
    return outgoing;
  }

  function animateMonth(
    direction,
    update = () => {},
    onComplete = () => {},
    { axis = "y" } = {},
  ) {
    actions.closeImport();
    const element = $("calendar");
    const enabled =
      direction &&
      !model.analysisMode &&
      !reducedMotion.matches &&
      !document.hidden &&
      typeof element.animate === "function";
    stopMonthTransition();
    if (model.yearMode) {
      update(enabled);
      return onComplete();
    }
    let copy, previousBounds, oldTop;
    const scrolls = [];
    const horizontal = axis === "x";
    const previousDays = new Map();
    const weatherPositions = new Map();
    const attendance = !element.closest(".agenda-mode");
    const daySelector = attendance ? ":scope > .day" : ".day[data-agenda-week]";
    function numberPosition(card, bounds) {
      const label =
        card.querySelector(".daynum-text") || card.querySelector(".daynum");
      if (!label?.firstChild) return null;
      const range = document.createRange();
      range.selectNodeContents(label.firstChild);
      const rect = range.getBoundingClientRect();
      return { left: rect.left - bounds.left, top: rect.top - bounds.top };
    }
    if (enabled) {
      WorkTimeApp.ui.motion?.stop(element);
      previousBounds = element.getBoundingClientRect();
      for (const card of horizontal
        ? []
        : element.querySelectorAll(daySelector)) {
        const rect = card.getBoundingClientRect();
        if (!rect.height) continue;
        previousDays.set(card.dataset.date || card.dataset.previewDate, {
          top: rect.top - previousBounds.top,
          bottom: rect.bottom - previousBounds.top,
          opacity: attendance ? getComputedStyle(card).opacity : null,
          monthSuffix: card.querySelector(".daynum small")?.textContent || "",
          number: attendance ? numberPosition(card, rect) : null,
        });
        if (attendance)
          for (const picture of card.querySelectorAll(monthWeatherSelector))
            weatherPositions.set(picture, picture.getBoundingClientRect());
      }
      if (horizontal) oldTop = element.offsetTop;
      copy = element.cloneNode(true);
      if (attendance && !horizontal)
        for (const card of copy.querySelectorAll(daySelector)) {
          const previous = previousDays.get(
            card.dataset.date || card.dataset.previewDate,
          );
          if (previous) previous.card = card;
        }
      if (element.scrollTop || element.scrollLeft)
        scrolls.push([copy, element.scrollTop, element.scrollLeft]);
      copy.removeAttribute("id");

      if (!attendance) {
        const selector =
          ".agenda-card-items, .agenda-week-lane, .timetable-scroll";
        const sources = element.querySelectorAll(selector);
        const copies = copy.querySelectorAll(selector);
        sources.forEach((source, index) => {
          const node = copies[index];
          if (source.scrollTop || source.scrollLeft)
            scrolls.push([node, source.scrollTop, source.scrollLeft]);
        });
        // Only an open agenda editor supplies ID-dependent selected-day colors.
        // Ordinary days inherit their resting class styles instead of freezing a
        // half-completed hover/selection transition into the entire outgoing page.
        if (element.querySelector(".agenda-chip.is-selected")) {
          const source = element.querySelector(".day.selected");
          const node = copy.querySelector(".day.selected");
          if (source && node) {
            const style = getComputedStyle(source);
            for (const property of ["background", "border-color", "box-shadow"])
              node.style.setProperty(
                property,
                style.getPropertyValue(property),
              );
          }
        }
      }
      copy.classList.add("calendar-navigation-copy");
      copy.inert = true;
      copy.setAttribute("aria-hidden", "true");
    }
    const travel = enabled && (horizontal || attendance);
    if (travel)
      element.dataset.calendarTravel = horizontal ? "horizontal" : "month";
    try {
      update();
    } finally {
      if (travel) delete element.dataset.calendarTravel;
    }
    // Page travel owns selection/content reveals during navigation. Retained
    // attendance dates get their own synchronized content crossfade below.
    if (!enabled || !copy) {
      onComplete();
      return;
    }
    WorkTimeApp.ui.motion?.stop(element);
    WorkTimeApp.ui.motion?.stopWithin(element);
    for (const node of copy.querySelectorAll("[id]"))
      node.removeAttribute("id");
    if (horizontal) {
      // Both pages have the same width. Keep the live grid in flow and use its
      // normal responsive sizing; reading it after the redraw forces layout.
      Object.assign(copy.style, {
        position: "absolute",
        top: oldTop + "px",
        left: "0",
        margin: "0",
        width: previousBounds.width + "px",
        height: previousBounds.height + "px",
      });
      element.after(copy);
      for (const [node, top, left] of scrolls) {
        node.scrollTop = top;
        node.scrollLeft = left;
      }
      const short = element.classList.contains("agenda-week-view");
      const timing = {
        duration: short
          ? calendarMotion.navigationDuration
          : calendarMotion.pageNavigationDuration,
        easing: short
          ? calendarMotion.easing
          : calendarMotion.pageNavigationEasing,
        fill: "both",
      };
      const offset = direction * previousBounds.width;
      const slide = (surface, from, to) => ({
        element: surface,
        frames: [from, to].map((x) => ({
          transform: "translateX(" + x + "px)",
        })),
        options: timing,
      });
      const transition = { copy, onComplete };
      monthTransition = transition;
      monthAnimations = WorkTimeApp.ui.motion.animateCalendar([
        slide(copy, 0, -offset),
        slide(element, offset, 0),
      ]);
      Promise.all(monthAnimations.map((handle) => handle.finished)).then(() => {
        if (monthTransition === transition) stopMonthTransition();
      });
      return;
    }

    const bounds = element.getBoundingClientRect();
    if (!bounds.height || !previousBounds.height) {
      onComplete();
      return;
    }
    // Shared weeks are drawn once on a continuous track, both at month
    // boundaries and when a multiweek agenda advances by one week.
    const nextDays = [...element.querySelectorAll(daySelector)].filter(
      (card) => card.getBoundingClientRect().height > 0,
    );
    // The outgoing content needs the same anchor as its shared row. On
    // return the bottom edges match, so top offsets would move the old tag
    // by the full height difference before the fade even starts.
    const edge = attendance && direction < 0 ? "bottom" : "top";
    const sharedOffsets = nextDays.flatMap((card) => {
      const previous = previousDays.get(
        card.dataset.date || card.dataset.previewDate,
      );
      return previous
        ? [previous[edge] - (card.getBoundingClientRect()[edge] - bounds.top)]
        : [];
    });
    const translate = (value) => `translateY(${value}px)`;
    let offset =
      direction * (direction > 0 ? previousBounds.height : bounds.height);
    const sharedOffset = sharedOffsets[0];
    const partial =
      (attendance ||
        (element.classList.contains("agenda-week-view") &&
          previousDays.size === nextDays.length &&
          Math.abs(previousBounds.height - bounds.height) < 1)) &&
      Math.sign(sharedOffset) === direction &&
      Math.abs(sharedOffset) < Math.max(bounds.height, previousBounds.height) &&
      sharedOffsets.every((value) => Math.abs(value - sharedOffset) < 1);
    if (partial) offset = sharedOffset;
    const viewport = document.createElement("div");
    viewport.className = "calendar-navigation-viewport";
    viewport.style.height = bounds.height + "px";
    const style = element.getAttribute("style");
    element.before(viewport);
    viewport.append(element, copy);
    Object.assign(element.style, {
      height: bounds.height + "px",
      width: bounds.width + "px",
      flex: "none",
      willChange: "transform",
    });
    Object.assign(copy.style, {
      position: "absolute",
      top: "0",
      left: "0",
      margin: "0",
      width: previousBounds.width + "px",
      height: previousBounds.height + "px",
      flex: "none",
      pointerEvents: "none",
      transform: "none",
      opacity: "1",
    });
    if (partial) {
      // Keep only the departing strip of the old page. Shared rows are drawn
      // by the new page, including their cross-day agenda lanes.
      const nextDates = new Set(
        nextDays.map((card) => card.dataset.date || card.dataset.previewDate),
      );
      const leaving = [...previousDays]
        .filter(([date]) => !nextDates.has(date))
        .map(([, rect]) => rect);
      if (direction > 0)
        copy.style.clipPath = `inset(0 0 ${previousBounds.height - offset}px 0)`;
      else
        copy.style.clipPath = `inset(${Math.min(...leaving.map((rect) => rect.top))}px 0 0 0)`;
    }
    for (const [node, top, left] of scrolls) {
      node.scrollTop = top;
      node.scrollLeft = left;
    }
    const suffixes = [],
      outgoingContents = [];
    const transition = {
      element,
      viewport,
      style,
      suffixes,
      outgoingContents,
      onComplete,
    };
    monthTransition = transition;
    const pageTravel =
      !element.classList.contains("agenda-week-view") ||
      (!partial &&
        (nextDays.length > 7 ||
          element.classList.contains("agenda-dual-card-view")));
    const timing = {
      duration: !pageTravel
        ? calendarMotion.navigationDuration
        : calendarMotion.pageNavigationDuration,
      easing: !pageTravel
        ? calendarMotion.easing
        : calendarMotion.pageNavigationEasing,
      fill: "both",
    };
    const details = [];
    if (attendance && partial) {
      for (const card of nextDays) {
        const previous = previousDays.get(
          card.dataset.date || card.dataset.previewDate,
        );
        if (!previous) continue;
        if (weatherPositions.size)
          for (const picture of card.querySelectorAll(monthWeatherSelector)) {
            const before = weatherPositions.get(picture);
            if (!before) continue;
            const after = picture.getBoundingClientRect();
            if (!before.width || !after.width) continue;
            // The weather node survives the date redraw. Keep it at its old
            // screen position when the new row starts sliding, then let it
            // settle against the new card's bottom edge with the page.
            const x = before.left - after.left;
            const y = before.top - after.top - offset;
            if (Math.abs(x) < 0.1 && Math.abs(y) < 0.1) continue;
            details.push({
              element: picture,
              frames: [
                { translate: x + "px " + y + "px" },
                { translate: "0px 0px" },
              ],
              options: timing,
            });
          }

        if (
          previous.card &&
          previous.card.classList.contains("adjacent") !==
            card.classList.contains("adjacent")
        ) {
          const outgoing = snapshotMonthContent(previous.card, card, edge);
          const fields = [...card.querySelectorAll(monthContentSelector)];
          card.append(outgoing);
          outgoingContents.push(outgoing);
          details.push({
            element: outgoing,
            frames: [{ opacity: 1 }, { opacity: 0 }],
            options: timing,
          });
          for (const field of fields)
            details.push({
              element: field,
              frames: [
                { opacity: 0 },
                { opacity: getComputedStyle(field).opacity },
              ],
              options: timing,
            });
        }
        const opacity = getComputedStyle(card).opacity;
        if (previous.opacity !== opacity)
          details.push({
            element: card,
            frames: [{ opacity: previous.opacity }, { opacity }],
            options: timing,
          });
        const suffix = card.querySelector(".daynum small");
        const host = card.querySelector(".daynum");
        if (!!suffix !== !!previous.monthSuffix && previous.number) {
          const position = numberPosition(card, card.getBoundingClientRect());
          if (position) {
            const x = previous.number.left - position.left;
            const y = previous.number.top - position.top;
            if (Math.abs(x) > 0.1 || Math.abs(y) > 0.1)
              details.push({
                element: host,
                frames: [
                  { transform: `translate(${x}px, ${y}px)` },
                  { transform: "translate(0px, 0px)" },
                ],
                options: timing,
              });
          }
        }
        if (suffix && !previous.monthSuffix)
          details.push({
            element: suffix,
            frames: [{ opacity: 0 }, { opacity: 1 }],
            options: timing,
          });
        else if (!suffix && previous.monthSuffix) {
          const outgoing = document.createElement("small");
          outgoing.className = "calendar-month-suffix-outgoing";
          outgoing.textContent = previous.monthSuffix;
          outgoing.setAttribute("aria-hidden", "true");
          host.classList.add("calendar-month-suffix-host");
          host.append(outgoing);
          suffixes.push(outgoing);
          details.push({
            element: outgoing,
            frames: [{ opacity: 1 }, { opacity: 0 }],
            options: timing,
          });
        }
      }
    }
    monthAnimations = WorkTimeApp.ui.motion.animateCalendar([
      {
        element: copy,
        frames: [
          { transform: translate(0) },
          { transform: translate(-offset) },
        ],
        options: timing,
      },
      {
        element,
        frames: [{ transform: translate(offset) }, { transform: translate(0) }],
        options: timing,
      },
      ...details,
    ]);
    Promise.all(monthAnimations.map((animation) => animation.finished)).then(
      () => {
        if (monthTransition === transition) stopMonthTransition();
      },
    );
  }

  function retainCalendarSelection(dates = null, fallback = model.selected) {
    const selected =
      model.calendarSelected === undefined
        ? model.selected
        : model.calendarSelected;
    let visible = false;
    if (selected) {
      if (dates) visible = dates.includes(selected);
      else if (model.yearMode)
        visible = selected.slice(0, 4) === String(model.viewYear);
      else {
        // Include the adjacent dates actually drawn in the month grid.
        const first = C.localDate(model.month + "-01");
        const last = C.localDate(model.month + "-01");
        last.setMonth(last.getMonth() + 1, 0);
        first.setDate(first.getDate() - ((first.getDay() + 6) % 7));
        last.setDate(last.getDate() + 6 - ((last.getDay() + 6) % 7));
        visible = selected >= C.dateKey(first) && selected <= C.dateKey(last);
      }
    }
    model.calendarSelected = visible ? selected : null;
    // Editors still need a valid working date after the highlighted card exits.
    model.selected = visible ? selected : fallback;
  }

  function drawYearStep(animated) {
    yearDrawFrame = null;
    if (!model.yearMode || model.analysisMode) return;
    const month = model.month;
    const updateReport = actions.renderYearNavigation({
      deferDetails: animated,
    });
    const finish = () => {
      yearDetailsTimer = null;
      if (!model.yearMode || model.analysisMode || model.month !== month)
        return;
      updateReport?.();
      actions.renderStats();
    };
    if (animated) yearDetailsTimer = window.setTimeout(finish, 200);
    else finish();
    actions.prepareNeighboringYears(yearDirection);
  }

  function startYearNavigation(year) {
    yearDirection = Math.sign(year - model.viewYear);
    if (yearDetailsTimer !== null) window.clearTimeout(yearDetailsTimer);
    yearDetailsTimer = null;
    animateMonth(yearDirection, (animated) => {
      model.viewYear = year;
      model.month = year + "-" + model.month.slice(5);
      model.returnMonth = model.month;
      retainCalendarSelection();
      // Account for every click immediately, but only build a year that can paint.
      if (animated && window.requestAnimationFrame) {
        yearDrawFrame ??= window.requestAnimationFrame(() =>
          drawYearStep(true),
        );
      } else {
        if (yearDrawFrame !== null) window.cancelAnimationFrame(yearDrawFrame);
        drawYearStep(false);
      }
    });
  }

  function stepCalendar(direction) {
    stopPageTransition();
    if (model.batchMode) return;
    stopTodayAttention();
    if (!model.yearMode) {
      const month = C.localDate(model.month + "-01");
      month.setMonth(month.getMonth() + direction);
      navigateMonth(C.dateKey(month).slice(0, 7));
      return;
    }
    const target = model.viewYear + direction;
    if (target >= 1900 && target <= 9999) startYearNavigation(target);
  }

  function navigateMonth(v, selectToday = false) {
    stopPageTransition();
    if (resettingBatch || model.batchMode) return;
    stopTodayAttention();
    model.yearMode = false;
    if (!/^\d{4}-\d{2}$/.test(v) || !C.validDate(v + "-01")) return;
    const direction = v === model.month ? 0 : v > model.month ? 1 : -1;
    animateMonth(direction, () => {
      model.month = v;
      retainCalendarSelection(
        null,
        model.month === model.today.slice(0, 7)
          ? model.today
          : model.month + "-01",
      );
      if (direction && !selectToday) model.calendarSelected = null;
      model.batchDays.clear();
      model.batchAnchor = null;
      actions.render();
    });
    if (!$("settingsPane").hidden) actions.refreshSettings();
  }
  const batchText = (key, values = {}) =>
    WorkTimeApp.i18n.t("batch." + key, values);
  function prepareBatchEditor() {
    const schedule = C.scheduleForDate(model.state, model.selected);
    model.batchInput = {
      mode: "direct",
      direct: { start: "", end: "", nextDay: false },
      overtime: { start: "", hours: "" },
    };
    model.batchDraft = { reset: "none" };
    model.batchPreview = null;
    $("batchStart").value = $("batchEnd").value = "";
    WorkTimeApp.ui.workspaceViews.setNumberValue($("batchCalcOvertime"), "");
    $("batchStart").placeholder = schedule.workStart;
    $("batchEnd").placeholder = schedule.workEnd;
    $("batchNext").checked = false;
    $("batchError").textContent = "";
    updateBatchMode();
    actions.renderBatchTimeTemplates();
    refreshBatchPreview();
  }
  function updateBatchMode() {
    const overtime = model.batchInput.mode === "overtime";
    $("batchInputSection").dataset.inputMode = overtime ? "overtime" : "direct";
    $("batchModeToggle").querySelector(".button-label").textContent = batchText(
      overtime ? "direct" : "overtime",
    );
    $("batchModeToggle").dataset.hintText = batchText(
      overtime ? "switchDirect" : "switchOvertime",
    );
    $("batchModeToggle").setAttribute(
      "aria-label",
      $("batchModeToggle").dataset.hintText,
    );
    $("batchEndField").hidden = overtime;
    $("batchNextField").inert = overtime;
    document.querySelector(".batch-template-area").inert = overtime;
    $("batchOvertimeFields").hidden = !overtime;
    $("batchEnd").disabled = overtime;
    $("batchCalcOvertime").disabled = !overtime;
    $("batchCalcOvertime").required = overtime;
    updateBatchNextToggle();
  }
  function rememberBatchInput() {
    const input = model.batchInput;
    if (input.mode === "direct")
      input.direct = {
        start: $("batchStart").value,
        end: $("batchEnd").value,
        nextDay: $("batchNext").checked,
      };
    else
      input.overtime = {
        start: $("batchStart").value,
        hours: $("batchCalcOvertime").value,
      };
  }
  function switchBatchMode(mode) {
    if (model.batchSaving || model.batchInput.mode === mode) return;
    rememberBatchInput();
    const input = model.batchInput;
    input.mode = mode;
    if (mode === "overtime") {
      if (!input.overtime.start)
        input.overtime.start =
          input.direct.start ||
          C.scheduleForDate(model.state, model.selected).workStart;
      $("batchStart").value = input.overtime.start;
      WorkTimeApp.ui.workspaceViews.setNumberValue(
        $("batchCalcOvertime"),
        input.overtime.hours,
      );
    } else {
      $("batchStart").value = input.direct.start;
      $("batchEnd").value = input.direct.end;
      $("batchNext").checked = input.direct.nextDay;
    }
    $("batchError").textContent = "";
    updateBatchMode();
    actions.renderBatchTimeTemplates();
    refreshBatchPreview();
  }
  function refreshBatchPreview() {
    if (!model.batchMode || model.batchSaving) return;
    updateBatchMode();
    rememberBatchInput();
    const dates = [...model.batchDays].filter(
      (date) =>
        date.slice(0, 7) === model.month &&
        C.canBatchEditDate(model.state, date),
    );
    let record = {
      start: $("batchStart").value,
      end: $("batchEnd").value,
      nextDay: $("batchNext").checked,
      effectiveMinutes: null,
    };
    let issue = "";
    const overtime = model.batchInput.mode === "overtime";
    $("batchSchedule").textContent = WorkTimeApp.ui.scheduleDescription(
      C.scheduleForDate(model.state, model.selected),
    );
    $("batchCalcResult").textContent = "";
    if (overtime) {
      record = null;
      const schedules = dates.map((date) =>
        C.scheduleForDate(model.state, date),
      );
      const hours = $("batchCalcOvertime").value;
      if (!model.state.settings.configured)
        issue = WorkTimeApp.i18n.t("copy.99d09d1bd5");
      else if (C.timeMin($("batchStart").value) === null)
        issue = batchText("needStart");
      else if (
        hours === "" ||
        !$("batchCalcOvertime").validity.valid ||
        !Number.isFinite(Number(hours)) ||
        Number(hours) < 0
      )
        issue = batchText("needHours");
      else if (
        schedules.some(
          (item) =>
            C.scheduleSignature(item) !== C.scheduleSignature(schedules[0]),
        )
      )
        issue = batchText("mixedSchedules");
      else if (schedules.length) {
        const minutes =
          schedules[0].standardMinutes + Math.round(Number(hours) * 60);
        const match =
          minutes < 1440
            ? C.endForDuration($("batchStart").value, minutes, schedules[0])
            : null;
        if (!match) issue = WorkTimeApp.i18n.t("copy.0e1112168e");
        else {
          record = {
            start: $("batchStart").value,
            end: match.end,
            nextDay: match.nextDay,
            effectiveMinutes: null,
          };
          $("batchCalcResult").textContent = batchText("calculated", {
            time:
              match.end + (match.nextDay ? " · " + batchText("nextDay") : ""),
          });
        }
      }
    } else if (C.timeMin(record.start) === null) issue = batchText("needStart");
    else if (C.timeMin(record.end) === null) issue = batchText("needEnd");
    else if (!C.complete(record)) issue = batchText("invalidRange");
    const valid = !!record && !issue && C.complete(record);
    model.batchDraft = {
      reset: "none",
      month: model.month,
      dates,
      record: valid ? record : null,
      valid,
      canConfirm: valid && dates.length > 0,
    };
    model.batchPreview = {
      base: model.state,
      state: WorkTimeApp.domain.batch.applyBatchChanges(
        model.state,
        model.batchDraft,
      ),
    };
    const status = $("batchPreviewStatus");
    const line = (tag, text, className = "") => {
      const element = WorkTimeApp.ui.native.createElement(tag);
      element.className = className;
      element.textContent = text;
      return element;
    };
    status.replaceChildren();
    status.removeAttribute("data-hint-text");
    if (!dates.length) status.append(line("p", batchText("chooseDates")));
    else if (!valid) status.append(line("p", issue));
    else {
      const counts = { added: 0, completed: 0, replaced: 0 };
      for (const date of dates) {
        const day = model.state.days[date];
        const previous = C.effectiveRecord(day, true);
        if (C.complete(previous)) counts.replaced++;
        else if (
          (previous && (previous.start || previous.end)) ||
          day?.draft?.start ||
          day?.draft?.end
        )
          counts.completed++;
        else counts.added++;
      }
      status.append(
        line(
          "strong",
          record.start +
            " – " +
            record.end +
            (record.nextDay ? " · " + batchText("nextDay") : ""),
          "batch-preview-time",
        ),
      );
      const summary = line("p", "", "batch-preview-counts");
      for (const key of ["added", "completed", "replaced"]) {
        const item = line("span", "");
        item.append(line("span", batchText("count" + key)));
        item.append(line("b", String(counts[key])));
        summary.append(item);
      }
      status.append(summary);
      status.dataset.hintText = batchText("previewNote");
    }
    actions.renderStats();
    actions.renderCalendar();
  }
  function updateBatchNextToggle() {
    $("batchNextToggle").setAttribute(
      "aria-pressed",
      String($("batchNext").checked),
    );
  }
  async function persistBatch(draft, message, keepEditing = false) {
    stopBatchSweep();
    model.batchSaving = resettingBatch = true;
    $("batchForm").setAttribute("aria-busy", "true");
    $("batchForm").inert = true;
    $("batchError").textContent = "";
    actions.renderCalendar();
    try {
      const result = await application.confirmBatch(draft);
      if (!result.persisted) throw result.error || Error("Save failed");
      model.batchSaving = resettingBatch = false;
      if (!keepEditing) actions.leaveBatch();
      actions.render();
      actions.saveFeedback(true, message);
      if (!keepEditing) WorkTimeApp.ui.workspaceViews.focusMenu();
    } catch {
      $("batchError").textContent = batchText("saveFailed");
      actions.toast(WorkTimeApp.i18n.t("copy.77b0044d4f"), "error");
    } finally {
      model.batchSaving = resettingBatch = false;
      $("batchForm").removeAttribute("aria-busy");
      $("batchForm").inert = false;
      if (model.batchMode) {
        refreshBatchPreview();
        if (keepEditing) $("batchReset").focus();
      }
    }
  }
  function handleBatchClear() {
    if (!model.batchMode || model.batchSaving || !model.batchDays.size) return;
    const draft = {
      reset: "selected",
      month: model.month,
      dates: [...model.batchDays],
      record: null,
    };
    const candidate = WorkTimeApp.domain.batch.applyBatchChanges(
      model.state,
      draft,
    );
    if (
      !draft.dates.some(
        (date) => candidate.days[date] !== model.state.days[date],
      )
    ) {
      actions.toast(batchText("nothingToClear"));
      return;
    }
    return persistBatch(draft, batchText("saved"), true);
  }
  let bound = false;
  function bind() {
    if (bound) return;
    bound = true;
    events.listen(
      document.querySelector(".panel-head"),
      "click",
      (event) => {
        if (!pageTransition || event.target.closest(".toolbar-segmented"))
          return;
        event.preventDefault();
        event.stopImmediatePropagation();
      },
      true,
    );
    for (const type of ["click", "keydown"])
      events.listen(
        document,
        type,
        (event) => {
          if (!model.batchSaving) return;
          event.preventDefault();
          event.stopImmediatePropagation();
        },
        true,
      );
    for (const id of ["batchStart", "batchEnd", "batchCalcOvertime"])
      for (const type of ["input", "change"])
        events.listen($(id), type, () => {
          $("batchError").textContent = "";
          refreshBatchPreview();
        });
    events.listen(
      $("batchCalcOvertime"),
      "wheel",
      (event) => {
        const input = $("batchCalcOvertime");
        if (
          model.batchSaving ||
          model.batchInput?.mode !== "overtime" ||
          document.activeElement !== input ||
          !event.deltaY
        )
          return;
        event.preventDefault();
        if (event.deltaY < 0) input.stepUp();
        else input.stepDown();
        input.dispatchEvent(new Event("input", { bubbles: true }));
      },
      { passive: false },
    );
    unlistenMotion = animationCompat.listen(reducedMotion, () => {
      stopTodayAttention();
      if (reducedMotion.matches) {
        stopPageTransition();
      }
    });
    events.listen(document, "visibilitychange", () => {
      if (document.hidden) {
        stopBatchSweep();
        stopTodayAttention();
        stopPageTransition();
      }
    });
    events.listen(window, "resize", () => stopPageTransition());
    events.listen(
      document,
      "pointerdown",
      () => {
        stopBatchSweep();
        suppressBatchClick = false;
      },
      true,
    );
    events.listen($("calendar"), "pointerdown", (event) => {
      if (
        event.pointerType !== "mouse" ||
        event.button !== 0 ||
        event.shiftKey ||
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        !model.batchMode ||
        model.batchSaving ||
        resettingBatch
      )
        return;
      const card = event.target.closest(".day[data-date]");
      const date = card?.dataset.date;
      if (
        !date ||
        date.slice(0, 7) !== model.month ||
        !C.canBatchEditDate(model.state, date)
      )
        return;
      event.preventDefault();
      const button = card.querySelector(":scope > .day-select");
      if (button) WorkTimeApp.ui.native.playInsetWave(button, event);
      stopTodayAttention();
      batchSweep = {
        pointerId: event.pointerId,
        select: !model.batchDays.has(date),
        visited: new Set(),
      };
      suppressBatchClick = true;
      model.batchAnchor = date;
      $("calendar").classList.add("is-batch-sweeping");
      sweepBatchDate(card);
    });
    events.listen(document, "pointermove", (event) => {
      if (!batchSweep || batchSweep.pointerId !== event.pointerId) return;
      if (
        !(event.buttons & 1) ||
        !model.batchMode ||
        model.batchSaving ||
        resettingBatch
      ) {
        stopBatchSweep();
        return;
      }
      const card = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest(".day[data-date]");
      if (card?.parentElement === $("calendar")) sweepBatchDate(card);
    });
    for (const type of ["pointerup", "pointercancel"])
      events.listen(
        document,
        type,
        (event) => {
          if (batchSweep?.pointerId === event.pointerId) stopBatchSweep();
        },
        true,
      );
    events.listen(window, "blur", stopBatchSweep);
    events.listen(
      document,
      "click",
      (event) => {
        const suppress = suppressBatchClick;
        suppressBatchClick = false;
        if (
          suppress &&
          event.detail > 0 &&
          $("calendar").contains(event.target)
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      true,
    );
    events.listen($("calendar"), "dragstart", (event) => {
      if (batchSweep) event.preventDefault();
    });
    events.listen($("calendar"), "click", stopTodayAttention, true);
    events.handler($("calendar"), "onclick", async (e) => {
      if (resettingBatch) return;
      const source = e.target.closest("[data-source-date]");
      if (source) {
        if (model.batchMode) return;
        const date = source.dataset.sourceDate;
        const operation = application.toggleSourcePriority(date);
        actions.renderStats();
        actions.renderCalendar(true);
        if (model.selected === date) actions.renderEditor();
        const saved = (await operation).persisted;
        if (!bound) return;
        // Saving may finish after navigation or typing. Refresh saved status
        // without replacing another date's editor or a newly entered draft.
        actions.renderStats();
        actions.renderCalendar(true);
        if (!saved)
          actions.toast(WorkTimeApp.i18n.t("copy.69bd4f5650"), "error");
        return;
      }
      const b = e.target.closest(".day[data-date]");
      if (!b) return;
      const k = b.dataset.date;
      if (model.batchMode) {
        if (
          k.slice(0, 7) !== model.month ||
          !C.canBatchEditDate(model.state, k)
        )
          return;
        if (e.shiftKey && model.batchAnchor) {
          const [first, last] = [model.batchAnchor, k].sort();
          for (const card of $("calendar").querySelectorAll(
            ".day[data-date]",
          )) {
            const date = card.dataset.date;
            if (
              date >= first &&
              date <= last &&
              date.slice(0, 7) === model.month &&
              C.canBatchEditDate(model.state, date)
            )
              model.batchDays.add(date);
          }
        } else {
          model.batchDays.has(k)
            ? model.batchDays.delete(k)
            : model.batchDays.add(k);
          model.batchAnchor = k;
        }
        refreshBatchPreview();
      } else {
        model.selected = model.calendarSelected = k;
        actions.renderCalendar();
        actions.renderEditor();
        if (!$("settingsPane").hidden) actions.refreshSettings();
      }
    });
    events.listen($("monthTitle"), "pointerenter", actions.prepareYearEntry);
    events.listen($("monthTitle"), "focus", actions.prepareYearEntry);
    events.handler($("monthTitle"), "onclick", () => {
      if (resettingBatch || model.batchMode || model.analysisMode) return;
      if (!model.yearMode) actions.prepareYearEntry();
      return transitionPage({
        direction: model.yearMode ? -1 : 1,
        sidebarTransition: true,
        yearTitle: !model.yearMode,
        update() {
          if (model.yearMode) {
            model.yearMode = false;
            model.month = model.returnMonth;
          } else {
            model.yearMode = true;
            model.viewYear = Number(model.month.slice(0, 4));
            model.yearViewMode = "heatmap";
            model.returnMonth = model.month;
            model.batchMode = false;
            model.batchDays.clear();
            model.batchAnchor = null;
          }
          // Reveal only the destination sidebar when the page commits.
          actions.closeSettings({ animate: false });
        },
        afterRender: () => actions.prepareNeighboringYears(),
      });
    });
    events.listen($("calendar"), "keydown", (e) => {
      const button = e.target.closest("[data-year-date]");
      if (button && ["Enter", " "].includes(e.key)) {
        e.preventDefault();
        openYearDate(button);
        return;
      }
      if (!e.target.matches(".year-month") || !["Enter", " "].includes(e.key))
        return;
      e.preventDefault();
      e.target.click();
    });
    function openYearDate(button) {
      if (resettingBatch || model.batchMode || !model.yearMode) return;
      const date = button.dataset.yearDate;
      const month = date.slice(0, 7);
      return transitionPage({
        direction: -1,
        update() {
          model.yearMode = false;
          model.month = month;
          model.selected = model.calendarSelected = date;
        },
        afterRender() {
          if (!$("settingsPane").hidden) actions.refreshSettings();
        },
        onComplete() {
          $("calendar")
            .querySelector(
              "[data-date=" + JSON.stringify(model.selected) + "] .day-select",
            )
            ?.focus({ preventScroll: true });
        },
      });
    }
    events.listen($("calendar"), "dblclick", (e) => {
      const button = e.target.closest("[data-year-date]");
      if (button) return openYearDate(button);
    });
    events.listen($("calendar"), "click", (e) => {
      const monthSection = e.target.closest(".year-month");
      if (!monthSection || resettingBatch || model.batchMode || !model.yearMode)
        return;
      const month = monthSection.dataset.yearMonth;
      if (
        !/^\d{4}-\d{2}$/.test(month || "") ||
        Number(month.slice(0, 4)) !== model.viewYear ||
        !C.validDate(month + "-01") ||
        month === model.month
      )
        return;
      model.month = month;
      model.returnMonth = month;
      actions.renderStats();
      actions.renderYearNavigation();
    });
    events.handler($("prevMonth"), "onclick", () => stepCalendar(-1));
    events.handler($("nextMonth"), "onclick", () => stepCalendar(1));
    events.handler($("todayButton"), "onclick", () => {
      if (model.batchMode) return;
      if (model.yearMode)
        return transitionPage({
          direction: -1,
          update() {
            model.today = clock.today();
            model.selected = model.calendarSelected = model.today;
            model.month = model.today.slice(0, 7);
            model.yearMode = false;
          },
          afterRender() {
            if (!$("settingsPane").hidden) actions.refreshSettings();
          },
          onComplete: highlightToday,
        });
      model.today = clock.today();
      model.selected = model.calendarSelected = model.today;
      navigateMonth(model.today.slice(0, 7), true);
      if (!model.analysisMode) highlightToday();
    });
    events.handler($("analysisToggle"), "onclick", toggleAnalysis);
    events.handler($("batchToggle"), "onclick", () => {
      stopBatchSweep();
      stopPageTransition();
      if (resettingBatch || model.analysisMode) return;
      stopTodayAttention();
      if (!$("settingsPane").hidden) actions.closeSettings();
      if (model.batchMode) {
        actions.leaveBatch();
        return;
      }
      model.batchMode = true;
      model.batchDays.clear();
      model.batchAnchor = null;
      if (model.batchMode) prepareBatchEditor();
      actions.renderCalendar();
    });
    events.handler($("batchAutoSelect"), "onclick", () => {
      if (resettingBatch || model.batchSaving || !model.batchMode) return;
      model.batchDays.clear();
      model.batchAnchor = null;
      const end = new Date(
        Number(model.month.slice(0, 4)),
        Number(model.month.slice(5)),
        0,
      ).getDate();
      for (let day = 1; day <= end; day++) {
        const date = model.month + "-" + String(day).padStart(2, "0");
        if (
          C.canBatchEditDate(model.state, date) &&
          !C.complete(C.effectiveRecord(model.state.days[date], true))
        )
          model.batchDays.add(date);
      }
      refreshBatchPreview();
    });
    events.handler($("batchCancel"), "onclick", () => {
      stopBatchSweep();
      if (resettingBatch) return;
      stopTodayAttention();
      actions.leaveBatch();
      WorkTimeApp.ui.workspaceViews.focusMenu();
    });
    events.handler($("batchClearSelection"), "onclick", () => {
      if (model.batchSaving) return;
      model.batchDays.clear();
      model.batchAnchor = null;
      refreshBatchPreview();
    });
    events.handler($("batchModeToggle"), "onclick", () =>
      switchBatchMode(
        model.batchInput.mode === "direct" ? "overtime" : "direct",
      ),
    );
    events.handler($("batchReset"), "onclick", handleBatchClear);
    events.handler($("batchNextToggle"), "onclick", () => {
      $("batchNext").checked = !$("batchNext").checked;
      updateBatchNextToggle();
      actions.renderBatchTimeTemplates();
      refreshBatchPreview();
    });
    events.handler($("batchForm"), "onsubmit", async (e) => {
      e.preventDefault();
      if (model.batchSaving || !model.batchMode) return;
      refreshBatchPreview();
      const draft = model.batchDraft;
      if (!draft.canConfirm) {
        $("batchError").textContent = WorkTimeApp.i18n.t(
          draft.valid ? "copy.03ee2fc8fc" : "copy.f950d3ddc0",
        );
        return;
      }
      await persistBatch(
        draft,
        WorkTimeApp.i18n.t("copy.f54a93c893") +
          draft.dates.length +
          WorkTimeApp.i18n.t("copy.a68e14c5a6"),
      );
    });
  }

  function dispose() {
    stopBatchSweep();
    analysisStyleRequest++;
    if (yearDrawFrame !== null) window.cancelAnimationFrame(yearDrawFrame);
    if (yearDetailsTimer !== null) window.clearTimeout(yearDetailsTimer);
    yearDrawFrame = yearDetailsTimer = null;
    stopPageTransition(false);
    stopTodayAttention();
    unlistenMotion?.();
    unlistenMotion = null;
    events.dispose();
    bound = false;
  }
  const hasDraft = () => model.batchMode;
  return {
    bind,
    dispose,
    updateBatchNextToggle,
    refreshBatchPreview,
    transitionAnalysis,
    transitionPage,
    animateCalendarNavigation: animateMonth,
    retainCalendarSelection,
    highlightToday,
    finishCalendarNavigation() {
      analysisStyleRequest++;
      pendingAnalysis = null;
      stopPageTransition();
      stopMonthTransition();
      stopTodayAttention();
    },
    hasDraft,
  };
};
