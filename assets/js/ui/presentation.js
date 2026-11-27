"use strict";

/** Format signed minutes before converting to hours, without decimal-hour rounding. */
WorkTimeApp.ui.hourMinuteParts = function (minutes) {
  const total = Math.round(Math.abs(minutes)),
    { number } = WorkTimeApp.i18n;
  const hours =
      (minutes < 0 && total ? "-" : "") +
      number(Math.floor(total / 60), { useGrouping: false }),
    remainder = number(total % 60, {
      useGrouping: false,
      minimumIntegerDigits: 2,
    });
  return { hours, minutes: remainder, text: hours + "h" + remainder + "m" };
};

/** Preserve independent rolling fields for signed hours and two-digit minutes. */
WorkTimeApp.ui.renderHourMinutes = function (
  element,
  minutes,
  { numbers = WorkTimeApp.ui.numbers, motion = true } = {},
) {
  const parts = WorkTimeApp.ui.hourMinuteParts(minutes);
  let hours = element.querySelector(".duration-hours"),
    remainder = element.querySelector(".duration-minutes");
  if (!hours || !remainder) {
    hours = document.createElement("span");
    hours.className = "duration-hours";
    remainder = document.createElement("span");
    remainder.className = "duration-minutes";
    element.replaceChildren(hours, remainder);
  }
  for (const [field, value, unit, reserveSign] of [
    [hours, parts.hours, "h", true],
    [remainder, parts.minutes, "m", false],
  ])
    numbers.set(field, value, {
      unit,
      reserveSign,
      animateInitial: false,
      preserveText: true,
      motion,
    });
};

/** Shared fixed-slot year/month renderer, used by both sidebar headers. */
WorkTimeApp.ui.renderYearMonth = function (
  label,
  year,
  month,
  {
    wordMonth = false,
    animateInitial = true,
    motion = true,
    numbers = WorkTimeApp.ui.numbers,
  } = {},
) {
  label.classList.toggle("has-word-month", wordMonth);
  numbers.set(label.querySelector(".year-month-year"), String(year), {
    animateInitial,
    motion,
  });
  numbers.set(label.querySelector(".year-month-month"), month, {
    animateInitial: animateInitial && !wordMonth,
    animateWhole: wordMonth,
    integerDigits: wordMonth ? 0 : 2,
    retainIntegerWidth: !wordMonth,
    digitAlign: "left",
    motion,
  });
};

/** Shared date stamp for the calendar and selected-day headers. */
WorkTimeApp.ui.headerDateMarkup = function (
  date,
  esc,
  { weekday = true } = {},
) {
  const divider =
    '<span class="calendar-date-divider" aria-hidden="true">/</span>';
  const { i18n } = WorkTimeApp;
  const parts = weekday ? i18n.date(date).split(/\s*\/\s*/) : date.split("-");
  return (
    '<span class="calendar-today-date' +
    (weekday ? "" : " year-month-label") +
    '">' +
    parts
      .map(
        (part, index) =>
          '<span class="calendar-today-number' +
          (weekday
            ? ""
            : index === 0
              ? " year-month-year"
              : " year-month-month" + (index === 2 ? " year-month-day" : "")) +
          '">' +
          esc(part) +
          "</span>",
      )
      .join(divider) +
    "</span>" +
    (weekday
      ? '<span class="calendar-today-separator" aria-hidden="true"></span><span class="calendar-today-weekday">' +
        esc(i18n.weekday(date)) +
        "</span>"
      : "")
  );
};

/** Work schedule shown above the template controls in both editors. */
WorkTimeApp.ui.scheduleDescription = function (schedule) {
  const clock = (minutes) =>
    String(Math.floor(minutes / 60)).padStart(2, "0") +
    ":" +
    String(minutes % 60).padStart(2, "0");
  const { i18n } = WorkTimeApp;
  return i18n.t("schedule.description", {
    start: schedule.workStart,
    end: schedule.workEnd,
    breaks:
      schedule.breaks
        .map((rest) => clock(rest.start) + "–" + clock(rest.end))
        .join(i18n.config.cjk ? "、" : ", ") || i18n.t("copy.1a8b4ad549"),
  });
};

/** Create an isolated presentation view; state/view getters remain live after restore and navigation. */
WorkTimeApp.ui.createDayPresentation = function (options) {
  const { core: C, getState, getView, now = () => new Date() } = options;

  function isFullLeave(day = {}, date = getView().selected) {
    const state = getState();
    return (
      day.leaveMinutes > 0 &&
      day.leaveMinutes >= C.scheduleForDate(state, date).standardMinutes
    );
  }
  function timeAnomaly(day = {}, r = C.effectiveRecord(day, true) || day.oa) {
    if (!r || r.effectiveMinutes != null || r.nextDay) return null;
    const start = C.timeMin(r.start),
      end = C.timeMin(r.end);
    return start !== null && end !== null && end < start
      ? { start: r.start, end: r.end }
      : null;
  }
  function stateLabel(day = {}, r = null, k = null) {
    const state = getState();
    const { today } = getView();
    if (timeAnomaly(day, r || day.oa)) return "anomaly";
    if (r && C.complete(r)) return r.manual ? "manual" : "oa";
    if (
      k === today &&
      r &&
      C.timeMin(r.start) !== null &&
      !r.end &&
      C.businessMinutes(now()) < C.timeMin(C.scheduleForDate(state, k).workEnd)
    )
      return "waiting";
    if (r && r.manual && (r.start || r.end)) return "pending";
    if (day.oa) return day.oa.status === "off" ? "absent" : "pending";
    if (
      k &&
      k <= today &&
      C.calendarInfo(k, day).work &&
      (day.leaveMinutes || 0) < C.scheduleForDate(state, k).standardMinutes
    )
      return "pending";
    return "empty";
  }
  function visibleStatus(label, info) {
    const { today, month } = getView();
    if (label === "pending" && month !== today.slice(0, 7)) return "";
    if ((info.holiday || !info.work) && label === "absent") return "";
    return WorkTimeApp.i18n.t(
      {
        anomaly: "copy.5caf279339",
        manual: "copy.85f1f8dfaf",
        oa: "copy.079b8cd375",
        pending: "copy.eb87bec8ca",
        waiting: "status.waitingForEnd",
        absent: "copy.90e8eea725",
        empty: "copy.287a1d1034",
      }[label],
    );
  }
  function tag(label, cls = "", title = "") {
    return WorkTimeApp.ui.native.createBadge({
      text: label,
      className: "pill " + cls,
      title,
      textClass: "pill-text",
    }).outerHTML;
  }
  function statusTag(label, info, cls = "") {
    const text = visibleStatus(label, info);
    if (text && label === "pending" && WorkTimeApp.i18n.language !== "zh-CN")
      return tag(
        WorkTimeApp.i18n.t("status.pending.short"),
        cls + " pending-entry",
        text,
      );
    return text ? tag(text, cls) : "";
  }
  return {
    isFullLeave,
    timeAnomaly,
    stateLabel,
    visibleStatus,
    tag,
    statusTag,
  };
};
