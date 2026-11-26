"use strict";
/** One value owner for an agenda's date range, all-day mode and times. */
WorkTimeApp.ui.createAgendaSchedule = function ({ root, prefix = "agenda" }) {
  const scope = new AbortController();
  const time = WorkTimeApp.domain.time;
  const t = (key) => WorkTimeApp.i18n.t("agenda." + key);
  const field = (name) => fields.get(prefix + name);
  root.classList.add("agenda-schedule-control");
  WorkTimeApp.ui.native.setGroup(root);
  root.setAttribute("aria-labelledby", prefix + "ScheduleLabel");
  WorkTimeApp.ui.workspaceViews.AgendaScheduleFields(root, { prefix });
  const fields = new Map(
    [...root.querySelectorAll("[id]")].map((node) => [node.id, node]),
  );
  const labels = [...root.querySelectorAll("[data-schedule-label]")];
  field("DateInput").required = true;
  const popup = field("SchedulePopup"),
    trigger = field("ScheduleOpen");
  trigger.setAttribute("aria-controls", popup.id);
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-expanded", "false");
  let month = "",
    activeEndpoint = "start",
    editingEndpoint = false,
    anchor = "",
    preview = "",
    previousRange = null;
  const ordered = (start, end) =>
    start <= end ? { start, end } : { start: end, end: start };
  const completeRange = () => ({
    start: field("DateInput").value,
    end: field("EndDateInput").value,
  });
  const offsetMonth = (value, offset) => {
    const date = time.localDate(value + "-01");
    date.setMonth(date.getMonth() + offset);
    return time.dateKey(date).slice(0, 7);
  };
  const range = () => ({
    ...completeRange(),
    pending: Boolean(anchor),
    anchor,
    preview: anchor && preview ? ordered(anchor, preview) : null,
  });
  const pickers = [0, 1].map((index) =>
    WorkTimeApp.ui.createDatePicker({
      input: field(index ? "EndDateInput" : "DateInput"),
      button: field(index ? "EndDateOpen" : "DateOpen"),
      container: field(index ? "EndCalendar" : "StartCalendar"),
      inline: true,
      range,
      onChoose: choose,
      onPreview(date) {
        if (!anchor || preview === date) return;
        preview = date;
        render();
      },
      onMonthChange(value) {
        month = index ? offsetMonth(value, -1) : value;
        if (month < "1900-01") month = "1900-01";
        render();
      },
    }),
  );
  const popover = WorkTimeApp.ui.popover.create(popup, {
    trigger: () => trigger,
  });
  const isOpen = () => popover.isOpen();
  function close(restoreFocus = false) {
    if (!isOpen()) return;
    resetSelection();
    popover.hide();
    if (restoreFocus) trigger.focus({ preventScroll: true });
  }
  function place() {
    if (!isOpen()) return;
    const rect = trigger.getBoundingClientRect();
    popup.style.width = Math.min(620, innerWidth - 24) + "px";
    popup.style.left =
      Math.max(
        12,
        Math.min(
          rect.right - popup.offsetWidth,
          innerWidth - popup.offsetWidth - 12,
        ),
      ) + "px";
    const height = popup.getBoundingClientRect().height;
    popup.style.top =
      Math.max(
        12,
        Math.min(
          rect.bottom + height + 7 <= innerHeight - 12
            ? rect.bottom + 7
            : rect.top - height - 7,
          innerHeight - height - 12,
        ),
      ) + "px";
    WorkTimeApp.ui.popover.point(popup, trigger);
  }
  function show() {
    if (trigger.closest("fieldset")?.disabled) return;
    month = (field("DateInput").value || time.businessDate(new Date())).slice(
      0,
      7,
    );
    resetSelection();
    popover.show();
    render();
    popup
      .querySelector(
        '.agenda-picker-day[aria-selected="true"]:not(.is-adjacent)',
      )
      ?.focus({ preventScroll: true });
  }
  function cancelPending() {
    if (anchor && previousRange) {
      field("DateInput").value = previousRange.start;
      field("EndDateInput").value = previousRange.end;
    }
    anchor = preview = "";
    previousRange = null;
  }
  function resetSelection() {
    cancelPending();
    activeEndpoint = "start";
    editingEndpoint = false;
    render();
  }
  function commit(start, end) {
    const value = ordered(start, end);
    field("DateInput").value = value.start;
    field("EndDateInput").value = value.end;
    anchor = preview = "";
    activeEndpoint = "start";
    editingEndpoint = false;
    field("DateInput").dispatchEvent(new Event("input", { bubbles: true }));
    previousRange = null;
    field("EndDateInput").dispatchEvent(new Event("input", { bubbles: true }));
  }
  function choose(date) {
    const value = completeRange();
    const other = activeEndpoint === "start" ? value.end : value.start;
    if (editingEndpoint && time.validDate(other)) {
      commit(
        activeEndpoint === "start" ? date : value.start,
        activeEndpoint === "end" ? date : value.end,
      );
    } else if (!anchor) {
      previousRange = completeRange();
      anchor = date;
      field("DateInput").value = date;
      field("EndDateInput").value = "";
      preview = "";
      activeEndpoint = "end";
    } else commit(anchor, date);
    render();
    popup
      .querySelector(`[data-picker-date="${date}"]:not(.is-adjacent)`)
      ?.focus({ preventScroll: true });
  }
  function activate(endpoint, focusCalendar = false) {
    if (anchor && endpoint === "end") {
      activeEndpoint = "end";
      if (focusCalendar) {
        month = anchor.slice(0, 7);
        render();
        popup
          .querySelector(`[data-picker-date="${anchor}"]:not(.is-adjacent)`)
          ?.focus({ preventScroll: true });
      }
      return;
    }
    cancelPending();
    activeEndpoint = endpoint;
    editingEndpoint = true;
    const date = field(
      endpoint === "start" ? "DateInput" : "EndDateInput",
    ).value;
    if (time.validDate(date))
      month =
        endpoint === "start"
          ? date.slice(0, 7)
          : offsetMonth(date.slice(0, 7), -1);
    render();
    if (focusCalendar && time.validDate(date)) {
      pickers[endpoint === "start" ? 0 : 1].setMonth(
        endpoint === "start" ? month : offsetMonth(month, 1),
        date,
      );
      popup
        .querySelector(`[data-picker-date="${date}"]:not(.is-adjacent)`)
        ?.focus({ preventScroll: true });
    }
  }
  for (const [name, endpoint] of [
    ["DateInput", "start"],
    ["EndDateInput", "end"],
  ]) {
    for (const event of ["focus", "click"]) {
      field(name).addEventListener(event, () => activate(endpoint), {
        signal: scope.signal,
      });
    }
    field(name).setAttribute("aria-describedby", prefix + "RangeStatus");
    field(endpoint === "start" ? "DateOpen" : "EndDateOpen").addEventListener(
      "click",
      () => activate(endpoint, true),
      { signal: scope.signal },
    );
    field(name).addEventListener(
      "change",
      () => {
        const value = completeRange();
        if (time.validDate(value.start) && time.validDate(value.end))
          commit(value.start, value.end);
        render();
      },
      { signal: scope.signal },
    );
  }
  trigger.addEventListener("click", () => (isOpen() ? close(true) : show()), {
    signal: scope.signal,
  });
  popup.addEventListener(
    "toggle",
    () => {
      trigger.setAttribute("aria-expanded", String(isOpen()));
      if (!isOpen()) resetSelection();
    },
    { signal: scope.signal },
  );
  popup.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
      }
      if (
        !root.contains(popup) &&
        event.key === "Enter" &&
        (event.ctrlKey || event.metaKey)
      ) {
        const forwarded = new KeyboardEvent("keydown", {
          key: event.key,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          isComposing: event.isComposing,
          bubbles: true,
          cancelable: true,
        });
        if (!root.dispatchEvent(forwarded)) event.preventDefault();
      }
    },
    { signal: scope.signal },
  );
  popup.addEventListener(
    "focusout",
    (event) => {
      if (
        event.relatedTarget instanceof Node &&
        !popup.contains(event.relatedTarget) &&
        event.relatedTarget !== trigger
      )
        close();
    },
    { signal: scope.signal },
  );
  popup
    .querySelector("[data-schedule-close]")
    .addEventListener("click", () => close(true), { signal: scope.signal });
  popup.querySelector("[data-schedule-today]").addEventListener(
    "click",
    () => {
      const today = time.businessDate(new Date());
      month = today.slice(0, 7);
      commit(today, today);
      render();
    },
    { signal: scope.signal },
  );
  root.addEventListener("invalid", show, {
    capture: true,
    signal: scope.signal,
  });
  window.addEventListener("resize", place, { signal: scope.signal });
  document.addEventListener(
    "scroll",
    (event) => {
      if (!isOpen() || popup.contains(event.target)) return;
      const rect = trigger.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > innerHeight) close();
      else place();
    },
    { capture: true, signal: scope.signal },
  );
  function values() {
    return {
      date: (anchor && previousRange ? previousRange : completeRange()).start,
      endDate: (anchor && previousRange ? previousRange : completeRange()).end,
      allDay: field("AllDay").checked,
      start: field("Start").value,
      end: field("End").value,
    };
  }
  function render() {
    const allDay = field("AllDay").checked,
      multiDay = values().endDate > values().date;
    popup.classList.toggle("is-timed", !allDay);
    for (const label of labels)
      label.textContent = t(label.dataset.scheduleLabel);
    popup.querySelector(`label[for="${prefix}End"]`).textContent = t(
      multiDay ? "endRequired" : "end",
    );
    field("EndDateInput").required = true;
    popup.querySelector("[data-schedule-close]").disabled =
      Boolean(anchor) ||
      !time.validDate(field("DateInput").value) ||
      !time.validDate(field("EndDateInput").value);
    for (const node of popup.querySelectorAll("[data-schedule-endpoint]"))
      node.classList.toggle(
        "is-active",
        node.dataset.scheduleEndpoint === activeEndpoint,
      );
    popup.querySelector(".agenda-schedule-status").textContent = t(
      anchor
        ? "selectRangeEnd"
        : editingEndpoint
          ? activeEndpoint === "start"
            ? "editRangeStart"
            : "editRangeEnd"
          : "selectRangeStart",
    );
    for (const node of popup.querySelectorAll(".agenda-schedule-time"))
      node.hidden = allDay;
    field("Start").required = !allDay;
    field("Start").disabled = allDay;
    field("End").disabled = allDay;
    field("End").required = !allDay && multiDay;
    const value = values();
    const formatted = (date, timeValue) =>
      date + (timeValue ? " " + timeValue : "");
    field("ScheduleSummary").textContent =
      formatted(value.date, allDay ? "" : value.start) +
      (multiDay
        ? " — " + formatted(value.endDate, allDay ? "" : value.end)
        : !allDay && value.end
          ? " — " + value.end
          : "") +
      (allDay ? " · " + t("allDay") : "");
    trigger.dataset.hintText = field("ScheduleSummary").textContent;
    popup.setAttribute("aria-label", t("dateTime"));
    if (!month)
      month = (value.date || time.businessDate(new Date())).slice(0, 7);
    if (month >= "9999-12") month = "9999-11";
    if (month < "1900-01") month = "1900-01";
    // Date grids are needed only while the editor's popover is visible.
    // Attendance startup and ordinary saves must not build hidden calendars.
    if (isOpen()) {
      pickers[0].setMonth(month);
      pickers[1].setMonth(offsetMonth(month, 1));
      place();
    }
  }
  popup.addEventListener(
    "input",
    (event) => {
      if (
        event.isTrusted &&
        event.target === field("DateInput") &&
        time.validDate(field("DateInput").value)
      )
        month = field("DateInput").value.slice(0, 7);
      if (
        event.isTrusted &&
        event.target === field("EndDateInput") &&
        time.validDate(field("EndDateInput").value)
      )
        month = offsetMonth(field("EndDateInput").value.slice(0, 7), -1);
      render();
      // Portaled controls still notify the form/editor that owns their values.
      if (!root.contains(popup))
        root.dispatchEvent(new Event("input", { bubbles: true }));
    },
    { signal: scope.signal },
  );
  popup.addEventListener(
    "invalid",
    () => {
      if (!root.contains(popup)) show();
    },
    { capture: true, signal: scope.signal },
  );
  return {
    values,
    render,
    close,
    setValue(value) {
      close();
      month = (value.date || time.businessDate(new Date())).slice(0, 7);
      field("DateInput").value = value.date || "";
      field("EndDateInput").value = value.endDate || value.date || "";
      anchor = preview = "";
      previousRange = null;
      activeEndpoint = "start";
      editingEndpoint = false;
      field("AllDay").checked = value.allDay ?? true;
      field("Start").value = value.start || "";
      field("End").value = value.end || "";
      render();
    },
    dispose() {
      close();
      popover.destroy();
      scope.abort();
      pickers.forEach((picker) => picker.dispose());
      WorkTimeApp.ui.workspaceViews.dispose(root);
    },
  };
};
