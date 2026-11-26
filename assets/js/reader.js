"use strict";
WorkTimeApp.ui.reader = (() => {
  const enabled = () => location.hash === "#dev";
  let workspace,
    pending,
    revision = 0;
  async function open(options) {
    if (!enabled()) return;
    const current = ++revision;
    const entry = document.getElementById("readerOpen");
    entry?.setAttribute("aria-busy", "true");
    try {
      if (!workspace) {
        pending ??= (async () => {
          await WorkTimeApp.services.assets.script(
            "assets/js/ui/secondary-runtime.min.js",
          );
          if (!enabled()) return;
          const [mountToolbar] = await Promise.all([
            WorkTimeApp.ui.loadReaderToolbar(),
            WorkTimeApp.i18n.loadModule("reader"),
            WorkTimeApp.services.assets.style("assets/css/reader.css"),
            WorkTimeApp.services.assets.script(
              "assets/js/ui/reader-runtime.min.js",
            ),
          ]);
          if (enabled() && !workspace)
            workspace = WorkTimeApp.ui.createReaderWorkspace(mountToolbar);
        })().finally(() => {
          pending = null;
        });
        await pending;
      }
      if (
        current === revision &&
        enabled() &&
        WorkTimeApp.ui.dateInfo.isActive("tools")
      )
        await workspace?.open(options);
    } catch (error) {
      if (current === revision && enabled()) {
        const message = WorkTimeApp.ui.readerText("loadFailed");
        entry?.setAttribute("data-hint-text", message);
        const status = entry?.querySelector('[role="status"]');
        if (status) status.textContent = message;
        console.error(error);
      }
    } finally {
      if (current === revision) entry?.removeAttribute("aria-busy");
    }
  }
  return {
    open,
    refresh() {
      if (enabled()) workspace?.refresh();
    },
    close() {
      ++revision;
      document.getElementById("readerOpen")?.removeAttribute("aria-busy");
      return workspace?.close();
    },
    leaveDevelopment() {
      ++revision;
      document.getElementById("readerOpen")?.removeAttribute("aria-busy");
      workspace?.leaveDevelopment();
    },
    get isMini() {
      return workspace?.isMini ?? false;
    },
    expand() {
      if (enabled()) return workspace?.expand();
    },
    minimize() {
      if (enabled()) return workspace?.minimize();
    },
  };
})();
