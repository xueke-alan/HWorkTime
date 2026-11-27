"use strict";

/** Create an isolated calendar view; state/view getters remain live after restore and navigation. */
WorkTimeApp.ui.createCalendar = function (options) {
  const {
    core: C,
    element: $,
    escape: esc,
    getState,
    getOriginalState = getState,
    getRevision = () => 0,
    getView,
    getRange: monthBounds,
    closeLeavePanel,
    renderTimeAnomalyNotice,
    updateNotificationEmptyState,
    stateLabel,
    isFullLeave,
    visibleStatus,
    statusTag,
    tag,
    year: WorkYear,
    document,
    numbers,
    weatherLayer,
    now = () => new Date(),
  } = options;
  let workEndTimer = null;
  let renderedMode = null,
    renderedSelection = null,
    renderedYearMode = null;
  const yearSnapshots = new Map();
  const oaRecordActions = $("oaRecordActions"),
    sidebarMonthText = $("sidebarYearMonthText"),
    sidebarMonthSlot = sidebarMonthText.parentElement;
  function renderYearMonth(label, year, month, options = {}) {
    WorkTimeApp.ui.renderYearMonth(label, year, month, { ...options, numbers });
  }
  function updateSidebarYearMonth(showMonth, month) {
    if (showMonth && sidebarMonthText.dataset.month !== month) {
      const year = month.slice(0, 4),
        monthNumber = String(Number(month.slice(5)));
      sidebarMonthText.dataset.month = month;
      sidebarMonthText.setAttribute("aria-label", `${year} / ${monthNumber}`);
      renderYearMonth(sidebarMonthText, year, monthNumber, {
        animateInitial: false,
        motion: renderedYearMode === true,
      });
    }
    if (showMonth && oaRecordActions.contains(document.activeElement))
      $("monthTitle").focus({ preventScroll: true });
    WorkTimeApp.ui.workspaceViews.oaActions.yearMode = showMonth;
    oaRecordActions.parentElement.classList.toggle("is-year-mode", showMonth);
    oaRecordActions.inert = showMonth;
    oaRecordActions.setAttribute("aria-hidden", String(showMonth));
    sidebarMonthSlot.setAttribute("aria-hidden", String(!showMonth));
  }
  let noteTicker = null;
  const noteIndexes = new Map();
  function tickNotes() {
    if (!detailDrawing) return;
    if (!detailDrawing.tracks) {
      detailDrawing.tracks = [
        ...$("calendar").querySelectorAll(
          ".year-ink:not(.is-outgoing) [data-year-note-date]",
        ),
      ].map((track) => ({
        track,
        date: track.dataset.yearNoteDate,
        count: track.children.length,
      }));
    }
    for (const item of detailDrawing.tracks) {
      const index = ((noteIndexes.get(item.date) || 0) + 1) % item.count;
      noteIndexes.set(item.date, index);
      item.track.style.setProperty("--year-note-index", String(index));
    }
    if (noteIndexes.size > 1000) noteIndexes.clear();
  }
  function syncNoteTicker(active) {
    if (
      active &&
      getView().yearViewMode === "calendar" &&
      !document.hidden &&
      !WorkTimeApp.ui.animationCompat.preference().matches
    ) {
      if (!noteTicker) noteTicker = window.setInterval(tickNotes, 2600);
    } else {
      if (noteTicker) window.clearInterval(noteTicker);
      noteTicker = null;
    }
  }
  function refreshNoteTicker() {
    const view = getView();
    syncNoteTicker(view.yearMode && !view.analysisMode);
  }
  const stopNoteTicker = () => {
    cancelYearPreparation();
    finishYearFade();
    syncNoteTicker(false);
  };
  document.addEventListener("visibilitychange", refreshNoteTicker);
  document.addEventListener("worktime:yearviewchange", refreshNoteTicker);
  WorkTimeApp.ui.animationCompat
    .preference()
    .addEventListener("change", refreshNoteTicker);
  window.addEventListener("pagehide", stopNoteTicker);
  function yearLegendParts() {
    const legend = $("yearLegend");
    if (!legend.querySelector(".year-scale > .year-gradient"))
      legend.innerHTML =
        '<span class="year-scale"><span class="year-min"></span><span class="year-gradient" aria-hidden="true"></span><span class="year-max"></span></span>';
    return {
      scale: legend.querySelector(".year-scale"),
      min: legend.querySelector(".year-min"),
      gradient: legend.querySelector(".year-gradient"),
      max: legend.querySelector(".year-max"),
    };
  }
  function setYearLegendLabels(entries) {
    for (const [label, text] of entries) {
      if (label.textContent !== text) label.textContent = text;
      label.setAttribute("aria-hidden", String(!text));
    }
  }

  const {
    updateText,
    updateCalendar,
    updateYearCalendar,
    finishYearFade,
    prepareYearGrid,
  } = WorkTimeApp.ui.createCalendarRenderer({
    element: $,
    document,
    weatherLayer,
    numbers,
  });
  function timePart(value, manual) {
    return (
      '<span class="day-time-value' +
      (manual ? " manual-time" : "") +
      '">' +
      esc(value) +
      "</span>"
    );
  }
  function sourceIndicator(day, record) {
    const dot = (source, attributes = ' aria-hidden="true"') =>
      '<svg class="record-source-dot ' +
      source +
      '" viewBox="0 0 20 20" preserveAspectRatio="xMidYMid meet" focusable="false"' +
      attributes +
      '><circle cx="10" cy="10" r="10"/></svg>';
    const manual = WorkTimeApp.domain.records.manualSource(day),
      oa = day.oa && (day.oa.start || day.oa.end) ? day.oa : null,
      both = !!(oa && manual),
      priority =
        !oa || (both && day.sourcePriority === "manual") ? "manual" : "oa";
    if (!both && (!record || priority === "oa")) return "";
    let hint = WorkTimeApp.i18n.t("source." + priority);
    if (record?.filledStart)
      hint += " · " + WorkTimeApp.i18n.t("source.filledStart");
    if (record?.filledEnd)
      hint += " · " + WorkTimeApp.i18n.t("source.filledEnd");
    if (both)
      hint +=
        " · " +
        WorkTimeApp.i18n.t(
          priority === "oa" ? "source.switchManual" : "source.switchOA",
        );
    const hintDetails =
      ' data-source-hint="' +
      esc(
        JSON.stringify({
          priority,
          filledStart: !!record?.filledStart,
          filledEnd: !!record?.filledEnd,
          switchable: both,
        }),
      ) +
      '"';
    return both
      ? '<button data-ui="button" type="button" class="record-source-pair source-toggle ' +
          priority +
          '" data-source-date="' +
          oa.date +
          '" data-hint-text="' +
          esc(hint) +
          '" aria-label="' +
          esc(hint) +
          '" aria-pressed="' +
          (priority === "manual") +
          '"' +
          hintDetails +
          (getView().batchMode ? " disabled" : "") +
          ">" +
          dot("oa") +
          dot("manual") +
          "</button>"
      : dot(
          priority,
          ' role="img" data-hint-text="' +
            esc(hint) +
            '" aria-label="' +
            esc(hint) +
            '"' +
            hintDetails,
        );
  }
  const dateDivider =
    '<span class="calendar-date-divider month-title-divider" aria-hidden="true">/</span>';

  function dateMarkers(date, payday, paydayHint) {
    const start = getState().personal.employmentDate,
      markers = [];
    const monthDay = start.slice(5),
      anniversary =
        monthDay === "02-29" && !C.validDate(date.slice(0, 4) + "-02-29")
          ? "03-01"
          : monthDay;
    if (C.validDate(start) && date >= start && date.slice(5) === anniversary) {
      const years = Number(date.slice(0, 4)) - Number(start.slice(0, 4)),
        label = years
          ? WorkTimeApp.i18n.t("copy.c4c111ae99") +
            years +
            WorkTimeApp.i18n.t("copy.f863e74bcf")
          : WorkTimeApp.i18n.t("copy.847b185d92");
      markers.push({
        label,
        hint: label + WorkTimeApp.i18n.t("copy.3a2fd0b35a") + start,
        className: " employment-icon",
        icon: '<use href="#icon-user" x="11" y="11" width="78" height="78" fill="currentColor"/>',
      });
    }
    if (date === payday.date)
      markers.push({
        label: WorkTimeApp.i18n.t("copy.85b0268523"),
        hint: paydayHint,
        className: "",
        icon: '<use href="#icon-currency-yen" x="11" y="11" width="78" height="78" fill="currentColor"/>',
      });
    return {
      label: markers.map((marker) => " " + marker.label).join(""),
      html: markers.length
        ? '<span class="date-markers" role="img" tabindex="0" aria-label="' +
          esc(markers.map((marker) => marker.label).join("、")) +
          '" data-date-marker-hint="' +
          esc(markers.map((marker) => marker.hint).join("\n")) +
          '">' +
          markers
            .map(
              (marker) =>
                '<svg class="payday-icon' +
                marker.className +
                '" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><circle cx="50" cy="50" r="50" fill="var(--date-marker-background)"/>' +
                marker.icon +
                "</svg>",
            )
            .join("") +
          "</span>"
        : "",
    };
  }

  function updateMonthTitle(year, month, yearMode) {
    const title = $("monthTitle");
    const wordMonth = !WorkTimeApp.i18n.config.cjk;
    if (!title.querySelector(".month-title-divider")) {
      title.innerHTML =
        '<span id="monthTitleYear" class="month-title-year year-month-year" data-number-motion></span>' +
        dateDivider +
        '<span id="monthTitleMonth" class="month-title-month year-month-month" data-number-motion></span>';
    }
    const monthLabel = wordMonth
      ? WorkTimeApp.i18n.monthName(
          year + "-" + String(month).padStart(2, "0") + "-01",
        )
      : String(month);
    renderYearMonth(title, year, monthLabel, { wordMonth });
    title.classList.toggle("is-year-title", yearMode);
    title
      .querySelector(".month-title-month")
      .setAttribute("aria-hidden", String(yearMode));
  }

  function monthWorkdayNumber(k) {
    const state = getState();
    let count = 0;
    for (let day = 1; day <= Number(k.slice(8)); day++) {
      const date = k.slice(0, 7) + "-" + C.pad(day);
      if (C.calendarInfo(date, state.days[date] || {}).work) count++;
    }
    return count;
  }
  function hasScheduleChange(
    state,
    date,
    schedule = C.scheduleForDate(state, date),
  ) {
    const previous = C.localDate(date);
    previous.setDate(previous.getDate() - 1);
    const previousDate = C.dateKey(previous);
    return (
      C.validDate(previousDate) &&
      C.scheduleSignature(schedule) !==
        C.scheduleSignature(C.scheduleForDate(state, previousDate))
    );
  }
  function scheduleChangeTag() {
    return (
      WorkTimeApp.i18n.t("copy.b3d0a0f476") +
      tag(WorkTimeApp.i18n.t("copy.7b74743705"), "blue") +
      "</div>"
    );
  }
  function calendarKind(info) {
    const label = info.label.replace(" · 手动", "");
    const key = {
      工作日: "work",
      休息日: "off",
      调休日: "makeup",
      奋斗日: "extra",
      周末: "off",
    }[label];
    return key
      ? WorkTimeApp.i18n.t("calendar.kind." + key)
      : WorkTimeApp.i18n.message(label);
  }
  function dayLunar(date) {
    const lunar = WorkYear.lunarLabel(
      date,
      WorkTimeApp.services.dateInfo.calendarLunar,
    );
    return '<span class="day-lunar">' + esc(lunar) + "</span>";
  }
  function worktimeCorner(calc, standardMinutes) {
    if (!calc.work || calc.minutes === null || calc.minutes >= standardMinutes)
      return "";
    return '<span class="worktime-corner is-short" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><use href="#icon-person-simple-run"/></svg></span>';
  }
  function belowOvertimeTarget(minutes, targetMinutes, displayedHours) {
    if (
      !Number.isFinite(minutes) ||
      !Number.isFinite(targetMinutes) ||
      minutes >= targetMinutes
    )
      return false;
    const { duration } = WorkTimeApp.i18n,
      targetHours = duration(targetMinutes);
    return (
      displayedHours !== targetHours &&
      !(targetHours === duration(0) && displayedHours === duration(-0))
    );
  }
  function plannedOvertimeAverage(state, date, cache) {
    const cursor = C.localDate(date);
    let remaining = 2;
    while (remaining) {
      cursor.setDate(cursor.getDate() - 1);
      const reference = C.dateKey(cursor);
      if (!C.validDate(reference)) return { date: null, minutes: null };
      if (!C.calendarInfo(reference, state.days[reference] || {}).work)
        continue;
      if (--remaining) continue;
      if (!cache.has(reference)) {
        const average = C.cumulativeAverageOvertime(
          state,
          reference.slice(0, 7) + "-01",
          reference,
        )[reference]?.averageMinutes;
        cache.set(reference, average ?? null);
      }
      return { date: reference, minutes: cache.get(reference) };
    }
  }
  function adjacentDayCard(k) {
    const state = getState();
    const view = getView();
    const highlighted =
      view.calendarSelected === undefined
        ? view.selected
        : view.calendarSelected;
    const info = C.calendarInfo(k, state.days[k] || {}),
      date = C.localDate(k),
      scheduleChanged = hasScheduleChange(state, k),
      kind =
        calendarKind(info) + (info.work ? " " + monthWorkdayNumber(k) : "");
    const classes = [
      "day",
      "adjacent",
      !view.batchMode && highlighted === k ? "selected" : "",
      !info.work ? "restday" : "",
      info.weekend ? "weekend" : "",
    ]
      .filter(Boolean)
      .join(" ");
    return (
      '<div class="' +
      classes +
      '" data-preview-date="' +
      k +
      '"' +
      (info.holiday ? ' data-holiday="' + esc(info.holiday) + '"' : "") +
      (info.festival ? ' data-festival="' + esc(info.festival) + '"' : "") +
      ' aria-label="' +
      k +
      " " +
      esc(kind) +
      (scheduleChanged ? WorkTimeApp.i18n.t("copy.591a8a36f9") : "") +
      '"><div class="daytop"><span class="daynum">' +
      date.getDate() +
      "<small>" +
      esc(WorkTimeApp.i18n.monthName(k)) +
      '</small></span><span class="daykind">' +
      esc(kind) +
      '</span></div><div class="daytime">' +
      dayLunar(k) +
      "</div>" +
      (scheduleChanged
        ? '<div class="day-footer"><div class="daystatus"><div class="day-status-tags">' +
          scheduleChangeTag() +
          "</div></div></div>"
        : "") +
      "</div>"
    );
  }
  function renderCalendar(keepLeavePanel = false) {
    window.clearTimeout(workEndTimer);
    workEndTimer = null;
    const state = getState();
    const {
      today,
      month,
      selected,
      calendarSelected = selected,
      batchMode,
      batchDays,
      batchDraft,
      batchSaving,
      yearMode,
      analysisMode,
    } = getView();
    updateSidebarYearMonth(yearMode && !analysisMode, month);
    const yearWatermark = $("yearWatermark");
    if (!yearMode) {
      // Leaving the year page belongs to the page transition. Do not leave a
      // separately fading watermark over the destination calendar.
      yearWatermark.classList.remove("is-mode-transition", "is-visible");
    }
    yearWatermark.classList.toggle(
      "is-visible",
      yearMode && !analysisMode && getView().yearViewMode === "calendar",
    );
    for (const id of ["prevMonth", "nextMonth", "todayButton"])
      $(id).disabled = batchMode;
    $("monthTitle").setAttribute("aria-disabled", String(batchMode));
    $("monthTitle").tabIndex = batchMode ? -1 : 0;
    for (const date of batchDays)
      if (
        date.slice(0, 7) !== month ||
        !C.canBatchEditDate(getOriginalState(), date)
      )
        batchDays.delete(date);
    if (!keepLeavePanel) closeLeavePanel();
    const viewChanged =
      renderedYearMode !== null && renderedYearMode !== yearMode;
    renderedYearMode = yearMode;
    $("calendar").classList.toggle("year-calendar", yearMode);
    $("calendar").classList.toggle(
      "year-calendar-detail",
      yearMode && getView().yearViewMode === "calendar",
    );
    $("calendar").classList.toggle("is-batch-editing", batchMode && !yearMode);
    document
      .querySelector("#panelContent>.weekdays")
      .classList.toggle("hidden", yearMode);
    $("yearLegend").classList.toggle("hidden", !yearMode);
    if (!yearMode) {
      $("yearLegend").classList.remove("is-inactive");
      $("yearLegend").removeAttribute("aria-hidden");
    }
    if (!yearMode || analysisMode) {
      stopNoteTicker();
      detailDrawing = null;
    }
    $("batchToggle").disabled = analysisMode;
    $("analysisToggle").disabled = batchMode;
    const agendaMode = $("agendaMode");
    if (agendaMode) agendaMode.disabled = batchMode;
    $("analysisToggle").setAttribute("aria-pressed", String(!!analysisMode));
    $("analysisToggle").classList.toggle("is-active", !!analysisMode);
    const analysisLabel = analysisMode
      ? "analysis.calendar"
      : "analysis.toggle";
    for (const attribute of ["data-hint-text", "aria-label"])
      $("analysisToggle").setAttribute(
        attribute,
        WorkTimeApp.i18n.t(analysisLabel),
      );
    $("analysisToggle").setAttribute("data-i18n-hint-text", analysisLabel);
    $("analysisToggle").setAttribute("data-i18n-aria-label", analysisLabel);
    $("analysisToggle").dataset.actionHint = analysisMode
      ? "agenda.monthView"
      : "";
    $("calendar").classList.toggle("hidden", !!analysisMode);
    $("analysisPage").hidden = !analysisMode;
    $("analysisSidebar").hidden = !analysisMode;
    $("yearAnalysisSidebar").hidden = !yearMode || !!analysisMode;
    document
      .querySelector(".workspace > .editor")
      .classList.toggle("is-analysis-mode", !!analysisMode);
    document
      .querySelector(".workspace > .editor")
      .classList.toggle("is-year-view", !!yearMode && !analysisMode);
    if (analysisMode) {
      document.querySelector("#panelContent>.weekdays").classList.add("hidden");
      $("yearLegend").classList.add("hidden");
      $("monthTitle").setAttribute("aria-disabled", "true");
      $("monthTitle").setAttribute("aria-pressed", "false");
      $("monthTitle").tabIndex = -1;
      updateMonthTitle(
        Number(month.slice(0, 4)),
        Number(month.slice(5)),
        false,
      );
      $("monthTitle").setAttribute(
        "aria-label",
        WorkTimeApp.i18n.t("analysis.title"),
      );
      for (const [id, key] of [
        ["prevMonth", "copy.69bb1687b5"],
        ["nextMonth", "copy.8c9b38e26d"],
      ])
        $(id).setAttribute("aria-label", WorkTimeApp.i18n.t(key));
      updateText($("calendarFoot"), WorkTimeApp.i18n.t("analysis.footer"));
      options.renderAnalysis();
      return;
    }
    $("monthTitle").setAttribute("aria-pressed", String(yearMode));
    $("monthTitle").dataset.actionHint = yearMode
      ? "agenda.monthView"
      : "calendarHint.yearView";
    $("monthTitle").setAttribute(
      "aria-label",
      yearMode
        ? WorkTimeApp.i18n.t("copy.ae8e82c4fe")
        : WorkTimeApp.i18n.t("copy.d298e51191"),
    );
    $("prevMonth").setAttribute(
      "aria-label",
      yearMode
        ? WorkTimeApp.i18n.t("copy.cbd823c1d8")
        : WorkTimeApp.i18n.t("copy.69bb1687b5"),
    );
    $("nextMonth").setAttribute(
      "aria-label",
      yearMode
        ? WorkTimeApp.i18n.t("copy.743fc07e03")
        : WorkTimeApp.i18n.t("copy.8c9b38e26d"),
    );
    if (yearMode) {
      renderYear();
      syncNoteTicker(true);
      // The page transition already animates the incoming year.
      return;
    }
    const modeChanged = renderedMode !== null && renderedMode !== batchMode,
      selectionChanged =
        renderedSelection !== null && renderedSelection !== calendarSelected;
    const monthViewYear = month.slice(0, 4),
      yearNotice = $("yearNotice");
    updateMonthTitle(Number(monthViewYear), Number(month.slice(5)), false);
    updateText(
      yearNotice.querySelector(".notification-body"),
      monthViewYear + WorkTimeApp.i18n.t("copy.29c9747e36"),
    );
    yearNotice.classList.toggle("hidden", C.calendarKnown(month + "-01"));
    const [first, last] = monthBounds(),
      d = C.localDate(first),
      offset = (d.getDay() + 6) % 7,
      total = Number(last.slice(8)),
      weeks = Math.ceil((offset + total) / 7),
      targetMinutes = C.selectOvertimeRequirement(
        state,
        first,
        last,
      ).targetMinutes;
    let html = "",
      workdayNumber = 0,
      counts = { actual: 0, estimate: 0, pending: 0 },
      dailyAverages = C.cumulativeAverageOvertime(state, first, last);
    const originalAverages = batchMode
      ? C.cumulativeAverageOvertime(getOriginalState(), first, last)
      : dailyAverages;
    const payday = C.payday(first),
      paydayHint =
        WorkTimeApp.i18n.t("copy.15c1a8dfb5") +
        payday.date +
        (payday.shiftedDays
          ? WorkTimeApp.i18n.t("copy.b1480c35fe") +
            payday.scheduled +
            WorkTimeApp.i18n.t("copy.842a40aa88") +
            payday.shiftedDays +
            WorkTimeApp.i18n.t("copy.f8bb0516cc")
          : WorkTimeApp.i18n.t("copy.f0fe1c4624")) +
        (!payday.calendarKnown ? WorkTimeApp.i18n.t("copy.2c2643b936") : "");
    for (let i = offset; i > 0; i--) {
      const preview = C.localDate(first);
      preview.setDate(preview.getDate() - i);
      html += adjacentDayCard(C.dateKey(preview));
    }
    const plannedAverages = new Map();
    for (let i = 1; i <= total; i++) {
      const k = month + "-" + C.pad(i),
        day = state.days[k] || {},
        batchEligible = batchMode && C.canBatchEditDate(getOriginalState(), k),
        info = C.calendarInfo(k, day),
        r = C.effectiveRecord(day, true),
        schedule = C.scheduleForDate(state, k),
        scheduleChanged = hasScheduleChange(state, k, schedule),
        calc = C.calculate(k, day, schedule, true),
        planned = !!day.plannedOvertime && k >= today,
        showPlannedHours =
          planned &&
          !info.work &&
          !r?.start &&
          !r?.end &&
          calc.minutes === null,
        plannedAverage = showPlannedHours
          ? plannedOvertimeAverage(state, k, plannedAverages)
          : null,
        plannedHours = plannedAverage
          ? WorkTimeApp.i18n.duration(plannedAverage.minutes)
          : "",
        plannedTarget = showPlannedHours
          ? C.selectOvertimeRequirement(state, first, k).targetMinutes
          : null,
        plannedBelowTarget = belowOvertimeTarget(
          plannedAverage?.minutes,
          plannedTarget,
          plannedHours,
        ),
        plannedReference = plannedAverage?.date
          ? WorkTimeApp.i18n.t("calendar.plannedHoursReference", {
              date: plannedAverage.date,
            })
          : "",
        restOvertime = !info.work && calc.minutes > 0,
        label = stateLabel(day, r, k),
        markers = dateMarkers(k, payday, paydayHint),
        kindLabel =
          calendarKind(info) + (info.work ? " " + ++workdayNumber : "");
      if (label === "waiting")
        workEndTimer = window.setTimeout(
          () => renderCalendar(true),
          Math.max(
            1,
            Date.parse(k + "T" + schedule.workEnd + ":00+08:00") -
              now().getTime(),
          ),
        );
      if (r && C.complete(r)) {
        counts[r.type === "estimate" ? "estimate" : "actual"]++;
      } else if (day.oa && day.oa.status === "pending") counts.pending++;
      const classes = [
        "day",
        batchMode && batchEligible ? "batch-eligible" : "",
        !info.work ? "restday" : "",
        info.weekend ? "weekend" : "",
        restOvertime || (!info.work && planned) ? "rest-overtime" : "",
        !info.work && planned && !restOvertime ? "planned-overtime-day" : "",
        isFullLeave(day, k)
          ? "full-leave"
          : day.leaveMinutes
            ? "partial-leave"
            : "",
        calendarSelected === k && !batchMode ? "selected" : "",
        batchDays.has(k) && batchMode ? "batchselected" : "",
        k === today ? "today" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const average = dailyAverages[k]?.averageMinutes,
        showAverage =
          calc.minutes !== null &&
          info.work &&
          (k <= today || (r && r.manual && C.complete(r))),
        averageAffected =
          batchMode && average !== originalAverages[k]?.averageMinutes,
        averageText = !showAverage
          ? ""
          : average === null
            ? "—"
            : WorkTimeApp.i18n.duration(average);
      const previous = C.localDate(k);
      previous.setDate(previous.getDate() - 1);
      const previousAverage =
        C.dateKey(previous) >= first
          ? dailyAverages[C.dateKey(previous)]?.averageMinutes
          : null;
      const trend =
          !averageText || average === null
            ? ""
            : previousAverage === null
              ? "flat"
              : Number((average / 60).toFixed(2)) >
                  Number((previousAverage / 60).toFixed(2))
                ? "up"
                : Number((average / 60).toFixed(2)) <
                    Number((previousAverage / 60).toFixed(2))
                  ? "down"
                  : "flat",
        trendLabel =
          trend === "up"
            ? WorkTimeApp.i18n.t("copy.d37c9f22e9")
            : trend === "down"
              ? WorkTimeApp.i18n.t("copy.7723588f37")
              : trend === "flat"
                ? previousAverage === null
                  ? WorkTimeApp.i18n.t("copy.c12b114307")
                  : WorkTimeApp.i18n.t("copy.c00f2c4258")
                : "";
      const time = showPlannedHours
          ? ""
          : r && C.complete(r)
            ? timePart(
                r.start || WorkTimeApp.i18n.t("copy.e7909cfbfe"),
                r.manual || r.filledStart,
              ) +
              (r.end
                ? " – " +
                  timePart(
                    r.end + (r.nextDay ? "⁺¹" : ""),
                    r.manual || r.filledEnd,
                  )
                : "")
            : r
              ? timePart(
                  r.start || WorkTimeApp.i18n.t("copy.7c8d65e331"),
                  !!r.start && (r.manual || r.filledStart),
                ) +
                " – " +
                timePart(
                  r.end || WorkTimeApp.i18n.t("copy.7c8d65e331"),
                  !!r.end && (r.manual || r.filledEnd),
                )
              : "",
        sourceDot = showPlannedHours ? "" : sourceIndicator(day, r);
      html +=
        '<div class="' +
        classes +
        '" data-date="' +
        k +
        '"' +
        (batchMode && !batchEligible ? ' aria-disabled="true"' : "") +
        (info.holiday ? ' data-holiday="' + esc(info.holiday) + '"' : "") +
        (info.festival ? ' data-festival="' + esc(info.festival) + '"' : "") +
        ' aria-pressed="' +
        (batchMode ? batchDays.has(k) : calendarSelected === k) +
        '" aria-label="' +
        k +
        " " +
        esc(kindLabel) +
        " " +
        visibleStatus(label, info) +
        (scheduleChanged ? WorkTimeApp.i18n.t("copy.591a8a36f9") : "") +
        (calc.minutes !== null
          ? info.work
            ? WorkTimeApp.i18n.t("copy.5322471ae6") +
              WorkTimeApp.i18n.duration(calc.overtime)
            : WorkTimeApp.i18n.t("copy.6d645904e4") +
              WorkTimeApp.i18n.duration(calc.minutes)
          : "") +
        (showPlannedHours
          ? " " +
            esc(WorkTimeApp.i18n.t("calendar.plannedHours")) +
            " " +
            esc(plannedHours) +
            " " +
            esc(plannedReference)
          : "") +
        (averageText
          ? WorkTimeApp.i18n.t("copy.dc516fa88c") +
            averageText +
            (trendLabel ? "，" + trendLabel : "")
          : "") +
        (isFullLeave(day, k)
          ? WorkTimeApp.i18n.t("copy.732f79dc36")
          : day.leaveMinutes
            ? WorkTimeApp.i18n.t("copy.1ee7ecb783") +
              C.hours(day.leaveMinutes) +
              "h"
            : "") +
        markers.label +
        '"><div class="daytop"><span class="day-date"><span class="daynum"><span class="daynum-text">' +
        i +
        "</span></span>" +
        markers.html +
        '</span><span class="daykind">' +
        esc(kindLabel) +
        '</span></div><div class="daytime"><span class="daytime-content">' +
        (showPlannedHours
          ? '<span class="day-planned-label">' +
            esc(WorkTimeApp.i18n.t("calendar.plannedHours")) +
            "</span>"
          : time + sourceDot) +
        "</span>" +
        dayLunar(k) +
        '</div><div class="dayhours">' +
        (showPlannedHours
          ? '<div class="day-planned-summary"><span class="day-total-hours day-planned-hours' +
            (plannedBelowTarget ? " below-target" : "") +
            '" data-reference-date="' +
            (plannedAverage.date || "") +
            '">' +
            esc(plannedHours) +
            "</span></div>"
          : calc.minutes !== null
            ? '<span class="day-total-hours">' +
              WorkTimeApp.i18n.duration(calc.minutes) +
              "</span>" +
              (info.work
                ? '<span data-minutes="' +
                  calc.overtime +
                  '" class="day-overtime' +
                  (calc.overtime < 0 ? " negative" : "") +
                  WorkTimeApp.i18n.t("copy.886690f618") +
                  WorkTimeApp.ui.hourMinuteParts(calc.overtime).text +
                  "</span>"
                : "")
            : "") +
        '</div><div class="day-footer"><div class="day-average' +
        (averageAffected && averageText ? " batch-average-affected" : "") +
        '" data-hint-text="' +
        esc(
          WorkTimeApp.i18n.t("copy.1e6a453ebc") +
            (dailyAverages[k].pending
              ? WorkTimeApp.i18n.t("copy.809f2ba84f")
              : "") +
            (trendLabel ? "；" + trendLabel : ""),
        ) +
        '">' +
        (averageText
          ? '<span class="day-average-value' +
            (belowOvertimeTarget(average, targetMinutes, averageText)
              ? " below-target"
              : "") +
            '">' +
            averageText +
            "</span>"
          : "") +
        '</div><div class="daystatus"><div class="day-status-tags">' +
        (["empty", "manual", "oa"].includes(label)
          ? ""
          : statusTag(
              label,
              info,
              label === "anomaly"
                ? "red"
                : label === "pending"
                  ? "amber"
                  : label === "waiting" || (r && r.manual)
                    ? "blue"
                    : label === "absent"
                      ? ""
                      : "green",
            )) +
        (restOvertime
          ? "<div>" +
            tag(WorkTimeApp.i18n.t("short.preview.ot"), "green overtime") +
            "</div>"
          : !info.work && planned
            ? "<div>" +
              tag(WorkTimeApp.i18n.t("copy.3cf2307526"), "overtime-plan") +
              "</div>"
            : "") +
        (scheduleChanged ? scheduleChangeTag() : "") +
        (day.leaveMinutes
          ? isFullLeave(day, k)
            ? "<div>" +
              tag(WorkTimeApp.i18n.t("copy.0c09c38655"), "leave") +
              "</div>"
            : "<div>" +
              tag(
                WorkTimeApp.i18n.t("copy.326f400f75") +
                  C.hours(day.leaveMinutes) +
                  "h",
                "leave",
              ) +
              "</div>"
          : "") +
        "</div>" +
        worktimeCorner(calc, schedule.standardMinutes) +
        "</div></div></div>";
    }
    for (let i = 1; i <= weeks * 7 - offset - total; i++) {
      const preview = C.localDate(last);
      preview.setDate(preview.getDate() + i);
      html += adjacentDayCard(C.dateKey(preview));
    }
    // Multiweek views may extend beyond the month's final calendar row.
    // Generate those dates with the same adjacent-day component and keyed renderer.
    if (getView().agendaViewWeeks > 1) {
      const end = C.localDate(getView().agendaViewAnchor || selected);
      end.setDate(
        end.getDate() -
          ((end.getDay() + 6) % 7) +
          getView().agendaViewWeeks * 7 -
          1,
      );
      const next = C.localDate(last);
      next.setDate(next.getDate() + weeks * 7 - offset - total + 1);
      while (next <= end) {
        html += adjacentDayCard(C.dateKey(next));
        next.setDate(next.getDate() + 1);
      }
    }
    $("calendar").dataset.weeks = weeks;
    // Batch mode only changes controls and selection, not attendance content.
    updateCalendar(html, { animateContent: !modeChanged });
    updateText(
      $("calendarFoot"),
      WorkTimeApp.i18n.t("copy.222e6cef7c") +
        (counts.actual + counts.estimate) +
        WorkTimeApp.i18n.t("copy.8d46bff7bf") +
        C.pendingWorkdays(state, first, last, today) +
        WorkTimeApp.i18n.t("copy.85bd9f454a"),
    );
    renderTimeAnomalyNotice();
    const batchBar = $("batchBar");
    if (batchMode === batchBar.classList.contains("hidden")) {
      const toolbar = batchBar.querySelector(".batch-toolbar");
      const parent = batchBar.parentElement;
      parent.querySelector(".batch-toolbar-outgoing")?.remove();
      if (!batchMode && !WorkTimeApp.ui.animationCompat.preference().matches) {
        const { left, top, width, height } = toolbar.getBoundingClientRect();
        if (width && height) {
          const outgoing = toolbar.cloneNode(true);
          outgoing.classList.add("batch-toolbar-outgoing");
          outgoing.inert = true;
          outgoing.setAttribute("aria-hidden", "true");
          for (const child of outgoing.querySelectorAll("[id]"))
            child.removeAttribute("id");
          Object.assign(outgoing.style, {
            left: left + "px",
            top: top + "px",
            width: width + "px",
            height: height + "px",
          });
          outgoing.style.setProperty(
            "--row-spacing",
            getComputedStyle(toolbar).columnGap,
          );
          parent.append(outgoing);
          WorkTimeApp.ui.animationCompat
            .animate(
              outgoing,
              [
                { opacity: Number(getComputedStyle(toolbar).opacity) },
                { opacity: 0 },
              ],
              { duration: 160, easing: "ease-out", fill: "forwards" },
            )
            .finished.then(
              () => outgoing.remove(),
              () => outgoing.remove(),
            );
        }
      }
      batchBar.classList.toggle("hidden", !batchMode);
    }
    $("dayEditor").classList.toggle("hidden", batchMode);
    if (modeChanged) {
      WorkTimeApp.ui.motion?.refreshEditorTitle();
    }
    const batchToggle = $("batchToggle"),
      pressed = String(batchMode);
    if (batchToggle.getAttribute("aria-pressed") !== pressed)
      batchToggle.setAttribute("aria-pressed", pressed);
    batchToggle.dataset.hintText = batchMode
      ? WorkTimeApp.i18n.t("copy.03b15bbfb8")
      : WorkTimeApp.i18n.t("copy.3f712eac83");
    WorkTimeApp.ui.motion.setToggleIcon(
      batchToggle,
      batchMode,
      "#icon-stacks",
      modeChanged,
    );
    batchToggle.setAttribute(
      "aria-label",
      batchMode
        ? WorkTimeApp.i18n.t("copy.03b15bbfb8")
        : WorkTimeApp.i18n.t("copy.3f712eac83"),
    );
    $("batchSave").disabled = !batchDraft?.canConfirm || !!batchSaving;
    $("batchCancel").disabled = batchToggle.disabled = !!batchSaving;
    $("batchAutoSelect").disabled = !!batchSaving;
    $("batchReset").disabled = !!batchSaving || !batchDays.size;
    $("batchClearSelection").disabled = !!batchSaving || !batchDays.size;
    updateText(
      $("batchSelectionCount"),
      WorkTimeApp.i18n.t("batch.selected", { count: batchDays.size }),
    );
    updateText(
      $("batchSave").querySelector(".button-label"),
      WorkTimeApp.i18n.t("batch.saveShort"),
    );
    $("cards").classList.toggle("is-batch-preview", batchMode);
    // Dragging owns the visual feedback. Saving a move or resize is not a day click.
    if (
      selectionChanged &&
      !batchMode &&
      !document.body.classList.contains("agenda-is-dragging")
    )
      WorkTimeApp.ui.motion?.play(
        $("calendar").querySelector(".selected"),
        "motion-selection",
      );
    if (viewChanged)
      WorkTimeApp.ui.motion?.play($("calendar"), "motion-calendar-view");
    renderedMode = batchMode;
    renderedSelection = calendarSelected;
  }
  let detailDrawing = null;
  function detailCells(month, blanks, trailing, badges) {
    function badgeMarkup(badge) {
      if (!badge) return "";
      if (!badges.has(badge))
        badges.set(
          badge,
          WorkTimeApp.ui.native.createBadge({
            className: "year-day-badge is-" + badge,
            hiddenLabel: true,
            text: WorkTimeApp.i18n.t(
              badge === "rest" ? "yearView.restBadge" : "yearView.workBadge",
            ),
          }).outerHTML,
        );
      return badges.get(badge);
    }

    function detailCell(d) {
      const notes = [d.lunar, ...d.festivals].filter(Boolean);
      const ticker =
        notes.length > 1
          ? `<span class="year-day-note"><span class="year-day-note-track" data-year-note-date="${d.date}">${notes.map((note) => `<span>${esc(note)}</span>`).join("")}</span></span>`
          : "";
      const note = notes.length === 1 ? ` data-note="${esc(notes[0])}"` : "";
      return `<span class="year-detail-cell${d.today ? " is-today" : ""}"${note}>${d.number}${ticker}${badgeMarkup(d.badge)}</span>`;
    }
    return blanks + month.days.map(detailCell).join("") + trailing;
  }
  function lunarCalendarForYear(year) {
    return year >= 1900 && year <= 2100
      ? WorkTimeApp.services.dateInfo.calendarLunar
      : null;
  }
  function cachedYear(year, today) {
    const cached = yearSnapshots.get(year);
    return cached &&
      cached.state === getState() &&
      cached.revision === getRevision() &&
      cached.today === today &&
      cached.language === WorkTimeApp.i18n.language &&
      cached.lunarFor === lunarCalendarForYear(year)
      ? cached
      : null;
  }
  function getYearSnapshot(viewYear, today) {
    let yearSnapshot = cachedYear(viewYear, today);
    if (!yearSnapshot) {
      const state = getState(),
        revision = getRevision(),
        language = WorkTimeApp.i18n.language,
        lunarFor = lunarCalendarForYear(viewYear);
      yearSnapshot = {
        state,
        revision,
        today,
        language,
        lunarFor,
        months: WorkYear.calendarMonths(state, viewYear, today, lunarFor),
      };
      yearSnapshot.markup = yearMarkup(yearSnapshot.months, viewYear);
    }
    // Keep the current and neighboring years for back-and-forth navigation.
    yearSnapshots.delete(viewYear);
    yearSnapshots.set(viewYear, yearSnapshot);
    if (yearSnapshots.size > 5)
      yearSnapshots.delete(yearSnapshots.keys().next().value);
    return yearSnapshot;
  }

  function yearMarkup(months, viewYear) {
    const statsMarkup = WorkTimeApp.i18n
      .t("copy.2b3cbb76bd")
      .replace(/^<\/span>/, "");
    const chineseMonths =
      "一月 二月 三月 四月 五月 六月 七月 八月 九月 十月 十一月 十二月".split(
        " ",
      );
    const isChinese = WorkTimeApp.i18n.language.startsWith("zh-");
    const heading = (m) => {
      const monthKey = viewYear + "-" + C.pad(m.month);
      const label = isChinese
        ? chineseMonths[m.month - 1]
        : WorkTimeApp.i18n.monthName(monthKey + "-01");
      return (
        '<h3><span class="year-month-number">' +
        esc(label) +
        "</span>" +
        statsMarkup +
        WorkTimeApp.i18n.number(
          (m.summary.workOvertime + m.summary.restOvertime) / 60,
          { useGrouping: false, maximumFractionDigits: 2 },
        ) +
        WorkTimeApp.i18n.t("copy.42b92eadd3") +
        (m.summary.average === null
          ? "—"
          : WorkTimeApp.i18n.number(m.summary.average / 60, {
              useGrouping: false,
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })) +
        "h/d</span></span></h3>"
      );
    };
    const badges = new Map();
    return months
      .map((m) => {
        const key = `${viewYear}-${C.pad(m.month)}`;
        const leading = m.offset,
          trailing = 42 - leading - m.days.length;
        const emptyLabel = "<span></span>";
        const labels = m.days
          .map(
            (day) =>
              `<span style="--year-heat-ink:${day.color.text}"${day.today ? ' class="is-today"' : ""}>${day.number}</span>`,
          )
          .join("");
        return (
          `<section class="year-month" data-year-month="${key}" tabindex="0" aria-label="${esc(WorkTimeApp.i18n.month(key))}">` +
          heading(m) +
          `<div class="year-days"><div class="year-ink" aria-hidden="true">` +
          `<div class="year-heat-labels">${emptyLabel.repeat(leading)}${labels}${emptyLabel.repeat(trailing)}</div>` +
          `<div class="year-day-layer year-detail-cells">${detailCells(m, emptyLabel.repeat(leading), emptyLabel.repeat(trailing), badges)}</div></div></div></section>`
        );
      })
      .join("");
  }

  let yearPreparation = null;
  function cancelYearPreparation() {
    if (yearPreparation !== null) window.cancelIdleCallback(yearPreparation);
    yearPreparation = null;
  }

  function prepareYears({ entry = false, direction = 1 } = {}) {
    const { yearMode, analysisMode, viewYear, month } = getView();
    if (
      yearMode === entry ||
      analysisMode ||
      document.hidden ||
      !window.requestIdleCallback
    )
      return;
    cancelYearPreparation();
    const center = entry ? Number(month.slice(0, 4)) : viewYear;
    const offsets = [direction, -direction, 2 * direction, -2 * direction];
    if (entry) offsets.unshift(0);
    const targets = offsets
      .map((offset) => center + offset)
      .filter((year) => year >= 1900 && year <= 9999);
    function prepare(deadline) {
      yearPreparation = null;
      const view = getView();
      if (
        document.hidden ||
        view.yearMode === entry ||
        view.analysisMode ||
        (entry ? view.month !== month : view.viewYear !== viewYear)
      )
        return;
      if (targets.length && deadline.timeRemaining() >= 8) {
        const snapshot = getYearSnapshot(targets[0], view.today);
        if (
          deadline.timeRemaining() >= 3 &&
          prepareYearGrid(
            snapshot,
            entry && targets[0] === center ? deadline : null,
          )
        )
          targets.shift();
      }
      // Yield after each year and avoid starting this work during a busy frame.
      if (targets.length) yearPreparation = window.requestIdleCallback(prepare);
    }
    yearPreparation = window.requestIdleCallback(prepare);
  }

  function renderYear({ deferDetails = false } = {}) {
    const { today, month, selected, viewYear, yearViewMode } = getView();
    const detail = yearViewMode === "calendar";
    $("yearWatermark").textContent = String(viewYear);
    $("yearWatermark").classList.toggle("is-visible", detail);

    updateMonthTitle(viewYear, Number(getView().month.slice(5)), true);
    const notice = $("yearNotice");
    updateText(
      notice.querySelector(".notification-body"),
      viewYear + WorkTimeApp.i18n.t("copy.29c9747e36"),
    );
    notice.classList.toggle("hidden", C.calendarKnown(viewYear + "-01-01"));
    const yearSnapshot = getYearSnapshot(viewYear, today);
    const { months } = yearSnapshot;
    if (!deferDetails) renderYearAnalysis(months);
    $("calendar").removeAttribute("data-weeks");
    $("calendar").classList.toggle("year-calendar-detail", detail);
    $("yearLegend").classList.toggle("hidden", false);
    $("yearLegend").classList.toggle("is-inactive", detail);
    $("yearLegend").setAttribute("aria-hidden", String(detail));
    updateText(
      $("calendarFoot"),
      viewYear +
        WorkTimeApp.i18n.t("copy.6d332ee4da") +
        months.reduce(
          (sum, m) => sum + m.days.filter((d) => d.complete).length,
          0,
        ) +
        WorkTimeApp.i18n.t("copy.06ce537cae"),
    );
    if (!deferDetails) renderYearLegend(months);
    updateYearCalendar(yearSnapshot, {
      month,
      animateYear: deferDetails,
    });
    const firstMonth = $("calendar").firstElementChild;
    if (
      detailDrawing?.months !== months ||
      detailDrawing.firstMonth !== firstMonth
    ) {
      detailDrawing = { months, firstMonth, tracks: null };
    }
    $("batchBar").classList.add("hidden");
    $("dayEditor").classList.remove("hidden");
    const batchToggle = $("batchToggle");
    batchToggle.setAttribute("aria-pressed", "false");
    batchToggle.dataset.hintText = WorkTimeApp.i18n.t("copy.3f712eac83");
    batchToggle.setAttribute(
      "aria-label",
      WorkTimeApp.i18n.t("copy.3f712eac83"),
    );
    WorkTimeApp.ui.motion.setToggleIcon(batchToggle, false, "#icon-stacks");
    renderedMode = false;
    renderedSelection = selected;
    updateNotificationEmptyState();
    if (deferDetails)
      return () => {
        if (detailDrawing?.months !== months) return;
        renderYearAnalysis(months);
        renderYearLegend(months);
      };
  }
  function renderYearLegend(months) {
    const maximum = WorkYear.scaleMaximum(months),
      minimum = WorkYear.scaleMinimum(months);
    const zeroPosition =
      maximum > minimum ? (-minimum / (maximum - minimum)) * 100 : 0;
    const minColor = WorkYear.heatColor(minimum, maximum, minimum).background,
      zeroColor = WorkYear.heatColor(0, maximum, minimum).background,
      maxColor = WorkYear.heatColor(maximum, maximum, minimum).background;
    const legend = yearLegendParts(),
      minText = minimum < 0 ? C.hours(minimum) + " h" : "",
      maxText = maximum > 0 ? C.hours(maximum) + " h" : "";
    setYearLegendLabels([
      [legend.min, minText],
      [legend.max, maxText],
    ]);
    legend.scale.classList.toggle("is-empty", !minText && !maxText);
    legend.gradient.style.removeProperty("background");
    legend.gradient.style.setProperty("--year-legend-min", minColor);
    legend.gradient.style.setProperty("--year-legend-zero", zeroColor);
    legend.gradient.style.setProperty("--year-legend-max", maxColor);
    legend.gradient.style.setProperty(
      "--year-legend-zero-position",
      zeroPosition + "%",
    );
  }
  function renderYearAnalysis(months) {
    const report = WorkYear.annualReport(months);
    const dayMetrics = new Set([
      "attendance",
      "leaveDays",
      "restOvertimeDays",
      "weekendOvertimeDays",
      "holidayOvertimeDays",
    ]);
    for (const row of $("yearAnalysisCards").querySelectorAll(
      "[data-year-metric]",
    )) {
      const key = row.dataset.yearMetric,
        value = report[key] ?? 0,
        day = dayMetrics.has(key),
        signed = ["average", "totalOvertime", "workOvertime"].includes(key);
      const element = row.querySelector(".year-report-value");
      element.classList.toggle("is-negative", signed && value < 0);
      numbers.set(element, value, {
        decimals: day && !["attendance", "leaveDays"].includes(key) ? 0 : 2,
        reserveSign: signed,
        retainIntegerWidth: true,
        unit: day ? "d" : "h",
      });
    }
  }
  return {
    monthWorkdayNumber,
    adjacentDayCard,
    renderCalendar,
    renderYear,
    prepareNeighboringYears: (direction = 1) => prepareYears({ direction }),
    prepareYearEntry: () => prepareYears({ entry: true }),
    renderYearNavigation(options) {
      cancelYearPreparation();
      updateSidebarYearMonth(true, getView().month);
      const updateDetails = renderYear(options);
      syncNoteTicker(true);
      return updateDetails;
    },
    dispose: () => {
      window.clearTimeout(workEndTimer);
      stopNoteTicker();
      window.removeEventListener("pagehide", stopNoteTicker);
      document.removeEventListener("visibilitychange", refreshNoteTicker);
      document.removeEventListener(
        "worktime:yearviewchange",
        refreshNoteTicker,
      );
      WorkTimeApp.ui.animationCompat
        .preference()
        .removeEventListener("change", refreshNoteTicker);
      yearSnapshots.clear();
      detailDrawing = null;
    },
  };
};
