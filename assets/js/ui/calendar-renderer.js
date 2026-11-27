"use strict";
/** Own keyed calendar DOM reconciliation, preserving focus, weather layers and text profiles. */
WorkTimeApp.ui.createCalendarRenderer = function ({
  element: $,
  document,
  weatherLayer,
  numbers,
}) {
  let calendarMarkup = "";
  let renderedYear = null,
    parkedYear = null;
  const preparedYears = new WeakMap();
  const calendarNodes = new Map(),
    markup = new WeakMap();
  const plannedAnimations = new WeakMap();
  function stopPlannedAnimation(card) {
    const active = plannedAnimations.get(card);
    if (!active) return;
    active.handle.cancel();
    if (active.outgoing) active.element.remove();
    plannedAnimations.delete(card);
  }
  function plannedSnapshot(card, summary) {
    const bounds = summary.getBoundingClientRect(),
      parent = card.getBoundingClientRect(),
      ghost = document.createElement("div"),
      style = getComputedStyle(summary);
    ghost.className = "calendar-planned-outgoing";
    ghost.setAttribute("aria-hidden", "true");
    ghost.inert = true;
    for (const property of [
      "display",
      "flex-direction",
      "align-items",
      "justify-content",
      "gap",
      "padding",
      "box-sizing",
      "font-family",
      "color",
      "text-align",
    ])
      ghost.style.setProperty(property, style.getPropertyValue(property));
    Object.assign(ghost.style, {
      position: "absolute",
      left: bounds.left - parent.left - card.clientLeft + "px",
      top: bounds.top - parent.top - card.clientTop + "px",
      width: bounds.width + "px",
      height: bounds.height + "px",
    });
    for (const child of summary.children) {
      const field = child.cloneNode(true),
        childBounds = child.getBoundingClientRect();
      // Freeze the painted text and number wrappers before their container
      // disappears. Re-running flex layout here can move a clipped title down.
      const originals = [child, ...child.querySelectorAll("*")],
        copies = [field, ...field.querySelectorAll("*")];
      originals.forEach((original, index) => {
        const computed = getComputedStyle(original),
          copy = copies[index];
        copy.removeAttribute("id");
        for (const property of computed)
          copy.style.setProperty(property, computed.getPropertyValue(property));
        copy.style.animation = "none";
        copy.style.transition = "none";
      });
      Object.assign(field.style, {
        position: "absolute",
        left: childBounds.left - bounds.left + "px",
        top: childBounds.top - bounds.top + "px",
        right: "auto",
        bottom: "auto",
        width: childBounds.width + "px",
        height: childBounds.height + "px",
        minWidth: "0",
        maxWidth: "none",
        margin: "0",
        transform: "none",
        boxSizing: "border-box",
      });
      ghost.append(field);
    }
    return ghost;
  }
  const numberSelectors = [
    ".daynum-text",
    ".day-time-value",
    ".day-total-hours",
    ".day-overtime",
    ".day-average-value",
  ];
  function emphasizeMixedLabelNumbers(label) {
    const text = label.textContent;
    const leaveDuration =
      label.matches(".pill.leave .pill-text") &&
      text.match(/\d+(?:[.,]\d+)*h$/);
    if (leaveDuration) {
      const duration = document.createElement("strong");
      duration.className = "calendar-leave-duration";
      duration.textContent = leaveDuration[0];
      label.replaceChildren(
        document.createTextNode(
          text
            .slice(0, leaveDuration.index)
            .replace(/(\p{Script=Han})\s+$/u, "$1"),
        ),
        duration,
      );
      return;
    }
    if (
      !/\d/.test(text) ||
      (!label.matches(".daykind") && !/\p{Script=Han}/u.test(text))
    )
      return;
    label.replaceChildren(
      ...text.split(/(\d+(?:[.,]\d+)*)/g).map((part, index) => {
        if (index % 2 === 0) return document.createTextNode(part);
        const number = document.createElement("span");
        number.className = "calendar-label-number";
        number.textContent = part;
        return number;
      }),
    );
  }
  const artworkKey = (card) =>
    ["weekend", "full-leave", "rest-overtime"]
      .map((name) => card.classList.contains(name))
      .join(":") +
    ":" +
    card.getAttribute("data-holiday");
  function artworkLayers(card) {
    return ["::before", "::after"].map((pseudo) => {
      const style = getComputedStyle(card, pseudo);
      const paint = Object.fromEntries(
        [
          "position",
          "top",
          "right",
          "bottom",
          "left",
          "width",
          "height",
          "max-width",
          "aspect-ratio",
          "background",
          "filter",
          "opacity",
          "transform",
          "border-radius",
          "z-index",
        ].map((property) => [property, style.getPropertyValue(property)]),
      );
      return {
        pseudo,
        paint,
        visible:
          !["none", "normal"].includes(style.content) &&
          style.backgroundImage !== "none" &&
          Number(style.opacity) > 0,
      };
    });
  }
  function syncAttributes(element, next) {
    for (const attribute of [...element.attributes])
      if (!next.hasAttribute(attribute.name))
        element.removeAttribute(attribute.name);
    for (const attribute of next.attributes) {
      const value = attribute.value;
      if (element.getAttribute(attribute.name) !== value)
        element.setAttribute(attribute.name, value);
    }
  }

  // Reconcile the path around a retained source control without detaching it.
  // Moving a focused button through the template fires blur/pointer exit events
  // and closes its tooltip even when it is mounted again in the same render.
  function updateSourceContent(element, candidate, source, nextSource) {
    syncAttributes(element, candidate);
    if (element === source) return;
    const retained = [...element.children].find((child) =>
      child.contains(source),
    );
    const replacement = [...candidate.children].find((child) =>
      child.contains(nextSource),
    );
    updateSourceContent(retained, replacement, source, nextSource);
    const children = [...candidate.childNodes].map((child) =>
      child === replacement ? retained : child,
    );
    for (const child of [...element.childNodes])
      if (!children.includes(child)) child.remove();
    children.forEach((child, index) => {
      if (element.childNodes[index] !== child)
        element.insertBefore(child, element.childNodes[index] || null);
    });
  }

  function updateHTML(element, html) {
    if (markup.get(element) === html) return;
    element.innerHTML = html;
    markup.set(element, html);
  }

  function updateText(element, text) {
    if (element.textContent !== text) element.textContent = text;
  }

  let yearFade = null;
  function finishYearFade(keepOutgoing = false) {
    if (!yearFade) return;
    clearTimeout(yearFade.timer);
    for (const { outgoing, incoming } of yearFade.months) {
      if (!keepOutgoing) {
        outgoing.remove();
        outgoing.classList.remove("is-outgoing");
      }
      incoming.classList.remove("is-entering");
    }
    yearFade = null;
  }

  const yearButtons = new WeakMap();
  function detailColor(day) {
    if (!day) return "";
    if (day.makeup) return "is-makeup";
    if (day.holiday) return "is-holiday";
    return day.weekend ? "is-weekend" : "is-workday";
  }
  function applyYearColors(drawing, month) {
    const previous = drawing.colorMonth;
    if (month === previous) return;
    for (let i = 0; i < drawing.slots.length; i++) {
      const day = month.days[i - month.offset];
      const old = previous?.days[i - previous.offset];
      const slot = drawing.slots[i];
      if (day?.color.background !== old?.color.background) {
        if (day) slot.style.setProperty("--year-heat-bg", day.color.background);
        else slot.style.removeProperty("--year-heat-bg");
      }
      const color = detailColor(day);
      if (color !== detailColor(old)) drawing.colors[i].className = color;
    }
    drawing.colorMonth = month;
  }

  function updateYearSlots(grid, month, previous, section) {
    // Compare plain day data and write directly to the original 42 buttons.
    let drawing = yearButtons.get(grid);
    if (!drawing) {
      const palette = document.createElement("div");
      palette.className = "year-detail-colors";
      palette.setAttribute("aria-hidden", "true");
      const slots = Array.from({ length: 42 }, () => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "year-day";
        return button;
      });
      const colors = slots.map(() => document.createElement("span"));
      palette.append(...colors);
      drawing = { slots, colors, palette };
      yearButtons.set(grid, drawing);
    }
    const focused = document.activeElement;
    for (let i = 0; i < 42; i++) {
      const day = month.days[i - month.offset];
      const old = previous?.days[i - previous.offset];
      const slot = drawing.slots[i];
      if (!previous || Boolean(day) !== Boolean(old)) {
        if (!day && slot === focused) section.focus({ preventScroll: true });
        slot.disabled = !day;
        if (day) {
          slot.removeAttribute("aria-hidden");
          slot.setAttribute("data-ui", "button");
        } else {
          slot.setAttribute("aria-hidden", "true");
          slot.removeAttribute("data-ui");
        }
      }
      if (day === old) continue;
      if (day?.date !== old?.date) {
        if (day) slot.dataset.yearDate = day.date;
        else delete slot.dataset.yearDate;
      }
      if (day?.description !== old?.description) {
        if (day) slot.setAttribute("aria-label", day.description);
        else slot.removeAttribute("aria-label");
      }
      if (Boolean(day?.today) !== Boolean(old?.today)) {
        if (day?.today) slot.setAttribute("aria-current", "date");
        else slot.removeAttribute("aria-current");
      }
    }
    applyYearColors(drawing, month);
    if (!previous) grid.prepend(...drawing.slots, drawing.palette);
  }

  function updateYearMonth(element, grid, { section, ink }, outgoing, fade) {
    updateHTML(
      element.querySelector(".year-month-stats"),
      section.querySelector(".year-month-stats").innerHTML,
    );
    updateText(
      element.querySelector(".year-month-number"),
      section.querySelector(".year-month-number").textContent,
    );
    if (fade) {
      outgoing.classList.add("is-outgoing");
      if (ink.parentElement === grid) {
        // Reversing a running fade lets CSS continue from the current opacity.
        ink.classList.remove("is-outgoing");
      } else {
        ink.classList.add("is-entering");
        grid.append(ink);
      }
      fade.push({ outgoing, incoming: ink });
    } else outgoing.replaceWith(ink);
  }

  function yearSections(snapshot) {
    let sections = preparedYears.get(snapshot);
    if (!sections) {
      const template = document.createElement("template");
      template.innerHTML = snapshot.markup;
      sections = Array.from(template.content.children, (section) => ({
        section,
        ink: section.querySelector(".year-days").lastElementChild,
      }));
      preparedYears.set(snapshot, sections);
    }
    return sections;
  }

  function prepareYearGrid(snapshot, entryDeadline) {
    if (
      renderedYear?.snapshot === snapshot ||
      parkedYear?.snapshot === snapshot
    )
      return true;
    const sections = yearSections(snapshot);
    if (entryDeadline) {
      for (const [index, { section }] of sections.entries()) {
        const grid = section.querySelector(".year-days");
        if (yearButtons.has(grid)) continue;
        if (entryDeadline.timeRemaining() < 3) return false;
        updateYearSlots(grid, snapshot.months[index], null, section);
      }
    }
    return true;
  }

  function updateYearGrid(snapshot, animateYear) {
    const parked = parkedYear?.snapshot === snapshot;
    const candidates = yearSections(snapshot);
    const surfaces = WorkTimeApp.ui.calendarCells(
      candidates.map(({ section }, index) => ({
        key: "year-month:" + index,
        tag: section.localName,
      })),
    );
    $("calendar").classList.toggle("is-year-navigating", Boolean(animateYear));
    const previous = renderedYear && yearSections(renderedYear.snapshot);
    const fade = animateYear && renderedYear ? [] : null;
    finishYearFade(Boolean(fade && yearFade?.from === snapshot));
    const grids = candidates.map((candidate, index) => {
      const { section, ink } = candidate;
      const surface = surfaces[index];
      syncAttributes(surface, section);
      const month = snapshot.months[index];
      if (renderedYear) {
        const grid = renderedYear.grids[index];
        updateYearSlots(
          grid,
          month,
          renderedYear.snapshot.months[index],
          surface,
        );
        updateYearMonth(surface, grid, candidate, previous[index].ink, fade);
        return grid;
      }
      if (parked) {
        const grid = parkedYear.grids[index];
        surface.replaceChildren(...parkedYear.nodes[index].childNodes);
        return grid;
      }
      // Keep the small heading template and the actual ink reusable on reversal.
      const grid = section.querySelector(".year-days");
      const heading = Array.from(section.children)
        .filter((node) => node !== grid)
        .map((node) => node.cloneNode(true));
      grid.replaceWith(grid.cloneNode(false));
      if (ink.parentElement !== grid) grid.append(ink);
      if (!yearButtons.has(grid)) updateYearSlots(grid, month, null, surface);
      surface.replaceChildren(...heading, grid);
      return grid;
    });
    parkedYear = null;
    // Both ink layers and the target colors are committed before the same paint.
    // The timer only retires the old nodes. It never gates the incoming text.
    if (fade)
      yearFade = {
        from: renderedYear.snapshot,
        months: fade,
        timer: setTimeout(finishYearFade, 150),
      };
    calendarNodes.clear();
    if (!renderedYear) weatherLayer.refresh();
    renderedYear = { snapshot, nodes: surfaces, grids };
    calendarMarkup = "";
  }

  function updateYearCalendar(year, { month, animateYear = false } = {}) {
    if (year !== renderedYear?.snapshot) updateYearGrid(year, animateYear);
    if (month && renderedYear.month !== month) {
      for (const section of renderedYear.nodes) {
        if (section.dataset.yearMonth === month)
          section.setAttribute("aria-current", "true");
        else if (section.hasAttribute("aria-current"))
          section.removeAttribute("aria-current");
      }
      renderedYear.month = month;
    }
  }

  function updateCalendar(html, { animateContent = true } = {}) {
    if (!renderedYear && html === calendarMarkup) return;
    const focused = document.activeElement,
      focusDate = focused?.closest(".day[data-date]")?.dataset.date,
      focusSource = focused?.matches(".source-toggle");
    const container = $("calendar"),
      next = new Map();
    // React can remove its cell shells while the detached drawing nodes remain
    // reusable. Keep only the last year, and only reuse an exact markup match.
    if (renderedYear) {
      finishYearFade();
      container.classList.remove("is-year-navigating");
      parkedYear = renderedYear;
      renderedYear = null;
    }
    const travel = container.dataset.calendarTravel;
    const template = document.createElement("template");
    template.innerHTML = html;
    for (const label of template.content.querySelectorAll(
      ".day .daykind, .day .daystatus .pill-text, .day .day-lunar, .day .daynum small, .day .day-planned-label",
    )) {
      if (label.matches(".pill-text")) {
        const badge = label.closest(".pill");
        if (!badge.dataset.hintText) badge.dataset.hintText = label.textContent;
      }
      emphasizeMixedLabelNumbers(label);
    }
    for (const card of template.content.querySelectorAll(
      "div.day[data-date]",
    )) {
      const select = WorkTimeApp.ui.native.createElement("button");
      select.type = "button";
      select.className = "day-select";
      for (const name of ["aria-label", "aria-pressed", "aria-disabled"]) {
        if (card.hasAttribute(name))
          select.setAttribute(name, card.getAttribute(name));
        if (name !== "aria-disabled") card.removeAttribute(name);
      }
      card.prepend(select);
    }
    const candidates = [...template.content.children];
    const nodeKey = (candidate, index) =>
      candidate.tagName +
      ":" +
      (candidate.dataset.date ||
        candidate.dataset.previewDate ||
        candidate.dataset.yearMonth ||
        candidate.getAttribute("aria-label") ||
        index);
    const surfaces = WorkTimeApp.ui.calendarCells(
      candidates.map((candidate, index) => ({
        key: nodeKey(candidate, index),
        tag: candidate.localName,
      })),
    );
    const artworkMotions = [],
      sourceMotions = [],
      plannedMotions = [];
    candidates.forEach((candidate, index) => {
      const key = nodeKey(candidate, index),
        previous = calendarNodes.get(key),
        source = candidate.outerHTML,
        candidateContent = candidate.innerHTML,
        headerMarkup = candidate.querySelector(".daytop")?.outerHTML,
        bodies = [...candidate.children].filter((element) =>
          element.matches(".daytime, .dayhours, .day-footer"),
        ),
        bodyMarkup = bodies.map((element) => element.outerHTML);
      const numberFields =
        candidate.matches(".day") && !container.closest(".agenda-mode")
          ? numberSelectors.flatMap((selector) =>
              [...candidate.querySelectorAll(selector)].map((field, index) => ({
                selector,
                index,
                value: field.textContent,
                minutes: field.dataset.minutes,
                previous: previous?.element.querySelectorAll(selector)[index],
              })),
            )
          : [];
      const element = surfaces[index];
      let sourceMotion, retainedTime;
      const currentCard =
          previous?.element.parentElement === container
            ? previous.element
            : null,
        // The navigation layer owns the visual handoff when a retained date
        // switches between the current month and the adjacent preview.
        pageTravel =
          travel === "horizontal" ||
          (travel === "month" &&
            currentCard &&
            currentCard.classList.contains("adjacent") !==
              candidate.classList.contains("adjacent")),
        oldSummary = currentCard?.querySelector(".day-planned-summary"),
        nextSummary = candidate.querySelector(".day-planned-summary"),
        animatePlanned =
          !pageTravel &&
          !WorkTimeApp.ui.animationCompat.preference().matches &&
          !document.hidden &&
          !container.closest(".agenda-mode");
      if (Boolean(oldSummary) !== Boolean(nextSummary)) {
        const active = currentCard && plannedAnimations.get(currentCard),
          opacity = !animatePlanned
            ? 0
            : oldSummary
              ? getComputedStyle(oldSummary).opacity
              : active?.outgoing
                ? getComputedStyle(active.element).opacity
                : 0,
          outgoing =
            oldSummary && animatePlanned
              ? plannedSnapshot(currentCard, oldSummary)
              : null;
        if (currentCard) stopPlannedAnimation(currentCard);
        if (animatePlanned)
          plannedMotions.push({
            candidate,
            outgoing,
            entering: !!nextSummary,
            opacity,
          });
      } else if (currentCard && !animatePlanned)
        stopPlannedAnimation(currentCard);
      if (previous && previous.element.parentElement === container) {
        if (previous.source !== source) {
          if (
            !pageTravel &&
            element.matches(".day") &&
            artworkKey(element) !== artworkKey(candidate) &&
            !WorkTimeApp.ui.animationCompat.preference().matches &&
            !document.hidden
          )
            artworkMotions.push({
              card: element,
              layers: artworkLayers(element),
            });
          // Preserve the day surface and weather layers across record updates.
          for (const attribute of previous.attributes)
            if (!candidate.hasAttribute(attribute))
              element.removeAttribute(attribute);
          for (const attribute of candidate.attributes) {
            const value = attribute.value;
            if (element.getAttribute(attribute.name) !== value)
              element.setAttribute(attribute.name, value);
          }
          if (previous.content !== candidateContent) {
            // Keep the painted positions so redraws and rapid clicks stay smooth.
            const sourceToggle = element.querySelector(".source-toggle"),
              nextSourceToggle = candidate.querySelector(".source-toggle");
            if (
              sourceToggle &&
              nextSourceToggle &&
              previous.bodyMarkup[0] !== bodyMarkup[0]
            ) {
              if (
                !pageTravel &&
                sourceToggle.getAttribute("aria-pressed") !==
                  nextSourceToggle.getAttribute("aria-pressed") &&
                !WorkTimeApp.ui.animationCompat.preference().matches
              )
                sourceMotion = [
                  ...sourceToggle.querySelectorAll(".record-source-dot"),
                ].map((dot) => ({
                  dot,
                  transform: getComputedStyle(dot).transform,
                }));
              retainedTime = sourceToggle.closest(".daytime");
              updateSourceContent(
                retainedTime,
                nextSourceToggle.closest(".daytime"),
                sourceToggle,
                nextSourceToggle,
              );
            }
            const header = element.querySelector(".daytop"),
              nextHeader = candidate.querySelector(".daytop"),
              preserveHeader =
                header && nextHeader && previous.headerMarkup === headerMarkup;
            const markers = element.querySelector(".date-markers"),
              nextMarkers = candidate.querySelector(".date-markers");
            if (
              markers &&
              nextMarkers &&
              !preserveHeader &&
              markers.outerHTML === nextMarkers.outerHTML
            )
              nextMarkers.replaceWith(markers);
            // Keep unchanged date headers and their active number animations.
            const preserved = new Map();
            const select = element.querySelector(":scope > .day-select"),
              nextSelect = candidate.querySelector(":scope > .day-select");
            if (select && nextSelect) {
              syncAttributes(select, nextSelect);
              preserved.set(nextSelect, select);
            }
            if (preserveHeader) preserved.set(nextHeader, header);
            const currentBodies = [...element.children].filter((child) =>
              child.matches(".daytime, .dayhours, .day-footer"),
            );
            if (
              oldSummary &&
              nextSummary &&
              previous.bodyMarkup[1] !== bodyMarkup[1]
            ) {
              const value = oldSummary.querySelector(".day-planned-hours"),
                nextValue = nextSummary.querySelector(".day-planned-hours");
              for (const attribute of nextValue.attributes)
                value.setAttribute(attribute.name, attribute.value);
              if (!numberFields.length)
                value.textContent = nextValue.textContent;
              nextSummary.replaceWith(oldSummary);
            }
            bodies.forEach((body, index) => {
              if (body.matches(".daytime") && retainedTime)
                preserved.set(body, retainedTime);
              else if (previous.bodyMarkup[index] === bodyMarkup[index])
                preserved.set(body, currentBodies[index]);
            });
            const children = [...candidate.childNodes].map(
              (child) => preserved.get(child) || child,
            );
            // Weather and agenda own persistent layers. Selecting a different
            // date must not destroy their nodes or restart their animations.
            for (const child of [...element.childNodes])
              if (
                !children.includes(child) &&
                (!(child instanceof Element) ||
                  !child.matches(
                    ".calendar-weather-icon, .calendar-weather-outgoing, .agenda-card-items, .calendar-artwork-outgoing, .calendar-planned-outgoing",
                  ))
              )
                child.remove();
            children.forEach((child, index) => {
              if (element.childNodes[index] !== child)
                element.insertBefore(child, element.childNodes[index] || null);
            });
          }
          if (element.querySelector(".calendar-weather-icon"))
            element.classList.add("has-weather");
        }
      }
      if (!currentCard) {
        for (const attribute of candidate.attributes)
          element.setAttribute(attribute.name, attribute.value);
        element.replaceChildren(...candidate.childNodes);
      }
      for (const motion of plannedMotions)
        if (motion.candidate === candidate) motion.card = element;
      next.set(key, {
        element,
        source,
        content: candidateContent,
        headerMarkup,
        bodyMarkup,
        attributes: [...candidate.attributes].map(
          (attribute) => attribute.name,
        ),
      });
      // Roll actual text changes, retaining the number component across style and
      // source changes so selecting an unchanged record cannot restart motion.
      for (const field of numberFields) {
        let current = element.querySelectorAll(field.selector)[field.index];
        if (field.previous && field.previous !== current) {
          for (const attribute of [...field.previous.attributes])
            if (
              attribute.name !== "style" &&
              !current.hasAttribute(attribute.name)
            )
              field.previous.removeAttribute(attribute.name);
          for (const attribute of current.attributes)
            field.previous.setAttribute(attribute.name, attribute.value);
          current.replaceWith(field.previous);
          current = field.previous;
        }
        if (field.selector === ".day-overtime") {
          WorkTimeApp.ui.renderHourMinutes(current, Number(field.minutes), {
            numbers,
            motion: animateContent && !pageTravel,
          });
          continue;
        }
        const duration = field.value.match(/^([+-]?[\d.,]+)( h)$/),
          unit =
            duration &&
            field.selector === ".day-total-hours" &&
            !current.classList.contains("day-planned-hours")
              ? "h"
              : "";
        numbers.set(current, duration ? duration[1] : field.value, {
          suffix: unit ? "" : duration?.[2] || "",
          unit,
          integerDigits: [".day-overtime", ".day-average-value"].includes(
            field.selector,
          )
            ? 2
            : 0,
          reserveSign: [".day-overtime", ".day-average-value"].includes(
            field.selector,
          ),
          animateInitial: false,
          preserveText: true,
          motion: animateContent && !pageTravel,
        });
      }
      for (const { dot, transform } of sourceMotion || []) {
        sourceMotions.push({ dot, transform });
      }
    });
    if (focusDate && document.activeElement !== focused)
      container
        .querySelector(
          '[data-date="' +
            focusDate +
            '"] ' +
            (focusSource ? ".source-toggle" : ".day-select"),
        )
        ?.focus({ preventScroll: true });
    calendarNodes.clear();
    for (const [key, value] of next) calendarNodes.set(key, value);
    calendarMarkup = html;
    weatherLayer.refresh();
    for (const { card, outgoing, entering, opacity } of plannedMotions) {
      const field = entering
        ? card.querySelector(".day-planned-summary")
        : outgoing;
      if (!field) continue;
      if (outgoing) card.append(outgoing);
      const handle = WorkTimeApp.ui.animationCompat.animate(
        field,
        [{ opacity }, { opacity: entering ? 1 : 0 }],
        {
          duration: entering ? 300 : 220,
          easing: entering ? "cubic-bezier(0.22, 1, 0.36, 1)" : "ease-out",
          fill: "backwards",
        },
      );
      const active = { element: field, handle, outgoing: !entering };
      plannedAnimations.set(card, active);
      handle.finished.then(() => {
        if (plannedAnimations.get(card) !== active) return;
        if (active.outgoing) field.remove();
        plannedAnimations.delete(card);
      });
    }
    const artworkPlans = artworkMotions.map(({ card, layers }) => ({
      card,
      layers,
      next: artworkLayers(card),
    }));
    // Capture the painted start above, then release the previous effect before
    // reading the new class's resting transform. Otherwise rapid switches read
    // the running effect as their destination and snap when it is cancelled.
    for (const { dot } of sourceMotions)
      for (const animation of dot.getAnimations?.() || []) animation.cancel();
    const plans = sourceMotions.map(({ dot, transform }) => ({
      element: dot,
      frames: [{ transform }, { transform: getComputedStyle(dot).transform }],
      options: {
        duration: WorkTimeApp.ui.motion.calendar.navigationDuration,
        easing: WorkTimeApp.ui.motion.calendar.easing,
      },
    }));
    WorkTimeApp.ui.motion.animateCalendar(plans);
    for (const { card, layers, next } of artworkPlans) {
      const timing = {
        duration: WorkTimeApp.ui.motion.calendar.contentDuration,
        easing: WorkTimeApp.ui.motion.calendar.easing,
        fill: "backwards",
      };
      for (const layer of layers) {
        if (!layer.visible) continue;
        const outgoing = document.createElement("span");
        outgoing.className = "calendar-artwork-outgoing";
        outgoing.setAttribute("aria-hidden", "true");
        for (const [property, value] of Object.entries(layer.paint))
          outgoing.style.setProperty(property, value);
        outgoing.style.pointerEvents = "none";
        card.append(outgoing);
        WorkTimeApp.ui.animationCompat
          .animate(
            outgoing,
            [{ opacity: layer.paint.opacity }, { opacity: 0 }],
            timing,
          )
          .finished.then(() => outgoing.remove());
      }
      for (const layer of next) {
        if (!layer.visible) continue;
        WorkTimeApp.ui.animationCompat.animate(
          card,
          [{ opacity: 0 }, { opacity: layer.paint.opacity }],
          { ...timing, pseudoElement: layer.pseudo },
        );
      }
    }
  }
  return {
    updateHTML,
    updateText,
    updateCalendar,
    updateYearCalendar,
    finishYearFade,
    prepareYearGrid,
  };
};
