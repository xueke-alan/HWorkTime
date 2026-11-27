"use strict";
// Attendance owns the first screen. Mount the agenda before the first command
// that shares its toolbar, or immediately when restoring an agenda/analysis view.
WorkTimeApp.ui.createAgendaEntry = function (options) {
  const { model, document, window, element: $, actions } = options;
  const { isDevelopmentEnabled } = WorkTimeApp;
  const scope = new AbortController();
  const trigger = document.createElement("button");
  trigger.id = "agendaMode";
  trigger.type = "button";
  trigger.hidden = !isDevelopmentEnabled();
  trigger.setAttribute("aria-pressed", "false");
  $("analysisToggle").after(trigger);
  const yearViewToggle = document.createElement("div");
  yearViewToggle.id = "yearViewToggle";
  yearViewToggle.hidden = true;
  $("batchToggle").after(yearViewToggle);
  let yearControlDisabled = false;
  function renderYearDisplay(disabled = false) {
    yearControlDisabled = disabled;
    WorkTimeApp.ui.workspaceViews.YearDisplay(yearViewToggle, {
      getValue: () => model.yearViewMode,
      disabled,
      onChange: (mode) =>
        actions.requestSettingsExit(() => {
          if (
            scope.signal.aborted ||
            yearControlDisabled ||
            mode === model.yearViewMode
          )
            return;
          actions.finishCalendarNavigation();
          if (!model.yearMode) return;
          model.yearViewMode = mode;
          const detail = mode === "calendar";
          $("calendar").classList.remove("is-year-navigating");
          $("calendar").classList.toggle("year-calendar-detail", detail);
          $("yearLegend").classList.toggle("is-inactive", detail);
          $("yearLegend").setAttribute("aria-hidden", String(detail));
          $("yearWatermark").classList.add("is-mode-transition");
          $("yearWatermark").classList.toggle("is-visible", detail);
          document.dispatchEvent(new Event("worktime:yearviewchange"));
        }),
    });
  }
  let controller, loading, requested;
  let selection = Promise.resolve();
  const viewSelectionDelay = 150;
  function selectWorkspaceView(view) {
    if (view === "agenda" && !isDevelopmentEnabled()) return Promise.resolve();
    const request = (requested = {});
    const startsAt = window.performance.now() + viewSelectionDelay;
    const isCurrent = () =>
      requested === request &&
      !scope.signal.aborted &&
      (view !== "agenda" || isDevelopmentEnabled());
    // Count the debounce window from the click, including time spent in the queue.
    selection = selection
      .then(async () => {
        if (!isCurrent()) return;
        const remaining = startsAt - window.performance.now();
        if (remaining > 0)
          await new Promise((resolve) => window.setTimeout(resolve, remaining));
        if (!isCurrent()) return;
        await load();
        if (isCurrent()) await controller.selectView(view);
      })
      .catch((error) => {
        if (isCurrent()) window.alert(error.message);
      });
    return selection;
  }
  const load = () => {
    if (!loading)
      loading = WorkTimeApp.services.assets
        .script("assets/js/ui/agenda-feature.min.js")
        .then(() => {
          if (scope.signal.aborted) return;
          trigger.remove();
          controller = WorkTimeApp.ui.createAgenda({
            ...options,
            yearViewToggle,
            renderYearDisplay,
          });
          controller.bind();
        })
        .catch((error) => {
          loading = null;
          throw error;
        });
    return loading;
  };
  function renderToolbar() {
    if (controller) controller.renderToolbar()?.();
    else {
      yearViewToggle.hidden = !model.yearMode;
      $("batchToggle").hidden = model.yearMode;
      if (model.yearMode) renderYearDisplay();
      trigger.disabled = model.batchMode;
    }
    const key =
      !model.yearMode && model.month === model.today.slice(0, 7)
        ? "calendarHint.today"
        : "calendarHint.thisMonth";
    $("todayButton").setAttribute("data-i18n-aria-label", key);
    $("todayButton").setAttribute("aria-label", WorkTimeApp.i18n.t(key));
  }
  function render() {
    if (controller) controller.render();
    else renderToolbar();
  }
  async function bind() {
    WorkTimeApp.ui.selectWorkspaceView = selectWorkspaceView;
    window.addEventListener(
      "hashchange",
      () => {
        trigger.hidden = !isDevelopmentEnabled();
      },
      { signal: scope.signal },
    );
    let saved;
    try {
      saved = JSON.parse(window.localStorage.getItem("worktime.calendarView"));
    } catch {}
    if (saved?.analysis || (saved?.mode === "agenda" && isDevelopmentEnabled()))
      return load();
    render();
    document.addEventListener(
      "click",
      (event) => {
        const command = event.target.closest?.(
          "#agendaMode,#analysisToggle,#batchToggle",
        );
        if (controller || !command || command.disabled) return;
        if (command.id === "agendaMode" && !isDevelopmentEnabled()) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const request = (requested = {});
        void load()
          .then(() => {
            if (!scope.signal.aborted && requested === request)
              $(command.id)?.click();
          })
          .catch((error) => {
            if (!scope.signal.aborted && requested === request)
              window.alert(error.message);
          });
      },
      { capture: true, signal: scope.signal },
    );
  }
  return {
    bind,
    render,
    renderToolbar,
    hasDraft: () => controller?.hasDraft() ?? false,
    prepareAgendaArchive: () => controller?.prepareAgendaArchive(),
    dispose() {
      scope.abort();
      if (WorkTimeApp.ui.selectWorkspaceView === selectWorkspaceView)
        delete WorkTimeApp.ui.selectWorkspaceView;
      trigger.remove();
      controller?.dispose();
      WorkTimeApp.ui.workspaceViews.dispose(yearViewToggle);
      yearViewToggle.remove();
      $("batchToggle").hidden = false;
    },
  };
};
