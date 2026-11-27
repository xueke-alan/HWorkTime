"use strict";
/** Navigate static sidebar views, retaining drafts on nested navigation. */
WorkTimeApp.ui.createSidebarPanels = function ({
  document,
  window,
  leaveBatch,
}) {
  const sidebar = document.querySelector(".summary-sidebar"),
    ids = ["importDialog", "sourceDialog"],
    panes = new Map(ids.map((id) => [id, document.getElementById(id)])),
    overview = [...sidebar.children].filter(
      (element) => !element.matches(".oa-entry, .sidebar-oa-workspace"),
    ),
    host = sidebar.querySelector(".sidebar-oa-workspace"),
    stack = [];
  let disposed = false;
  function finishNavigationMotion() {
    if (disposed) return;
    WorkTimeApp.ui.motion?.stop(host);
    WorkTimeApp.ui.motion?.stop(document.getElementById("cards"));
    for (const animation of sidebar.getAnimations?.({ subtree: true }) || []) {
      const target = animation.effect?.target;
      if (
        !target?.closest?.(".sidebar-header") ||
        !["transform", "opacity", "visibility"].includes(
          animation.transitionProperty,
        )
      )
        continue;
      try {
        animation.finish();
      } catch {
        /* Navigation remains usable without optional animation APIs. */
      }
    }
  }
  function onVisibility() {
    if (document.hidden) finishNavigationMotion();
  }
  const editor = document.querySelector(".workspace > .editor"),
    settings = document.getElementById("settingsPane"),
    settingsButton = document.getElementById("pageSettingsOpen"),
    tablist = settings.querySelector(".settings-tabs"),
    tabs = [...tablist.querySelectorAll("[data-settings-command]")];
  let activeTab = tabs[0];
  function updateSettingsButton(animate = false) {
    const open = !settings.hidden;
    settingsButton.setAttribute("aria-pressed", String(open));
    settingsButton.setAttribute("aria-expanded", String(open));
    settingsButton.dataset.hintText = WorkTimeApp.i18n.t(
      open ? "copy.e2ae92e1ec" : "copy.165118b1d4",
    );
    settingsButton.setAttribute("aria-label", settingsButton.dataset.hintText);
    settingsButton.dataset.actionHint = open
      ? "calendarHint.closeSettings"
      : "calendarHint.settings";
    WorkTimeApp.ui.motion.setToggleIcon(
      settingsButton,
      open,
      "#icon-settings",
      animate,
    );
  }
  function hidePopovers() {
    settings.dispatchEvent(new Event("settings-tab-leave", { bubbles: true }));
    document
      .getElementById("personalSettingsPane")
      .dispatchEvent(new Event("personal-settings-close"));
  }
  function selectTab(tab, focus = false, animate = true) {
    const direction = tabs.indexOf(tab) - tabs.indexOf(activeTab);
    if (tab !== activeTab) {
      hidePopovers();
      WorkTimeApp.ui.motion?.stop(
        document.getElementById(activeTab.getAttribute("aria-controls")),
      );
    }
    activeTab = tab;
    for (const item of tabs) {
      const selected = item === tab;
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute("aria-controls")).hidden =
        !selected;
    }

    if (animate && direction && !settings.hidden)
      WorkTimeApp.ui.motion?.play(
        document.getElementById(tab.getAttribute("aria-controls")),
        direction > 0 ? "motion-sidebar-forward" : "motion-sidebar-back",
      );
    if (focus) tab.focus({ preventScroll: true });
  }
  function closeSettingsPanel({ animate = true } = {}) {
    if (settings.hidden) return;
    if (
      !settings.dispatchEvent(
        new Event("settings-close-request", { cancelable: true }),
      )
    )
      return;
    hidePopovers();
    WorkTimeApp.ui.motion?.stop(settings);
    settings.hidden = true;
    editor.classList.remove("is-page-settings-open", "is-settings-open");
    settings.dispatchEvent(new Event("settings-closed"));
    updateSettingsButton(true);
    if (!disposed && animate) {
      const content = editor.closest(".agenda-mode")
        ? document.getElementById("agendaEditor")
        : editor.querySelector(".editor-content");
      WorkTimeApp.ui.motion?.playEditorSurface(
        content,
        "motion-sidebar-forward",
      );
      settingsButton.focus({ preventScroll: true });
    }
  }
  function openSettings(tab = activeTab) {
    if (disposed) return;
    if (
      WorkTimeApp.ui.secondaryControllers?.deferSettings(() =>
        openSettings(tab),
      )
    )
      return;
    const opening = settings.hidden;
    if (opening) {
      leaveBatch();
      settings.dispatchEvent(new Event("settings-open"));
      document
        .getElementById("personalSettingsPane")
        .dispatchEvent(new Event("personal-settings-open"));
      settings.hidden = false;
      settings.dispatchEvent(new Event("settings-opened"));
      editor.classList.add("is-page-settings-open", "is-settings-open");
      updateSettingsButton(true);
      WorkTimeApp.ui.motion?.stop(editor.querySelector(".editor-content"));
      WorkTimeApp.ui.motion?.stop(document.getElementById("agendaEditor"));
      WorkTimeApp.ui.motion?.playEditorSurface(
        settings,
        "motion-sidebar-forward",
      );
      if (window.matchMedia("(max-width: 1150px)").matches)
        editor.scrollIntoView({ block: "start" });
    }
    selectTab(tab, false, !opening);
  }
  function toggleSettings() {
    if (settings.hidden) openSettings();
    else closeSettingsPanel();
  }
  function tabClick(event) {
    const tab = event.target.closest("[data-settings-command]");
    if (tabs.includes(tab)) selectTab(tab);
  }
  settingsButton.addEventListener("click", toggleSettings);
  tablist.addEventListener("click", tabClick);

  selectTab(activeTab);
  function render() {
    const active = stack.at(-1);
    sidebar.classList.toggle("is-oa-open", !!active);
    WorkTimeApp.ui.workspaceViews.oaActions.back = active
      ? WorkTimeApp.i18n.t(
          stack.length > 1 ? "copy.e1fa5c7224" : "copy.13e491d46e",
        )
      : "";
    host.hidden = !active;
    for (const element of overview)
      element.classList.toggle("sidebar-overview-hidden", !!active);
    for (const [id, pane] of panes)
      pane.classList.toggle("sidebar-pane-inactive", id !== active?.id);
    if (active) {
      const pane = panes.get(active.id),
        back =
          stack.length > 1
            ? WorkTimeApp.i18n.t("copy.b14f0fab76")
            : WorkTimeApp.i18n.t("copy.07fcc4d5f6");
      const close = pane.querySelector(".dialog-head [data-close]");
      if (close) {
        close.setAttribute("aria-label", back);
        close.dataset.hintText = back;
      }
      pane.querySelectorAll(".dialog-foot [data-close]").forEach((button) => {
        button.querySelector(".button-label").textContent =
          active.id === "importDialog"
            ? WorkTimeApp.i18n.t("copy.4d0b4688c7")
            : WorkTimeApp.i18n.t("copy.11d0241540");
      });
    }
  }
  function open(id, { motionDuration } = {}) {
    if (id === "settingsDialog" && !disposed) {
      openSettings(document.getElementById("settingsWorkTab"));
      return true;
    }
    if (!panes.has(id) || disposed) return false;
    const navigating = stack.at(-1)?.id !== id;
    const instant = motionDuration === 0;
    if (instant) {
      finishNavigationMotion();
      sidebar.classList.add("sidebar-navigation-instant");
      // Apply zero timing before changing the view, including an interrupted return.
      void sidebar.offsetWidth;
    }
    try {
      const index = stack.findIndex((entry) => entry.id === id);
      if (index >= 0) {
        const removed = stack.splice(index + 1);
        for (const entry of removed) panes.get(entry.id).close();
      } else stack.push({ id, trigger: document.activeElement });
      render();
      const pane = panes.get(id);
      if (!pane.open) pane.show();
      if (navigating && !instant)
        WorkTimeApp.ui.motion?.play(host, "motion-sidebar-forward");
      if (id === "importDialog") pane.dispatchEvent(new Event("sidebar-open"));

      if (window.matchMedia("(max-width: 1150px)").matches)
        sidebar.scrollIntoView({ block: "nearest" });
      (id === "importDialog"
        ? document.getElementById("pasteText")
        : pane.querySelector("#importDetailRawText") ||
          pane.querySelector(".dialog-head [data-close]")
      ).focus({ preventScroll: true });
      if (instant) {
        // Commit the final zero-duration state in the click handler before opening OA.
        void sidebar.offsetWidth;
        finishNavigationMotion();
      }
      return true;
    } finally {
      if (instant) {
        sidebar.classList.remove("sidebar-navigation-instant");
        void sidebar.offsetWidth;
      }
    }
  }
  function closeImport() {
    if (disposed || !stack.length) return;
    const removed = stack.splice(0);
    for (const entry of removed) {
      const pane = panes.get(entry.id);
      WorkTimeApp.ui.motion?.stop(pane);
      if (pane.open) pane.close();
    }
    render();
    finishNavigationMotion();
  }
  function closed(event) {
    const index = stack.findIndex((entry) => entry.id === event.target.id);
    if (index < 0 || disposed) return;
    const removed = stack.splice(index);
    for (const entry of removed.slice(1))
      if (panes.get(entry.id).open) panes.get(entry.id).close();
    render();
    const previous = stack.at(-1);
    WorkTimeApp.ui.motion?.play(
      previous ? host : document.getElementById("cards"),
      "motion-sidebar-back",
    );

    const trigger = removed[0].trigger;
    if (
      !previous &&
      (!trigger?.getClientRects().length || trigger.closest(".oa-entry"))
    ) {
      document.getElementById("importOpen").focus({ preventScroll: true });
      return;
    }
    if (trigger?.isConnected && trigger.getClientRects().length)
      trigger.focus({ preventScroll: true });
  }
  function keydown(event) {
    if (event.defaultPrevented) return;
    if (
      event.key === "Escape" &&
      !settings.hidden &&
      !document.querySelector("dialog:modal")
    ) {
      event.preventDefault();
      closeSettingsPanel();
      return;
    }
    if (
      event.key === "Escape" &&
      stack.length &&
      !document.querySelector("dialog:modal")
    ) {
      event.preventDefault();
      panes.get(stack.at(-1).id).close();
    }
  }
  function dispose() {
    document.removeEventListener("worktime:languagechange", refreshLanguage);
    if (disposed) return;
    disposed = true;
    settingsButton.removeEventListener("click", toggleSettings);
    tablist.removeEventListener("click", tabClick);

    WorkTimeApp.ui.motion?.stop(editor);
    hidePopovers();
    settings.hidden = true;
    editor.classList.remove("is-page-settings-open", "is-settings-open");
    updateSettingsButton();
    document.removeEventListener("keydown", keydown);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("blur", finishNavigationMotion);
    document
      .getElementById("importOpen")
      .removeEventListener("click", returnFromHeader, true);
    for (const pane of panes.values())
      pane.removeEventListener("close", closed);
    stack.length = 0;
  }
  for (const pane of panes.values()) pane.addEventListener("close", closed);
  function returnFromHeader(event) {
    if (!stack.length) return;
    event.stopImmediatePropagation();
    panes.get(stack.at(-1).id).close();
  }
  document
    .getElementById("importOpen")
    .addEventListener("click", returnFromHeader, true);
  document.addEventListener("keydown", keydown);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("blur", finishNavigationMotion);
  function refreshLanguage() {
    render();
    updateSettingsButton();
  }
  document.addEventListener("worktime:languagechange", refreshLanguage);
  return {
    open,
    closeImport,
    dispose,
    closeSettings: closeSettingsPanel,
    finishNavigationMotion,
  };
};
