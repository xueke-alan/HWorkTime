"use strict";
/** imports controller. Instantiate once, then bind after all actions are connected. */
WorkTimeApp.ui.secondary.imports = function (options) {
  const events = WorkTimeApp.ui.createEventScope();
  const {
    element: $,
    core: C,
    escape: esc,
    model,
    application,
    actions,
    clock,
    importIndex,
    hydrateImports,
    clipboard,
  } = options;
  const view = WorkTimeApp.ui.importRecords;
  const { oaActions } = WorkTimeApp.ui.workspaceViews;
  let preview = null;
  let disposed = false;
  let importParseTimer = null;
  let resultsMode = "history";
  let inputRevision = 0;
  let importSaving = false;
  let historyCleanup = null;
  function anomalyReason(record) {
    if (!record.start && !record.end)
      return WorkTimeApp.i18n.t("copy.afaa05cdc4");
    if (!record.start) return WorkTimeApp.i18n.t("copy.447b0f2e6f");
    if (!record.end) return WorkTimeApp.i18n.t("copy.9236f52e70");
    const start = C.timeMin(record.start),
      end = C.timeMin(record.end);
    if (start === null || end === null)
      return WorkTimeApp.i18n.t("copy.8f73c836dc");
    if (!record.nextDay && end < start)
      return WorkTimeApp.i18n.t("copy.381c22871c");
    return "";
  }
  function describeRecord(record) {
    const restDay = record.status === "off";
    const time =
      record.start || record.end
        ? ((record.start || "") + " - " + (record.end || "")).trim()
        : "-";
    return {
      date: record.date,
      time:
        time + (record.nextDay ? WorkTimeApp.i18n.t("copy.c751037c58") : ""),
      restDay: restDay ? WorkTimeApp.i18n.t("copy.743a4ad0dd") : "",
      anomaly: restDay ? "" : anomalyReason(record),
    };
  }
  function recordCells(record) {
    const statusClass = record.restDay
      ? "import-record-rest-day"
      : "import-record-anomaly";
    return (
      "<strong>" +
      esc(record.date.replace(/-/g, "/")) +
      "</strong><span>" +
      esc(record.time) +
      '</span><span class="' +
      statusClass +
      '">' +
      esc(record.restDay || record.anomaly) +
      "</span>"
    );
  }
  function animateResults(mode) {
    if (mode === resultsMode) return;
    resultsMode = mode;
    if ($("importDialog").open)
      WorkTimeApp.ui.motion?.play(
        $("importResultsTitle").closest(".sidebar-import-history"),
        mode === "results" ? "motion-sidebar-forward" : "motion-sidebar-back",
      );
  }
  function resetImportInput() {
    inputRevision++;
    oaActions.clipboardNotice = false;
    $("pasteText").value = "";
    invalidatePreview();
  }
  function setImportParseStatus(status) {
    const summary = $("importSummary");
    summary.dataset.state = status;
    summary.setAttribute("aria-busy", String(status === "pending"));
    $("importDetails").classList.toggle(
      "hidden",
      status !== "success" && status !== "warning",
    );
  }
  function scheduleImportParse() {
    invalidatePreview(!$("pasteText").value.trim());
    setImportParseStatus("pending");
    importParseTimer = setTimeout(parseImport, 250);
  }
  function invalidatePreview(showHistory = true) {
    clearTimeout(importParseTimer);
    importParseTimer = null;
    setImportParseStatus("idle");
    preview = null;
    $("commitImport").disabled = true;
    const summary = $("importSummary");
    summary.textContent = WorkTimeApp.i18n.t("copy.8b76d80fc7");
    summary.removeAttribute("data-hint-text");
    $("importWarnings").textContent = "";
    if (showHistory) {
      $("importTable").classList.add("hidden");
      view.rows = [];
      view.choices = {};
      $("importResultsTitle").textContent =
        WorkTimeApp.i18n.t("copy.dc71cd204d");
      $("importHistoryList").classList.remove("hidden");
      renderImportHistory();
      animateResults("history");
    }
  }
  function showImportParseError(message, detail) {
    invalidatePreview();
    const summary = $("importSummary");
    summary.textContent = message;
    summary.dataset.hintText = detail || message;
    setImportParseStatus("error");
  }
  function prepareClipboardText(text) {
    return WorkTimeApp.services.imports.prepare(
      C,
      model.state,
      [{ name: "粘贴文本", raw: text }],
      clock.year(),
      clock.today(),
    );
  }
  function parseImport(preparedPlan) {
    invalidatePreview(false);
    const year = clock.year(),
      sources = [];
    if ($("pasteText").value.trim())
      sources.push({ name: "粘贴文本", raw: $("pasteText").value });
    if (!sources.length) {
      invalidatePreview();
      return;
    }
    try {
      const plan =
          preparedPlan ||
          WorkTimeApp.services.imports.prepare(
            C,
            model.state,
            sources,
            year,
            clock.today(),
          ),
        { records, warnings, rows } = plan;
      const warningText = warnings.map(WorkTimeApp.i18n.message).join("\n");
      if (!rows.length) {
        showImportParseError(
          WorkTimeApp.i18n.t("import.noAttendanceData"),
          warningText,
        );
        return;
      }
      preview = plan;
      $("importWarnings").textContent = warningText;
      $("importSummary").textContent =
        WorkTimeApp.i18n.t("copy.19b361b64c") +
        records.length +
        WorkTimeApp.i18n.t("copy.c538cd1f50") +
        warnings.length +
        WorkTimeApp.i18n.t("copy.3bc4aa604d") +
        rows.filter((x) => x.result.conflict).length +
        WorkTimeApp.i18n.t("copy.2f47bca658");
      $("importSummary").dataset.hintText =
        warningText || $("importSummary").textContent;
      view.choices = {};
      const describedRows = rows.map(({ record, result, old }) => ({
        ...describeRecord(record),
        conflict: result.conflict
          ? result.repeated
            ? WorkTimeApp.i18n.t("copy.36486f62eb")
            : WorkTimeApp.i18n.t("copy.c8e8abf448") +
              old.start +
              "–" +
              old.end +
              WorkTimeApp.i18n.t("copy.c6750ea6a2") +
              record.start +
              "–" +
              record.end
          : "",
        manual: !!model.state.days[record.date]?.actual,
      }));
      view.rows = describedRows;
      $("importTable").classList.remove("hidden");
      $("importHistoryList").classList.add("hidden");
      $("importResultsTitle").textContent =
        WorkTimeApp.i18n.t("copy.2dc2565cb9");
      animateResults("results");
      const abnormalDates = new Set(
        describedRows
          .filter((row) => row.conflict || row.anomaly)
          .map((row) => row.date),
      );
      $("importHistoryCount").textContent =
        rows.length +
        WorkTimeApp.i18n.t("copy.0d19dbc09e") +
        abnormalDates.size +
        WorkTimeApp.i18n.t("copy.8fc2846555");
      $("commitImport").disabled = importSaving;
      setImportParseStatus(
        warnings.length || rows.some((x) => x.result.conflict)
          ? "warning"
          : "success",
      );
    } catch (error) {
      showImportParseError(
        WorkTimeApp.i18n.t("copy.52574f7e25"),
        WorkTimeApp.i18n.t("copy.0542674ee0") +
          WorkTimeApp.i18n.message(error.message),
      );
    }
  }
  async function commitOARecords(
    records,
    year,
    sources,
    count = records.length,
    focusDate = records[0]?.date,
  ) {
    await historyCleanup;
    const result = await application.importRecords({
      id: WorkTimeApp.services.archive.uuid(),
      at: clock.now().toISOString(),
      year,
      sources,
      count,
      records,
    });
    if (result.duplicate || !result.applied || disposed) return result;
    if (focusDate) {
      model.month = focusDate.slice(0, 7);
      model.selected = model.calendarSelected = focusDate;
    }
    actions.render();
    renderImportHistory();
    return result;
  }
  const dialogs = WorkTimeApp.ui.confirmations,
    removal = dialogs.removal;
  let importToDelete = null;
  async function renderImportHistory() {
    try {
      await historyCleanup;
      await hydrateImports();
    } catch (error) {
      actions.toast(WorkTimeApp.i18n.message(error.message), "error");
      return;
    }
    if (disposed) return;
    const logs = WorkTimeApp.domain.observations.recentImports(
      model.state.imports,
    );
    const dates = new Set(
      logs.flatMap((log) => importIndex.describe(log).acceptedDates),
    );
    if (!preview)
      $("importHistoryCount").textContent = WorkTimeApp.i18n.t(
        "import.historyTotals",
        { imports: logs.length, dates: dates.size },
      );
    view.history = logs.map((log) => {
      const dates = importIndex.describe(log).rawDates;
      return {
        id: log.id,
        count: log.count,
        range: dates.length
          ? dates[0].replaceAll("-", "/") +
            " - " +
            dates.at(-1).replaceAll("-", "/")
          : WorkTimeApp.i18n.t("copy.0cee9f5104"),
        when: new Date(log.at).toLocaleString(WorkTimeApp.i18n.locale, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      };
    });
  }
  function openImportHistory() {
    if ($("importDialog").open && !historyCleanup)
      historyCleanup = application.deduplicateImports().finally(() => {
        historyCleanup = null;
      });
    void renderImportHistory();
  }
  let detailId = null;
  async function showImportDetail(id, valid = () => true) {
    try {
      await hydrateImports();
    } catch (error) {
      actions.toast(WorkTimeApp.i18n.message(error.message), "error");
      return;
    }
    if (disposed || !valid()) return;
    const log = model.state.imports.find((log) => log.id === id);
    if (!log) return;
    detailId = id;
    const pane = $("sourceDialog");
    pane.classList.add("import-detail-view");
    pane.classList.remove("import-detail-raw");
    pane.querySelector("h2").innerHTML =
      "<span>" +
      esc(
        new Date(log.at).toLocaleString(WorkTimeApp.i18n.locale, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      ) +
      WorkTimeApp.i18n.t("copy.b336d19181");
    const records = log.records.map(describeRecord);
    $("sourceBody").innerHTML =
      '<div class="import-detail-toolbar"><span class="muted">' +
      records.length +
      WorkTimeApp.i18n.t("copy.0d19dbc09e") +
      records.filter((record) => record.anomaly).length +
      WorkTimeApp.i18n.t("copy.6827141ae0") +
      '<div class="import-parsed-list">' +
      records
        .map((record) => "<article>" + recordCells(record) + "</article>")
        .join("") +
      (records.length ? "" : WorkTimeApp.i18n.t("copy.dafb4362f7")) +
      "</div>" +
      WorkTimeApp.i18n.t("copy.ae4748b462") +
      WorkTimeApp.i18n.t("copy.d7f42a424c") +
      esc(log.sources.map((source) => source.raw).join("\n\n")) +
      "</textarea></div>";
    $("sourceBody").scrollTop = 0;
    WorkTimeApp.ui.alignment?.refresh([pane]);
  }
  async function showSources(valid = () => true) {
    try {
      await hydrateImports();
    } catch (error) {
      actions.toast(WorkTimeApp.i18n.message(error.message), "error");
      return;
    }
    if (disposed || !valid()) return;
    const day = model.state.days[model.selected] || {},
      logs = importIndex.logsForDate(model.state.imports, model.selected),
      log =
        model.state.imports.find((item) => item.id === day.oa?.importId) ||
        logs
          .slice()
          .reverse()
          .find((item) =>
            importIndex.describe(item).acceptedDates.includes(model.selected),
          ) ||
        logs.at(-1);
    if (!log) {
      actions.toast(WorkTimeApp.i18n.t("copy.184ad4d4ad"));
      return;
    }
    await showImportDetail(log.id, valid);
    if (!disposed && valid()) actions.open("sourceDialog");
  }
  function editOALink() {
    $("oaLinkInput").value = model.state.oaUrl || "";
    $("oaLinkError").textContent = "";
    actions.open("oaLinkDialog");
    $("oaLinkInput").focus();
  }
  function openImport(openOptions) {
    parseImport();
    actions.open("importDialog", openOptions);
  }
  async function readReturnedClipboard(valid) {
    const input = $("pasteText"),
      revision = inputRevision;
    const current = () =>
      !disposed &&
      valid() &&
      $("importDialog").open &&
      inputRevision === revision &&
      !input.value.trim();
    if (!current()) return;
    try {
      const text = await clipboard.readText();
      if (!current() || !text.trim()) return;
      const plan = prepareClipboardText(text);
      if (!plan.rows.length || !current()) return;
      input.value = text;
      inputRevision++;
      parseImport(plan);
      oaActions.clipboardNotice = !!preview;
    } catch {
      if (current())
        actions.toast(WorkTimeApp.i18n.t("copy.a97d627f90"), "error");
    }
  }
  let bound = false;
  function bind() {
    if (bound) return;
    bound = true;
    disposed = false;
    events.listen(document, "worktime:languagechange", () => {
      if ($("importDialog").open) {
        const choices = { ...view.choices };
        parseImport();
        if (preview) view.choices = choices;
      } else renderImportHistory();
      if ($("sourceDialog").open && detailId) showImportDetail(detailId);
    });
    events.listen($("importDialog"), "close", resetImportInput);
    events.listen($("importDialog"), "sidebar-open", openImportHistory);
    events.handler($("importHistoryList"), "onclick", async (e) => {
      await hydrateImports();
      const view = e.target.closest("[data-view-import]"),
        remove = e.target.closest("[data-delete-import]");
      if (view) {
        const log = model.state.imports.find(
          (item) => item.id === view.dataset.viewImport,
        );
        if (!log) return;
        showImportDetail(log.id);
        actions.open("sourceDialog");
        return;
      }
      if (!remove) return;
      const log = model.state.imports.find(
        (x) => x.id === remove.dataset.deleteImport,
      );
      if (!log) return;
      importToDelete = log.id;
      const previewState = actions.clone(model.state),
        impact = C.deleteImport(previewState, log.id);
      removal.summary = WorkTimeApp.i18n.t("import.deleteSummary", {
        date: new Date(log.at).toLocaleString(WorkTimeApp.i18n.locale),
        sources: log.sources.map((s) => s.name).join(", "),
        affected: impact.affected,
        restored: impact.restored,
        cleared: impact.cleared,
      });
      actions.open("deleteImportDialog");
    });
    removal.onClose = () => {
      importToDelete = null;
    };
    removal.confirm = async () => {
      if (!importToDelete || removal.busy) return;
      removal.busy = true;
      try {
        const commit = await application.removeImport(importToDelete);
        const result = commit.impact;
        importToDelete = null;
        dialogs.close(removal);
        if (!result.removed) {
          actions.toast(WorkTimeApp.i18n.t("copy.38e1e768da"));
          return;
        }
        const saved = commit.persisted;
        actions.render();
        renderImportHistory();
        actions.saveFeedback(saved, WorkTimeApp.i18n.t("copy.5986f6bd33"));
      } finally {
        removal.busy = false;
      }
    };
    events.handler($("oaLinkForm"), "onsubmit", async (event) => {
      event.preventDefault();
      try {
        const url = new URL($("oaLinkInput").value.trim());
        if (
          !["http:", "https:"].includes(url.protocol) ||
          url.username ||
          url.password
        )
          throw Error(WorkTimeApp.i18n.t("copy.1b5b47c899"));
        if ((await application.saveOAUrl(url.href)).persisted) {
          $("oaLinkDialog").close();
          actions.toast(WorkTimeApp.i18n.t("copy.130c1e06f3"));
        }
      } catch (error) {
        $("oaLinkError").textContent = WorkTimeApp.i18n.message(error.message);
      }
    });
    events.handler($("pasteText"), "oninput", () => {
      inputRevision++;
      oaActions.clipboardNotice = false;
      scheduleImportParse();
    });
    events.handler($("commitImport"), "onclick", async () => {
      if (importSaving || !preview?.rows.length) return;
      const plan = preview;
      const revision = inputRevision;
      const processed = plan.rows.length;
      const acceptedRecords = WorkTimeApp.services.imports.acceptedRecords(
        plan,
        (row, i) => view.choices[i] || "new",
      );
      importSaving = true;
      $("commitImport").disabled = true;
      try {
        const result = await commitOARecords(
          acceptedRecords,
          plan.year,
          plan.sources,
          processed,
          plan.rows[0]?.record.date,
        );
        if (disposed) return;
        const originalInput =
          $("importDialog").open && revision === inputRevision;
        if (result.duplicate) {
          if (originalInput) resetImportInput();
          actions.toast(WorkTimeApp.i18n.t("import.duplicateBatch"));
          return;
        }
        if (result.applied && originalInput) $("importDialog").close();
        actions.saveFeedback(
          result.persisted,
          WorkTimeApp.i18n.t("copy.a3fdb05924") +
            processed +
            WorkTimeApp.i18n.t("copy.bed75b3651"),
        );
      } catch (error) {
        if (!disposed)
          actions.toast(WorkTimeApp.i18n.message(error.message), "error");
      } finally {
        importSaving = false;
        if (!disposed) $("commitImport").disabled = !preview?.rows.length;
      }
    });
  }
  function dispose() {
    dialogs.close(removal);
    removal.onClose = removal.confirm = undefined;
    events.dispose();
    bound = false;
    disposed = true;
    oaActions.clipboardNotice = false;
    clearTimeout(importParseTimer);
  }
  const hasDraft = () =>
    !!$("pasteText").value.trim() ||
    ($("oaLinkDialog").open &&
      $("oaLinkInput").value.trim() !== model.state.oaUrl);
  return {
    bind,
    dispose,
    hasDraft,
    openImport,
    readReturnedClipboard,
    showSources,
    editOALink,
  };
};
