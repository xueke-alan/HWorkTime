"use strict";

/** Create an isolated summary view; state/view getters remain live after restore and navigation. */
WorkTimeApp.ui.createSummary = function (options) {
  const {
    core: C,
    element: $,
    getState,
    getView,
    getRange: monthBounds,
    isStorageFailed,
    numbers,
  } = options;
  const bounds = monthBounds;
  const view = WorkTimeApp.ui.workspaceViews.mountSummary($("cards"));
  function rangeValid() {
    const [a, b] = bounds();
    return C.validDate(a) && C.validDate(b) && a <= b;
  }
  function renderStats() {
    const state = getState();
    const { today } = getView();
    const storageFailed = isStorageFailed();

    const [a, b] = bounds(),
      valid = rangeValid(),
      ready = state.settings.configured,
      actual = valid ? C.summary(state, a, b) : C.summary(state, "", ""),
      requirement =
        ready && valid
          ? C.selectOvertimeRequirement(state, a, b).targetMinutes
          : null,
      surplus =
        requirement === null
          ? null
          : actual.workOvertime - requirement * actual.attendance,
      surplusMinutes = surplus === null ? null : Math.round(Math.abs(surplus)),
      surplusNegative = surplus < 0 && surplusMinutes > 0,
      surplusLabel = surplusNegative
        ? "summary.hoursOwed"
        : surplusMinutes > 0
          ? "summary.hoursSurplus"
          : "copy.fa91c92797";
    const data = [
      [
        WorkTimeApp.i18n.t("copy.cc954e610b"),
        ready && valid && actual.average !== null ? actual.average / 60 : 0,
        WorkTimeApp.i18n.t("short.averageFormula"),
        { decimals: 2, unit: "h" },
      ],
      [
        WorkTimeApp.i18n.t(surplusLabel),
        surplusMinutes,
        WorkTimeApp.i18n.t("short.balanceFormula"),
        { unit: "" },
      ],
      [
        WorkTimeApp.i18n.t("copy.7a26926ed7"),
        ready && valid ? Number(actual.attendance.toFixed(4)) : null,
        "",
        { unit: "d" },
      ],
      [
        WorkTimeApp.i18n.t("short.workOT"),
        ready && valid ? actual.workOvertime / 60 : null,
        "",
        { decimals: 2, unit: " h" },
      ],
      [
        WorkTimeApp.i18n.t("short.restOT"),
        ready && valid ? actual.restOvertime / 60 : null,
        "",
        { decimals: 2, unit: " h" },
      ],
      [
        WorkTimeApp.i18n.t("copy.016315b388"),
        ready && valid ? actual.total / 60 : null,
        "",
        { decimals: 2, unit: " h" },
      ],
      [
        WorkTimeApp.i18n.t("copy.eb87bec8ca"),
        valid ? C.pendingWorkdays(state, a, b, today) : null,
        "",
        { unit: "d" },
      ],
    ];
    const titles = [
      "copy.cc954e610b",
      surplusLabel,
      "copy.7a26926ed7",
      "copy.04fd5a186c",
      "copy.2db287963f",
      "copy.016315b388",
      "copy.eb87bec8ca",
    ];
    const metrics = data.map(([label, value, description, options], i) => ({
      label,
      value,
      description,
      title: WorkTimeApp.i18n.t(titles[i]),
      hint:
        i < 2
          ? WorkTimeApp.i18n.t(i === 0 ? "copy.ae47f5dfb5" : "copy.2e0e43d0d6")
          : "",
      options: { ...options, unit: value === null ? "" : options.unit },
    }));
    view.render({
      metrics,
      negative: surplusNegative,
      target: targetDisplay(state, today),
      paint: numbers.set,
    });
    $("setupNotice").classList.toggle("hidden", ready);
    $("storageNotice").classList.toggle("hidden", !storageFailed);
  }
  function targetDisplay(state, today) {
    const { t, number, plural } = WorkTimeApp.i18n;
    const display = {
      message: "",
      totalLabelKey: "copy.f84810dcd6",
      dailyLabel: t("copy.2deb6d7455"),
      total: null,
      daily: null,
      target: null,
      restDays: null,
      remaining: null,
    };
    buildTarget(display, state, today);
    const { totalLabelKey, remaining } = display;
    const totalLabel = t(totalLabelKey);
    const totalTitle =
      remaining === null
        ? totalLabel
        : t("summary.remaining", {
            label: totalLabel,
            days: plural(remaining, "unit.day.one", "unit.day.other"),
          });
    const marker = "\uFFFC";
    return {
      ...display,
      totalLabel,
      totalTitle,
      remainingText:
        remaining === null || totalLabelKey === "summary.totalOvertimeNeeded"
          ? null
          : t("short.target.remaining", {
              label:
                totalLabelKey === "copy.d58b3b54dd"
                  ? t("short.available")
                  : totalLabel,
              count: marker,
            }).split(marker),
      remainingCount: remaining === null ? "" : number(remaining),
    };
  }
  function buildTarget(display, state, today) {
    if (!state.settings.configured) {
      display.message = WorkTimeApp.i18n.t("copy.4561283ba2");
      return;
    }
    const [start, end] = monthBounds(),
      condition = C.selectOvertimeRequirement(state, start, end),
      tierLabel =
        condition.tier === 0
          ? WorkTimeApp.i18n.t("copy.e69fe8710f")
          : condition.tier === 4
            ? WorkTimeApp.i18n.t("copy.fea703e117")
            : condition.tier + WorkTimeApp.i18n.t("copy.77e1d94d23");
    display.restDays = condition.totalDays;
    display.target =
      condition.targetMinutes === null ? null : condition.targetMinutes / 60;
    if (condition.targetMinutes === null) {
      display.message = WorkTimeApp.i18n.t("copy.5300e06359") + tierLabel;
      return;
    }
    const pace = C.targetPace(
      state,
      start,
      end,
      today,
      condition.targetMinutes,
    );
    if (!pace || !pace.plannedDays) {
      display.message = WorkTimeApp.i18n.t("copy.04a4021608");
      return;
    }
    const remaining = Number(pace.remainingDays.toFixed(2)),
      formatHours = (minutes) => Number((Math.abs(minutes) / 60).toFixed(2));
    if (!pace.remainingDays) {
      const missing = C.pendingWorkdays(state, start, end, today);
      display.totalLabelKey =
        Math.abs(pace.difference) < 0.005
          ? "copy.573a35fdda"
          : pace.difference > 0
            ? missing
              ? "copy.a4216d720e"
              : "copy.ca615d13ae"
            : "copy.8d327bd444";
      display.total =
        Math.abs(pace.difference) < 0.005 ? 0 : formatHours(pace.difference);
      return;
    }
    if (Math.abs(pace.difference) < 0.005) {
      display.totalLabelKey = "copy.67692532ab";
      display.dailyLabel = WorkTimeApp.i18n.t("copy.ff1b93c871");
      display.total = display.daily = 0;
    } else if (pace.difference < 0) {
      display.totalLabelKey = "copy.d58b3b54dd";
      display.dailyLabel = WorkTimeApp.i18n.t("copy.24ac6da480");
      display.total = formatHours(pace.difference);
      display.daily = formatHours(pace.requiredPerDay);
    } else {
      display.totalLabelKey = "summary.totalOvertimeNeeded";
      display.total = formatHours(pace.difference);
      display.daily = formatHours(pace.requiredPerDay);
    }
    display.remaining = remaining;
  }
  return { renderStats, renderTarget: renderStats, dispose: view.dispose };
};
