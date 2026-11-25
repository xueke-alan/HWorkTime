"use strict";
/** One modal shared by the sidebar and expanded game menus. */
WorkTimeApp.ui.createGameArchiveController = function ({ document, window }) {
  const service = WorkTimeApp.services.gameArchive;
  const clipboard = WorkTimeApp.services.clipboard.create(
    () => window.navigator.clipboard,
  );
  const downloads = WorkTimeApp.services.downloads.create({
    document,
    URL: window.URL,
    Blob: window.Blob,
  });
  const events = WorkTimeApp.ui.createEventScope();
  const controls = new Map();
  const t = (key, params) => WorkTimeApp.i18n.t("gameArchive." + key, params);
  let generation = 0;
  let noticeTimer = null,
    dismissTimer = null;
  let disposed = false,
    busy = false,
    archive = null,
    previewed = null,
    origin = null;
  function message(error) {
    const code = [
      "invalid",
      "wrongType",
      "version",
      "empty",
      "tooLarge",
      "localInvalid",
      "changed",
      "recovery",
      "noBackup",
    ].includes(error?.code)
      ? error.code
      : "storageError";
    const game = WorkTimeApp.games.get(error?.game);
    return (
      t(code) +
      (error?.game
        ? " · " + (game ? WorkTimeApp.i18n.t(game.nameKey) : error.game)
        : "")
    );
  }
  function clearNoticeTimers() {
    window.clearTimeout(noticeTimer);
    window.clearTimeout(dismissTimer);
    noticeTimer = dismissTimer = null;
  }
  function announce(text, temporary = false) {
    clearNoticeTimers();
    for (const status of controls.values()) {
      status.classList.remove("is-dismissing");
      status.textContent = text;
    }
    if (!temporary) return;
    noticeTimer = window.setTimeout(() => {
      noticeTimer = null;
      const clear = () => {
        dismissTimer = null;
        for (const status of controls.values()) {
          status.textContent = "";
          status.classList.remove("is-dismissing");
        }
      };
      if (WorkTimeApp.ui.animationCompat.preference().matches) {
        clear();
        return;
      }
      for (const status of controls.values())
        status.classList.add("is-dismissing");
      dismissTimer = window.setTimeout(clear, 180);
    }, 3000);
  }
  const view = WorkTimeApp.ui.archiveView;
  view.download = async () => {
    try {
      await WorkTimeApp.games.prepareArchive();
      if (!disposed && view.open) download(service.previousBackup(), "before");
    } catch (error) {
      view.error = message(error);
    }
  };
  view.confirm = async () => {
    if (!previewed || busy) return;
    busy = true;
    view.committing = true;
    try {
      const rows = await service.commit(previewed);
      announce(
        t("done", {
          added: rows.filter((r) => r.status === "added").length,
          merged: rows.filter((r) => r.status === "merged").length,
          unchanged: rows.filter((r) => r.status === "unchanged").length,
        }),
      );
      close();
    } catch (error) {
      if (error.code === "changed") {
        try {
          renderPreview({});
        } catch (refreshError) {
          view.error = message(refreshError);
          return;
        }
        view.error = t("changed");
      } else view.error = message(error);
    } finally {
      busy = false;
      view.committing = false;
    }
  };
  function download(value, suffix = "") {
    downloads.download(
      "worktime-games" +
        (suffix ? "-" + suffix : "") +
        "-" +
        new Date().toISOString().slice(0, 10) +
        ".json",
      JSON.stringify(value, null, 2),
      "application/json;charset=utf-8",
    );
  }
  function renderPreview(choices = {}) {
    resetPreview();
    previewed = service.preview(archive, choices);
    view.hasPreview = true;
    view.rows = previewed.rows.map((row) => {
      const game = WorkTimeApp.games.get(row.id);
      let result = t(row.status);
      if (row.improved && row.status !== "added")
        result += " · " + t("improved");
      if (row.draftsAdded)
        result += " · " + t("draftsAdded", { count: row.draftsAdded });
      if (row.completedAdded)
        result += " · " + t("completedAdded", { count: row.completedAdded });
      return {
        id: row.id,
        name: game ? WorkTimeApp.i18n.t(game.nameKey) : row.id,
        result,
        status: row.status,
        conflict: row.conflict,
        incoming: choices[row.id] === "incoming",
      };
    });
    if (!view.rows.length) view.error = t("empty");
  }
  function resetPreview() {
    previewed = null;
    view.hasPreview = false;
    view.rows = [];
  }
  view.choice = (id, incoming) => {
    if (busy || !previewed) return;
    try {
      renderPreview({
        ...previewed.choices,
        [id]: incoming ? "incoming" : "local",
      });
    } catch (error) {
      view.error = message(error);
    }
  };
  async function loadText(text) {
    if (busy || disposed) return;
    const token = ++generation;
    busy = true;
    resetPreview();
    archive = null;
    view.error = "";
    try {
      await WorkTimeApp.games.prepareArchive();
      const decoded = await service.decode(text);
      if (disposed || !view.open || token !== generation) return;
      archive = decoded;
      renderPreview();
    } catch (error) {
      if (!disposed && token === generation) view.error = message(error);
    } finally {
      if (token === generation) busy = false;
    }
  }
  function translate() {
    if (view.open && archive) {
      try {
        renderPreview(previewed?.choices);
      } catch (error) {
        view.error = message(error);
      }
    }
  }
  function open(button) {
    const token = ++generation;
    busy = false;
    origin = button;
    view.input = "";
    archive = null;
    previewed = null;
    view.error = "";
    resetPreview();
    translate();
    view.open = true;
    clipboard
      .readText()
      .then((text) => {
        if (view.open && !disposed && token === generation && !view.input) {
          view.input = text;
          return loadText(text);
        }
      })
      .catch(() => {
        if (view.open && !disposed && token === generation) {
          view.error = t("clipboardFallback");
          document.getElementById("gameArchiveText")?.focus();
        }
      });
  }
  view.read = loadText;
  view.chooseFile = async (selected) => {
    if (view.committing) return;
    const token = ++generation;
    busy = false;
    previewed = null;
    archive = null;
    resetPreview();
    view.error = "";
    if (selected.size > service.MAX_BYTES) {
      view.error = t("tooLarge");
      return;
    }
    try {
      const text = await selected.text();
      if (disposed || !view.open || token !== generation) return;
      view.input = text;
      await loadText(text);
    } catch (error) {
      if (!disposed && view.open && token === generation)
        view.error = message(error);
    }
  };
  view.edit = () => {
    generation++;
    busy = false;
    resetPreview();
    archive = null;
  };
  function close() {
    view.open = false;
    generation++;
    busy = false;
    archive = null;
    resetPreview();
    if (origin?.isConnected) origin.focus({ preventScroll: true });
  }
  view.close = () => {
    if (!view.committing) close();
  };
  events.listen(document, "worktime:languagechange", translate);
  function detach(container) {
    const status = controls.get(container);
    status?.hold?.dispose();
    controls.delete(container);
    if (!controls.size) clearNoticeTimers();
  }
  function decorate(container, header) {
    detach(container);
    const save = header.querySelector('[data-game-archive="save"]');
    const restore = header.querySelector('[data-game-archive="import"]');
    restore.onclick = () => open(restore);
    const status = header.querySelector(".game-menu-archive-status");
    controls.set(container, status);
    let saving = false;
    async function saveArchive(toFile) {
      if (saving || disposed) return;
      saving = true;
      try {
        await WorkTimeApp.games.prepareArchive();
        if (disposed) return;
        const value = service.exportArchive();
        if (toFile) download(value);
        else await clipboard.writeText(await service.encode(value));
        if (!disposed) announce(t(toFile ? "downloaded" : "copied"), true);
      } catch (error) {
        if (!disposed) announce(message(error));
      } finally {
        saving = false;
      }
    }
    status.hold = WorkTimeApp.ui.createHoldAction({
      button: save,
      onShort: () => saveArchive(false),
      onLong: () => saveArchive(true),
      keys: ["Space", "Enter"],
    });
  }
  translate();
  return {
    decorate,
    detach,
    isOpen: () => view.open,
    report: (error) => announce(message(error)),
    dispose() {
      disposed = true;
      clearNoticeTimers();
      for (const container of controls.keys()) detach(container);
      events.dispose();
      downloads.dispose();
      close();
      view.read =
        view.chooseFile =
        view.edit =
        view.confirm =
        view.download =
        view.close =
        view.choice =
          undefined;
    },
  };
};
