"use strict";
/** Tiny entry point: the tutor and curriculum stay out of the startup path. */
WorkTimeApp.ui.typing = (() => {
  let pending = null,
    disposed = false;
  const t = (key) => WorkTimeApp.i18n.t("typing." + key);
  const loader = {
    refresh() {},
    async open() {
      if (disposed || !WorkTimeApp.ui.dateInfo.isDevelopmentEnabled()) return;
      if (document.documentElement.dataset.appState !== "ready") {
        await new Promise((resolve) =>
          document.addEventListener("worktime:ready", resolve, { once: true }),
        );
        if (disposed || !WorkTimeApp.ui.dateInfo.isDevelopmentEnabled()) return;
      }
      WorkTimeApp.ui.dateInfo.showToolsPanel();
      const entry = document.getElementById("typingOpen");
      try {
        if (!pending)
          pending = (async () => {
            await Promise.all([
              WorkTimeApp.ui.loadTypingViews(),
              WorkTimeApp.services.assets.script(
                "assets/js/ui/secondary-runtime.min.js",
              ),
            ]);
            await Promise.all([
              WorkTimeApp.i18n.loadModule("typing"),
              WorkTimeApp.services.assets.style("assets/css/typing.css"),
              WorkTimeApp.services.assets.script(
                "assets/js/ui/typing-runtime.min.js",
              ),
            ]);
          })().catch((error) => {
            pending = null;
            throw error;
          });
        entry.setAttribute("aria-busy", "true");
        entry.dataset.hintText = t("loading");
        entry.querySelector("span").textContent = t("loading");
        await pending;
        if (
          disposed ||
          !WorkTimeApp.ui.dateInfo.isDevelopmentEnabled() ||
          !WorkTimeApp.ui.dateInfo.isActive("tools")
        )
          return;
        if (WorkTimeApp.ui.typing === loader)
          throw Error("Typing did not initialize");
        await WorkTimeApp.ui.typing.open();
      } catch {
        if (disposed) return;
        entry.dataset.hintText = t("loadFailed");
        entry.querySelector("span").textContent = t("loadFailed");
      } finally {
        entry.removeAttribute("aria-busy");
      }
    },
    dispose() {
      disposed = true;
    },
  };
  return loader;
})();
