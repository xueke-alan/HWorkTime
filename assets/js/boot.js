"use strict";
/** Load bounded classic-script stages in separate tasks, including over file://. */
(() => {
  let closed = false;
  const startup = new AbortController();
  let disposeWorkspace;
  window.addEventListener(
    "pagehide",
    () => {
      closed = true;
      startup.abort();
      if (
        !document.documentElement.dataset.appState ||
        document.documentElement.dataset.appState === "loading"
      )
        WorkTimeApp.ui.disposeWorkspace?.();
    },
    { once: true },
  );
  async function start() {
    const entry = document.querySelector(
      'meta[name="workspace-module"]',
    )?.content;
    if (entry && location.protocol !== "file:") {
      const { mountWorkspace } = await import(
        new URL(entry, document.baseURI).href
      );
      if (closed) return;
      disposeWorkspace = await mountWorkspace(startup.signal);
    } else {
      await Promise.all([
        !entry &&
          WorkTimeApp.services.assets.style(
            "assets/js/ui/workspace-file.min.css",
          ),
        WorkTimeApp.services.assets.script(
          "assets/js/ui/workspace-file.min.js",
        ),
      ]);
      if (closed) return;
      await WorkTimeApp.ui.loadFileWorkspace();
      if (closed) return;
      disposeWorkspace = await WorkTimeApp.ui.fileWorkspace.mountWorkspace(
        startup.signal,
      );
    }
    WorkTimeApp.ui.disposeWorkspace = () => {
      const dispose = disposeWorkspace;
      disposeWorkspace = null;
      dispose?.();
    };
    for (const stage of ["core", "date", "view", "startup"]) {
      if (stage === "startup") {
        let saved;
        try {
          saved = JSON.parse(localStorage.getItem("worktime.calendarView"));
        } catch {}
        if (
          WorkTimeApp.isDevelopmentEnabled() &&
          saved?.mode === "agenda" &&
          !saved.analysis
        )
          await WorkTimeApp.services.assets.style(
            "assets/css/agenda-details.css",
          );
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (closed) return;
      await WorkTimeApp.services.assets.script(
        "assets/js/ui/" + stage + "-runtime.min.js",
      );
      const initialized = {
        core: () =>
          WorkTimeApp.services.bootstrap?.run &&
          WorkTimeApp.services.indexedStorage?.create,
        date: () =>
          WorkTimeApp.services.dateInfo?.getContent && WorkTimeApp.ui.motion,
        view: () =>
          WorkTimeApp.ui.createAgendaEntry && WorkTimeApp.ui.createCalendar,
        startup: () => document.documentElement.dataset.appState,
      };
      if (!initialized[stage]())
        throw Error("Startup stage did not initialize: " + stage);
    }
  }
  void start().catch((error) => {
    if (closed) return;
    document.documentElement.dataset.appState = "failed";
    document.documentElement.classList.remove("app-loading");
    clearTimeout(window.appRevealFallback);
    document.dispatchEvent(new Event("worktime:failed"));
    for (const element of document.querySelectorAll(
      "button,input,select,textarea",
    ))
      element.disabled = true;
    const notice = document.createElement("div");
    notice.id = "startupFailure";
    notice.className = "notice";
    notice.setAttribute("role", "alert");
    const message = document.createElement("p");
    const i18n = typeof WorkTimeApp === "undefined" ? null : WorkTimeApp.i18n;
    message.textContent =
      (i18n?.message("页面初始化失败：") || "页面初始化失败：") + error.message;
    // Startup can fail before the workspace registers its UI factories.
    const retry =
      (typeof WorkTimeApp !== "undefined" &&
        WorkTimeApp.ui.native?.createElement("button")) ||
      document.createElement("button");
    retry.dataset.ui = "button";
    retry.type = "button";
    retry.className = "ui-button";
    retry.textContent = i18n?.t("copy.e2d53a6d3a") || "重试";
    retry.onclick = () => window.location.reload();
    notice.append(message, retry);
    (document.querySelector("main") || document.body).prepend(notice);
  });
})();
