"use strict";
// Attendance owns the first screen. Mount the agenda before the first command
// that shares its toolbar, or immediately when restoring an agenda/analysis view.
WorkTimeApp.ui.createAgendaEntry = function (options) {
  const { model, document, window, element: $ } = options;
  const { isDevelopmentEnabled } = WorkTimeApp;
  const scope = new AbortController();
  const trigger = document.createElement("button");
  trigger.id = "agendaMode";
  trigger.type = "button";
  trigger.hidden = !isDevelopmentEnabled();
  trigger.setAttribute("aria-pressed", "false");
  $("analysisToggle").after(trigger);
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
          controller = WorkTimeApp.ui.createAgenda(options);
          controller.bind();
        })
        .catch((error) => {
          loading = null;
          throw error;
        });
    return loading;
  };
  function render() {
    if (controller) return controller.render();
    trigger.disabled = model.batchMode;
    const key =
      model.month === model.today.slice(0, 7)
        ? "calendarHint.today"
        : "calendarHint.thisMonth";
    $("todayButton").setAttribute("data-i18n-aria-label", key);
    $("todayButton").setAttribute("aria-label", WorkTimeApp.i18n.t(key));
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
          "#agendaMode,#analysisToggle,#monthTitle,#batchToggle",
        );
        if (controller || !command || command.disabled) return;
        if (command.id === "agendaMode" && !isDevelopmentEnabled()) return;
        if (command.id === "monthTitle") {
          // The calendar can start switching while the year display controls load.
          if (command.getAttribute("aria-disabled") !== "true")
            void load().catch((error) => {
              if (!scope.signal.aborted) window.alert(error.message);
            });
          return;
        }
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
    hasDraft: () => controller?.hasDraft() ?? false,
    prepareAgendaArchive: () => controller?.prepareAgendaArchive(),
    dispose() {
      scope.abort();
      if (WorkTimeApp.ui.selectWorkspaceView === selectWorkspaceView)
        delete WorkTimeApp.ui.selectWorkspaceView;
      trigger.remove();
      controller?.dispose();
    },
  };
};
