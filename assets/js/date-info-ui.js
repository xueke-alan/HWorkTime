(function (g) {
  "use strict";
  const events = WorkTimeApp.ui.createEventScope();
  const icons = {
    clock: "clock",
    notifications: "notifications",
    history: "history",
    sun: "sun",
    cloud: "cloud",
    calendar: "calendar",
  };
  const tabStorageKey = "worktime.dateInfo.activeTab";
  let date = "",
    active = "notifications",
    tabController = null;
  try {
    active = localStorage.getItem(tabStorageKey) || active;
  } catch {}
  const toolIds = ["reader", "typing", "vocabulary"];
  const developmentIds = ["reader", "typing"];
  const { isDevelopmentEnabled } = WorkTimeApp;
  const appIds = [...toolIds, "games", "music"];
  if (toolIds.includes(active)) active = "tools";
  function rememberTab() {
    try {
      localStorage.setItem(
        tabStorageKey,
        toolIds.includes(active) ? "tools" : active,
      );
    } catch {}
  }
  const notices = document.getElementById("editorInfo"),
    bar = document.querySelector(".editor .notification-tabs"),
    area = document.querySelector(".date-info-area"),
    panel = document.getElementById("dateInfoPanel");

  bar.setAttribute("aria-label", WorkTimeApp.i18n.t("copy.b0f0d53b40"));
  WorkTimeApp.services.dateInfo.register({
    id: "notifications",
    label: WorkTimeApp.i18n.t("copy.7a66c0d036"),
    icon: "notifications",
    getContent: () => ({ title: WorkTimeApp.i18n.t("copy.7a66c0d036") }),
  });
  function node(tag, text, cls) {
    const e = WorkTimeApp.ui.native.createElement(tag);
    if (text !== undefined) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  }
  const defaultDateView = "festivals";
  const dateViews = [defaultDateView, "history", "almanac"];
  const gamesPanel = node("section", undefined, "games-panel");
  gamesPanel.id = "gamesPanel";
  gamesPanel.hidden = true;
  gamesPanel.setAttribute("role", "tabpanel");
  gamesPanel.setAttribute("aria-labelledby", "date-tab-games");
  panel.after(gamesPanel);
  const musicPanel = node("section", undefined, "music-panel");
  musicPanel.id = "musicPanel";
  musicPanel.hidden = true;
  musicPanel.setAttribute("role", "tabpanel");
  musicPanel.setAttribute("aria-labelledby", "musicOpen");
  gamesPanel.after(musicPanel);
  const readerPanel = node("section", undefined, "reader-panel");
  readerPanel.id = "readerPanel";
  readerPanel.hidden = true;
  readerPanel.setAttribute("role", "tabpanel");
  readerPanel.setAttribute("aria-labelledby", "readerOpen");
  musicPanel.after(readerPanel);
  const typingPanel = node("section", undefined, "typing-panel");
  typingPanel.id = "typingPanel";
  typingPanel.hidden = true;
  typingPanel.setAttribute("role", "tabpanel");
  typingPanel.setAttribute("aria-labelledby", "typingOpen");
  readerPanel.after(typingPanel);
  const vocabularyPanel = node("section", undefined, "vocabulary-panel");
  vocabularyPanel.id = "vocabularyPanel";
  vocabularyPanel.hidden = true;
  vocabularyPanel.setAttribute("role", "tabpanel");
  vocabularyPanel.setAttribute("aria-labelledby", "vocabularyOpen");
  typingPanel.after(vocabularyPanel);
  const toolsPanel = node("section", undefined, "tools-panel");
  toolsPanel.id = "toolsPanel";
  toolsPanel.hidden = true;
  toolsPanel.setAttribute("role", "tabpanel");
  toolsPanel.setAttribute("aria-labelledby", "date-tab-tools");
  musicPanel.after(toolsPanel);
  const toolEntries = appIds.map((id) => {
    const standalone = toolIds.includes(id);
    const label = standalone
      ? "tools." + id
      : id === "games"
        ? "games.tab"
        : "media.music.title";
    return {
      id,
      trigger: id + (standalone ? "Open" : "ToolOpen"),
      label,
      description: standalone ? label + "Description" : label,
      development: developmentIds.includes(id),
    };
  });
  const directory = WorkTimeApp.ui.mountToolDirectory(
    toolsPanel,
    toolEntries,
    (id) => {
      if (developmentIds.includes(id) && !isDevelopmentEnabled()) return;
      if (toolIds.includes(id)) WorkTimeApp.ui[id].open();
      else WorkTimeApp.ui.dateInfo.selectTab(id);
    },
  );
  toolsPanel.append(readerPanel, typingPanel, vocabularyPanel);
  for (const child of [readerPanel, typingPanel, vocabularyPanel]) {
    child.removeAttribute("role");
    child.setAttribute("aria-labelledby", "date-tab-tools");
  }
  function showToolsPanel(focusId) {
    if (disposed) return;
    active = "tools";
    rememberTab();
    render();
    if (toolIds.includes(focusId)) directory.focus(focusId + "Open");
  }
  function refreshTools() {
    directory.refresh(active, isDevelopmentEnabled());
  }
  let selectedDateView = dateViews.includes(active) ? active : defaultDateView;
  const dateHeader = node("div", undefined, "date-context-header");
  const dateHeading = node("time", "", "date-context-date");
  const dateSwitch = node("div", undefined, "date-context-switch");
  const dateViewLabel = node(
    "label",
    WorkTimeApp.i18n.t("copy.15245b56da"),
    "sr-only",
  );
  dateViewLabel.id = "dateContextLabel";
  const dateViewSelect = node("select");
  dateViewSelect.id = "dateContextView";
  dateViewSelect.hidden = true;
  dateSwitch.append(dateViewLabel, dateViewSelect);
  let dateSelectView = null,
    dateSelectScope = null;
  function syncDateSelect() {
    const options = [
      ["festivals", "copy.860caf9fd7"],
      ["history", "copy.be78b20585"],
      ["almanac", "copy.e393811f90"],
    ].filter(([id]) => id !== "almanac" || WorkTimeApp.i18n.config.almanac);
    dateViewLabel.textContent = WorkTimeApp.i18n.t("copy.15245b56da");
    dateViewSelect.replaceChildren(
      ...options.map(([value, key]) => {
        const option = node("option", WorkTimeApp.i18n.t(key));
        option.value = value;
        return option;
      }),
    );
    dateViewSelect.value = selectedDateView;
    dateSelectView?.sync();
  }
  dateHeader.append(dateHeading, dateSwitch);
  dateHeader.hidden = true;
  panel.before(dateHeader);
  function link(text, url) {
    const e = node("a", text);
    try {
      const u = new URL(url);
      if (u.protocol !== "https:") return node("span", text);
      if (u.hostname === "zh.wikipedia.org") {
        u.pathname = u.pathname.replace("/wiki/", "/zh-cn/");
        u.searchParams.set("variant", "zh-cn");
      }
      e.href = u.href;
      e.target = "_blank";
      e.rel = "noreferrer";
      return e;
    } catch {
      return node("span", text);
    }
  }
  let visibleAlerts = new Map(),
    translatingAlerts = false;
  function updateNotificationBadge() {
    const button = document.getElementById("date-tab-notifications");
    if (!button) return;
    const items = [...notices.querySelectorAll(".info-notification")].filter(
      (item) => {
        for (let e = item; e && e !== notices; e = e.parentElement) {
          if (e.hidden || e.classList.contains("hidden")) return false;
        }
        return true;
      },
    );
    const currentAlerts = new Map(
      items
        .filter(
          (item) =>
            item.classList.contains("tone-warning") ||
            item.classList.contains("tone-error"),
        )
        .map((item) => [
          item,
          (item.classList.contains("tone-error") ? "error:" : "warning:") +
            (
              item.querySelector(".notification-body")?.textContent || ""
            ).trim(),
        ]),
    );
    const hasNewAlert = [...currentAlerts].some(
      ([item, signature]) => visibleAlerts.get(item) !== signature,
    );
    visibleAlerts = currentAlerts;
    // Startup notices establish the baseline without replacing the saved tab.
    const firstScreenReady =
      document.documentElement.dataset.appState === "ready" &&
      !document.documentElement.classList.contains("app-loading");
    if (
      firstScreenReady &&
      hasNewAlert &&
      !translatingAlerts &&
      active !== "notifications"
    ) {
      active = "notifications";
      render();
      notices.scrollTop = 0;
    }
    const tone = items.some((e) => e.classList.contains("tone-error"))
      ? "error"
      : items.some((e) => e.classList.contains("tone-warning"))
        ? "warning"
        : "";
    let badge = button.querySelector(".notification-badge");
    if (tone) {
      if (!badge) {
        badge = node("span", undefined, "notification-badge");
        badge.setAttribute("aria-hidden", "true");
        button.append(badge);
      }
      badge.dataset.tone = tone;
    } else badge?.remove();
    button.setAttribute(
      "aria-label",
      tone
        ? WorkTimeApp.i18n.t("copy.c08754e8f2") +
            (tone === "error"
              ? WorkTimeApp.i18n.t("copy.b859c7be75")
              : WorkTimeApp.i18n.t("copy.81944e48a3")) +
            "）"
        : WorkTimeApp.i18n.t("copy.7a66c0d036"),
    );
  }
  const badgeObserver = new MutationObserver(updateNotificationBadge);
  let renderedView = null,
    countdownNodes = null,
    timer = null,
    disposed = true,
    unsubscribeWeather = null;
  let countdownFocus = null,
    focusAnimation = null;
  const focusMotion = WorkTimeApp.ui.animationCompat?.preference();
  function stopFocusAnimation() {
    focusAnimation?.cancel();
    focusAnimation = null;
  }
  function animateFocusChange(entering) {
    stopFocusAnimation();
    if (focusMotion?.matches || disposed || document.hidden) return;
    const target = entering
      ? countdownNodes?.box
      : document.querySelector(".wrap") || panel;
    if (!target) return;
    focusAnimation = WorkTimeApp.ui.animationCompat?.animate(
      target,
      [
        { opacity: 0, transform: "translateY(8px) scale(0.97)" },
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ],
      { duration: 300, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
  }
  const focusButton = node("button", undefined, "countdown-focus-toggle");
  focusButton.type = "button";
  focusButton.id = "countdownFocusToggle";
  function updateFocusButton() {
    const label = countdownFocus
      ? WorkTimeApp.i18n.t("copy.f4489cd631")
      : WorkTimeApp.i18n.t("copy.a34e15168a");
    focusButton.dataset.hintText = label;
    focusButton.setAttribute("aria-label", label);
    focusButton.setAttribute("aria-pressed", String(!!countdownFocus));
    focusButton.innerHTML = WorkTimeApp.ui
      .createElements(document)
      .icon(countdownFocus ? "hide" : "expand-content");
  }
  updateFocusButton();
  function exitCountdownFocus(restoreFocus = true) {
    if (!countdownFocus) return;
    stopFocusAnimation();
    const { branches, ancestors, x, y } = countdownFocus;
    countdownFocus = null;
    document.body.classList.remove("is-countdown-focused");
    for (const [element, inert] of branches) {
      element.inert = inert;
      element.classList.remove("countdown-focus-hidden");
    }
    for (const element of ancestors)
      element.classList.remove("countdown-focus-ancestor");
    updateFocusButton();
    g.scrollTo(x, y);
    if (restoreFocus && focusButton.isConnected)
      focusButton.focus({ preventScroll: true });
    if (restoreFocus) animateFocusChange(false);
  }
  function toggleCountdownFocus() {
    if (countdownFocus) return exitCountdownFocus();
    if (disposed || active !== "countdown") return;
    const branches = [],
      ancestors = [];
    let current = panel;
    while (current.parentElement) {
      const parent = current.parentElement;
      for (const sibling of parent.children) {
        if (sibling === current) continue;
        branches.push([sibling, sibling.inert]);
        sibling.inert = true;
        sibling.classList.add("countdown-focus-hidden");
      }
      if (parent === document.body) break;
      ancestors.push(parent);
      parent.classList.add("countdown-focus-ancestor");
      current = parent;
    }
    countdownFocus = { branches, ancestors, x: g.scrollX, y: g.scrollY };
    document.body.classList.add("is-countdown-focused");
    updateFocusButton();
    focusButton.focus({ preventScroll: true });
    animateFocusChange(true);
  }
  function onFocusKeydown(event) {
    if (event.target.closest?.("#musicDialog")) return;
    if (!countdownFocus) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      exitCountdownFocus();
    } else if (event.key === "Tab") {
      event.preventDefault();
      focusButton.focus({ preventScroll: true });
    }
  }
  function synchronizeTimer() {
    clearTimeout(timer);
    timer = null;
    panel.classList.toggle(
      "countdown-paused",
      disposed || active !== "countdown" || document.hidden,
    );
    if (!disposed && date && active === "countdown" && !document.hidden)
      timer = setTimeout(tickCountdown, 1000 - (Date.now() % 1000));
  }
  function tickCountdown() {
    if (disposed || document.hidden || active !== "countdown") {
      synchronizeTimer();
      return;
    }
    const content = WorkTimeApp.services.dateInfo.getContent(active, date);
    if (content?.ok && content.countdown) {
      renderCountdown(content.countdown);
      synchronizeTimer();
    } else render();
  }
  function renderCountdown(value) {
    if (!countdownNodes || countdownNodes.box.parentElement !== panel) {
      const box = node("div", undefined, "work-countdown"),
        message = node("p", undefined, "countdown-message"),
        time = node("strong", undefined, "countdown-time"),
        end = node("p", undefined, "countdown-end");
      const restIcon = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      restIcon.classList.add("countdown-rest-icon");
      restIcon.setAttribute("viewBox", "0 0 96 96");
      restIcon.setAttribute("aria-hidden", "true");
      restIcon.setAttribute("focusable", "false");
      restIcon.innerHTML =
        '<g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M70 44h7a11 11 0 0 1 0 22H67"/><path d="M22 43h48l-3 23a18 18 0 0 1-18 16h-6a18 18 0 0 1-18-16Z" fill="currentColor" fill-opacity=".2"/><ellipse cx="46" cy="43" rx="24" ry="5"/><path d="M15 86h63"/><g class="countdown-rest-steam"><path d="M34 30c-10-10 10-13 0-24M48 28c-10-10 10-13 0-24M62 30c-10-10 10-13 0-24"/></g></g>';
      const scenery = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      scenery.classList.add("countdown-scenery");
      scenery.setAttribute("viewBox", "0 0 800 500");
      scenery.setAttribute("preserveAspectRatio", "xMidYMid slice");
      scenery.setAttribute("aria-hidden", "true");
      scenery.setAttribute("focusable", "false");
      scenery.innerHTML =
        '<defs><linearGradient id="countdown-sky" x2="0" y2="1"><stop stop-color="#e1f1ee"/><stop offset="1" stop-color="#fff0dc"/></linearGradient><linearGradient id="countdown-hills" x2="0" y2="1"><stop stop-color="#93bdb0"/><stop offset="1" stop-color="#d5e7df"/></linearGradient></defs>' +
        '<path fill="url(#countdown-sky)" d="M0 0h800v500H0z"/>' +
        '<g class="countdown-sunset"><circle cx="620" cy="285" r="82" fill="#efc995" opacity=".12"/><circle cx="620" cy="285" r="58" fill="#edbb84" opacity=".2"/><circle cx="620" cy="285" r="37" fill="#eab483" opacity=".7"/></g>' +
        '<g class="countdown-clouds" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".55"><path d="M60 130h80m-55 15h100M510 100h100m-65 16h110"/></g>' +
        '<g class="countdown-stars" fill="#6c9c92"><circle cx="120" cy="76" r="2"/><circle cx="690" cy="155" r="2.5"/><circle cx="440" cy="58" r="2"/><path d="m235 130 2-6 2 6 6 2-6 2-2 6-2-6-6-2zM735 63l2-6 2 6 6 2-6 2-2 6-2-6-6-2z"/></g>' +
        '<path fill="url(#countdown-hills)" opacity=".5" d="M0 360Q90 265 210 356T430 365T650 330T850 355V500H0Z"/>' +
        '<path fill="#80ad9e" opacity=".25" d="M0 410Q130 330 280 405T540 415T800 365V500H0Z"/>' +
        '<path fill="#629b8d" opacity=".18" d="M0 450Q160 380 350 448T800 420V500H0Z"/>';
      panel.replaceChildren(focusButton, scenery, box);
      box.append(restIcon);
      box.append(message, time, end);
      countdownNodes = { box, message, time, end };
    }
    const { box, message, time, end } = countdownNodes;
    box.classList.toggle("is-rest", value.status === "rest");
    panel.classList.toggle("countdown-done", value.status === "done");
    for (const [element, text] of [
      [message, value.message],
      [end, value.detail || ""],
    ]) {
      if (element.textContent !== text) element.textContent = text;
    }
    WorkTimeApp.ui.numbers.set(time, value.time || null, {
      placeholder: "",
      animateInitial: false,
    });
    for (const [element, visible] of [
      [time, !!value.time],
      [end, !!value.detail],
    ]) {
      element.hidden = !visible;
      element.classList.toggle("hidden", !visible);
    }
  }
  function render() {
    // Restored weather/countdown tabs can notify before the editor supplies its
    // first selected date. Wait for setDate rather than formatting an empty date.
    if (disposed || !date) return;
    bar
      .closest(".editor")
      .classList.toggle(
        "is-vocabulary-open",
        active === "vocabulary" && !WorkTimeApp.ui.vocabulary.isMini,
      );
    if (active === "almanac" && !WorkTimeApp.i18n.config.almanac)
      active = selectedDateView = defaultDateView;
    if (active !== "countdown") exitCountdownFocus(false);
    synchronizeTimer();
    const view = active;
    if (renderedView !== null && renderedView !== view) {
      const surface = (id) =>
        id === "tools" || toolIds.includes(id)
          ? toolsPanel
          : id === "notifications"
            ? notices
            : id === "games"
              ? gamesPanel
              : id === "music"
                ? musicPanel
                : id === "reader"
                  ? readerPanel
                  : id === "typing"
                    ? typingPanel
                    : id === "vocabulary"
                      ? vocabularyPanel
                      : panel;
      if (surface(renderedView) !== surface(view))
        WorkTimeApp.ui.motion?.stop(surface(renderedView));
      WorkTimeApp.ui.motion?.play(surface(view));
    }
    renderedView = view;
    tabController?.select(
      toolIds.includes(active)
        ? "tools"
        : dateViews.includes(active)
          ? "history"
          : active,
    );
    notices.hidden = active !== "notifications";
    panel.hidden =
      active === "notifications" ||
      active === "tools" ||
      active === "games" ||
      active === "music" ||
      active === "reader" ||
      active === "typing" ||
      active === "vocabulary";
    toolsPanel.hidden =
      (active !== "tools" && !toolIds.includes(active)) ||
      (active === "vocabulary" && !!WorkTimeApp.ui.vocabulary.isMini);
    refreshTools();
    gamesPanel.hidden = active !== "games";
    musicPanel.hidden = active !== "music";
    readerPanel.hidden = active !== "reader";
    typingPanel.hidden = active !== "typing";
    vocabularyPanel.hidden = active !== "vocabulary";
    const grouped = dateViews.includes(active);
    dateHeader.hidden = !grouped;
    area.classList.toggle("has-date-context", grouped);
    dateHeading.textContent =
      WorkTimeApp.i18n.language !== "zh-CN"
        ? WorkTimeApp.i18n.date(date)
        : date;
    dateHeading.dateTime = date;
    dateViewSelect.value = selectedDateView;
    dateSelectView?.sync();
    area.classList.toggle("has-date-info", active !== "notifications");
    WorkTimeApp.services.weather?.setDemand("details", active === "weather");
    WorkTimeApp.ui.music.refresh();
    WorkTimeApp.ui.reader.refresh();
    WorkTimeApp.ui.typing.refresh();
    WorkTimeApp.ui.vocabulary.refresh();
    if (
      active === "notifications" ||
      active === "tools" ||
      active === "games" ||
      active === "music" ||
      active === "reader" ||
      active === "typing" ||
      active === "vocabulary"
    )
      return;
    panel.setAttribute(
      "aria-labelledby",
      grouped ? dateViewLabel.id : "date-tab-" + active,
    );
    panel.classList.toggle("countdown-panel", active === "countdown");
    panel.classList.toggle("almanac-panel", active === "almanac");
    panel.classList.toggle("festivals-panel", active === "festivals");
    panel.classList.toggle("weather-panel", active === "weather");
    const needsLunar =
      ["almanac", "festivals"].includes(active) &&
      (!g.Solar ||
        !WorkTimeApp.data.dateInfo.festivals.length ||
        !WorkTimeApp.data.dateInfo.internationalByDate);
    if (
      needsLunar ||
      (active === "history" &&
        !WorkTimeApp.services.dateInfo.historyData()[date.slice(5)])
    ) {
      const requestedDate = date;
      const requestedLanguage = WorkTimeApp.i18n.language;
      const requestedView = active;
      panel.replaceChildren(
        node("p", WorkTimeApp.i18n.t("copy.087b32dc6e"), "date-info-empty"),
      );
      (needsLunar
        ? WorkTimeApp.services.dateInfo.loadLunar()
        : WorkTimeApp.services.dateInfo.loadHistory(date)
      ).then(
        () => {
          if (
            !disposed &&
            active === requestedView &&
            date === requestedDate &&
            WorkTimeApp.i18n.language === requestedLanguage
          )
            render();
        },
        (error) => {
          if (
            disposed ||
            active !== requestedView ||
            date !== requestedDate ||
            WorkTimeApp.i18n.language !== requestedLanguage
          )
            return;
          const retry = node(
            "button",
            WorkTimeApp.i18n.t("copy.e2d53a6d3a"),
            "ui-button",
          );
          retry.type = "button";
          retry.addEventListener("click", render, { once: true });
          panel.replaceChildren(
            node(
              "p",
              WorkTimeApp.i18n.message(error.message),
              "date-info-empty",
            ),
            retry,
          );
        },
      );
      return;
    }
    const c = WorkTimeApp.services.dateInfo.getContent(active, date) || {
      ok: false,
      title: WorkTimeApp.i18n.t("copy.b0f0d53b40"),
      message: WorkTimeApp.i18n.t("copy.e275fbb4fd"),
    };
    if (c.ok && c.weather) {
      countdownNodes = null;
      WorkTimeApp.ui.weather?.render(panel, c.weather);
      return;
    }
    if (c.ok && c.countdown) {
      renderCountdown(c.countdown);
      return;
    }
    countdownNodes = null;
    panel.replaceChildren();
    if (!grouped && active !== "countdown")
      panel.append(node("p", c.date || date, "date-info-date"));
    if (!c.ok) {
      panel.append(node("p", c.message, "date-info-empty"));
      return;
    }
    if (c.events) {
      if (!c.events.length) panel.append(node("p", c.empty, "date-info-empty"));
      for (const e of c.events) {
        const article = node("article", undefined, "history-event");
        const entry = node("div", undefined, "history-event-content");
        entry.append(
          node(
            "strong",
            e.year < 0
              ? WorkTimeApp.i18n.t("history.bce", { year: Math.abs(e.year) })
              : String(e.year),
          ),
          node("p", e.text),
        );
        article.append(entry);
        panel.append(article);
      }
    }
    if (c.almanac) {
      const values = Object.fromEntries(c.rows),
        sheet = node("div", undefined, "almanac-sheet"),
        head = node("div", undefined, "almanac-heading"),
        header = node("div", undefined, "almanac-header");
      head.append(
        node("span", c.almanac.month, "almanac-date-text"),
        node("span", c.almanac.day, "almanac-date-text"),
      );
      const cycle = node("p", undefined, "almanac-cycle"),
        cycleParts = values[WorkTimeApp.i18n.message("干支")]
          .trim()
          .split(/\s+/);
      cycle.append(
        node("span", cycleParts.slice(0, 2).join(" ")),
        node(
          "span",
          cycleParts.slice(2).join(" ") +
            WorkTimeApp.i18n.t("copy.da73db7bf1") +
            values[WorkTimeApp.i18n.message("生肖")],
        ),
      );
      header.append(head, cycle);
      sheet.append(header);
      const grid = node("div", undefined, "almanac-guidance");
      for (const key of ["宜", "忌"]) {
        const column = node(
          "section",
          undefined,
          "almanac-column " + (key === "宜" ? "auspicious" : "avoid"),
        );
        column.setAttribute("aria-label", WorkTimeApp.i18n.message(key));
        const watermark = node("span", undefined, "almanac-watermark");
        watermark.append(
          node("span", WorkTimeApp.i18n.message(key), "almanac-watermark-text"),
        );
        watermark.setAttribute("aria-hidden", "true");
        const activities = node("p", undefined, "almanac-activities");
        for (const text of values[WorkTimeApp.i18n.message(key)].split("、"))
          activities.append(
            node(
              "span",
              text,
              text.length >= 4 ? "almanac-activity-wide" : undefined,
            ),
          );
        column.append(watermark, activities);
        grid.append(column);
      }
      const footer = node("div", undefined, "almanac-footer");
      footer.append(
        node(
          "p",
          WorkTimeApp.i18n.t("copy.e429a897c5") +
            values[WorkTimeApp.i18n.message("冲煞")],
          "almanac-clash",
        ),
      );
      const details = node("div", undefined, "almanac-details");
      for (const [label, value] of c.almanac.details || [])
        details.append(node("span", label + " " + value));
      footer.append(details);
      sheet.append(grid, footer);
      panel.append(sheet);
    } else if (c.sections) {
      for (const section of c.sections) {
        const block = node("section", undefined, "festival-section");
        block.setAttribute("aria-label", section.label);
        if (section.kind) block.classList.add("festival-" + section.kind);
        if (section.text) block.append(node("p", section.text));
        if (section.rows) {
          const dl = node("dl", undefined, "date-info-rows");
          for (const [label, value] of section.rows)
            dl.append(node("dt", label), node("dd", value));
          block.append(dl);
        }
        if (section.links) {
          const list = node("p", undefined, "festival-links");
          if (!section.links.length) list.textContent = section.empty;
          for (const item of section.links) {
            list.append(link(item.text, item.url));
          }
          block.append(list);
        }
        panel.append(block);
      }
    } else if (c.rows) {
      const dl = node("dl", undefined, "date-info-rows");
      for (const [label, value] of c.rows)
        dl.append(node("dt", label), node("dd", value));
      panel.append(dl);
    }
    if (c.events) {
      if (
        WorkTimeApp.i18n.config.history === "en" &&
        WorkTimeApp.i18n.language !== "en"
      ) {
        panel.prepend(
          node(
            "p",
            WorkTimeApp.i18n.t("history.languageNote"),
            "date-info-empty history-language-note",
          ),
        );
        for (const text of panel.querySelectorAll(".history-event p"))
          text.lang = "en";
      }
      const source = node(
        "p",
        WorkTimeApp.i18n.t("copy.a3b4f3262f"),
        "date-info-source",
      );
      source.append(
        link(
          WorkTimeApp.i18n.t(
            WorkTimeApp.i18n.config.history === "en"
              ? "history.english"
              : "history.chinese",
          ),
          c.sourceUrl,
        ),
        document.createTextNode(" · CC BY-SA 4.0"),
      );
      panel.append(source);
    } else if (c.source && !c.almanac)
      panel.append(
        c.sourceUrl
          ? link(c.source, c.sourceUrl)
          : node("p", c.source, "date-info-source"),
      );
    if (active === "festivals")
      panel.append(
        node(
          "p",
          WorkTimeApp.i18n.t("copy.2fcf9be743").replace(/^[\s|｜・]+/, ""),
          "date-info-source holiday-calendar-note",
        ),
      );
    panel.scrollTop = 0;
  }
  function updateWeatherTabIcon() {
    const use = document.querySelector("#date-tab-weather use");
    if (!use) return;
    const record = WorkTimeApp.services.weather?.snapshot().record;
    const beijingDate = (time) =>
      new Date(time + 8 * 3600000).toISOString().slice(0, 10);
    const today = beijingDate(Date.now());
    let code = record?.daily.find((row) => row.date === today)?.weatherCode;
    if (
      record &&
      Number.isFinite(Date.parse(record.validAt)) &&
      beijingDate(Date.parse(record.validAt)) === today
    )
      code = record.current.weatherCode ?? code;
    const symbols = {
      "clear-day": "sun",
      "partly-cloudy-day": "cloud-sun",
      cloudy: "cloud",
      rain: "weather-rain",
      snow: "weather-snow",
      fog: "weather-fog",
      thunderstorms: "weather-thunder",
    };
    const icon = symbols[WorkTimeApp.ui.weather?.iconFor(code)] || "cloud";
    use.setAttribute("href", "#icon-" + icon);
  }
  function refreshTabs() {
    if (disposed) return;
    const current = active;
    const providers = WorkTimeApp.services.dateInfo.list() || [
      {
        id: "notifications",
        label: WorkTimeApp.i18n.t("copy.7a66c0d036"),
        icon: "notifications",
      },
    ];
    // Games is a UI page, not a date-information provider.
    providers.push({ id: "games", label: WorkTimeApp.i18n.t("games.tab") });
    providers.push({ id: "tools", label: WorkTimeApp.i18n.t("tools.title") });
    const independentTabs = [
      "notifications",
      "countdown",
      "weather",
      "games",
      "tools",
    ];
    const tabOrder = (provider) => {
      const index = independentTabs.indexOf(provider.id);
      return index < 0 ? independentTabs.length : index;
    };
    providers.sort((a, b) => tabOrder(a) - tabOrder(b));
    let firstDateTab = true;
    const tabs = [];
    for (const p of providers) {
      if (p.id === "festivals" || p.id === "almanac") continue;
      const divider = firstDateTab && !independentTabs.includes(p.id);
      if (divider) firstDateTab = false;
      tabs.push({
        id: p.id,
        divider,
        label:
          p.id === "history"
            ? WorkTimeApp.i18n.t(
                WorkTimeApp.i18n.config.almanac
                  ? "copy.45eecb5cfb"
                  : "date.tabs",
              )
            : p.label,
        controls:
          {
            notifications: "editorInfo",
            tools: "toolsPanel",
            games: "gamesPanel",
          }[p.id] || "dateInfoPanel",
        icon:
          { history: "event-note", tools: "apps" }[p.id] ||
          icons[p.icon] ||
          icons.calendar,
      });
      if (p.id === "games")
        tabs.push({
          id: "music",
          label: WorkTimeApp.ui.musicText("title"),
          controls: "musicPanel",
          icon: "music",
        });
    }
    tabController = WorkTimeApp.ui.renderWorkspaceTabs(bar, tabs, (id) => {
      if (id === "music") {
        WorkTimeApp.ui.music.open();
        return;
      }
      active = id === "history" ? selectedDateView : id;
      rememberTab();
      render();
    });
    WorkTimeApp.ui.music.refresh();
    WorkTimeApp.ui.reader.refresh();
    WorkTimeApp.ui.typing.refresh();
    WorkTimeApp.ui.vocabulary.refresh();
    active =
      providers.some((p) => p.id === current) ||
      current === "music" ||
      current === "reader" ||
      current === "typing" ||
      current === "vocabulary"
        ? current
        : "notifications";
    if (date) render();
    updateNotificationBadge();
    updateWeatherTabIcon();
  }
  function onVisibility() {
    if (!document.hidden) updateWeatherTabIcon();
    if (active === "countdown" && !document.hidden) render();
    else synchronizeTimer();
  }
  function synchronizeDevelopment() {
    if (disposed) return;
    if (!isDevelopmentEnabled()) {
      WorkTimeApp.ui.reader.leaveDevelopment();
      const typingOpen =
        document.getElementById("typingDialog")?.hidden === false;
      if (typingOpen) WorkTimeApp.ui.typing?.close();
      if (typingOpen || developmentIds.includes(active)) showToolsPanel();
    }
    refreshTools();
  }
  function dispose() {
    if (disposed) return;
    stopFocusAnimation();
    exitCountdownFocus(false);
    disposed = true;
    directory.dispose();
    dateSelectScope?.abort();
    dateSelectView = null;
    events.dispose();
    WorkTimeApp.ui.renderWorkspaceTabs(bar, null);
    synchronizeTimer();
    badgeObserver.disconnect();
    unsubscribeWeather?.();
    unsubscribeWeather = null;
    WorkTimeApp.services.weather.setDemand("details", false);
  }
  function onWeather() {
    if (disposed) return;
    updateWeatherTabIcon();
    if (active === "weather") {
      const scroll = panel.scrollTop;
      const focusedId = panel.contains(document.activeElement)
        ? document.activeElement.id
        : "";
      render();
      panel.scrollTop = scroll;
      const focused = focusedId && document.getElementById(focusedId);
      if (focused && panel.contains(focused))
        focused.focus({ preventScroll: true });
    }
  }
  function mount() {
    if (!disposed) return;
    disposed = false;
    renderedView = null;
    syncDateSelect();
    dateSelectScope = new AbortController();
    dateSelectView = WorkTimeApp.ui.workspaceViews.createWorkspaceSelect({
      host: dateSwitch,
      select: dateViewSelect,
      label: dateViewLabel,
      signal: dateSelectScope.signal,
      prefix: "date-context-select",
    });
    events.listen(dateViewSelect, "change", () => {
      active = selectedDateView = dateViewSelect.value;
      rememberTab();
      render();
      panel.scrollTop = 0;
    });
    badgeObserver.observe(notices, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "hidden"],
    });
    events.listen(document, "visibilitychange", onVisibility);
    events.listen(document, "worktime:languagechange", refreshLanguage);
    events.listen(focusButton, "click", toggleCountdownFocus);
    events.listen(document, "keydown", onFocusKeydown, true);
    events.listen(document, "worktime:failed", dispose);
    events.listen(g, "pagehide", dispose);
    events.listen(g, "hashchange", synchronizeDevelopment);
    unsubscribeWeather = WorkTimeApp.services.weather.subscribe(onWeather);
    refreshTabs();
    synchronizeDevelopment();
  }
  function refreshLanguage() {
    // Refresh the alert baseline after every synchronous language listener has
    // translated its notices, including the following MutationObserver delivery.
    translatingAlerts = true;
    queueMicrotask(() => {
      if (disposed) return;
      updateNotificationBadge();
      translatingAlerts = false;
    });
    const hideAlmanac = !WorkTimeApp.i18n.config.almanac;
    bar.setAttribute("aria-label", WorkTimeApp.i18n.t("copy.b0f0d53b40"));
    if (hideAlmanac && active === "almanac")
      active = selectedDateView = defaultDateView;
    syncDateSelect();
    updateFocusButton();
    refreshTabs();
    rememberTab();
  }
  WorkTimeApp.ui.dateInfo = {
    isDevelopmentEnabled,
    showToolsPanel,
    rememberMedia(id) {
      if (!["music", "reader"].includes(id)) return;
      try {
        localStorage.setItem(tabStorageKey, id === "reader" ? "tools" : id);
      } catch {}
    },
    isActive: (id) => !disposed && active === id,
    showTypingPanel() {
      // Legacy callers use the Apps chooser; typing has only an expanded workspace.
      showToolsPanel();
    },
    showVocabularyPanel() {
      if (disposed) return;
      active = "vocabulary";
      rememberTab();
      render();
    },
    hideReaderPanel() {
      if (disposed || active !== "reader") return;
      showToolsPanel("reader");
    },
    showReaderPanel() {
      if (disposed || !isDevelopmentEnabled()) return;
      active = "reader";
      rememberTab();
      render();
      bar.closest(".editor").dispatchEvent(
        new CustomEvent("worktime:auxiliaryrequest", {
          detail: { id: "reader", open: true },
        }),
      );
    },
    showMusicPanel() {
      if (disposed) return;
      active = "music";
      rememberTab();
      render();
      bar.closest(".editor").dispatchEvent(
        new CustomEvent("worktime:auxiliaryrequest", {
          detail: { id: "music", open: true },
        }),
      );
    },
    selectTab(id) {
      const button = bar.querySelector('[data-tab="' + id + '"]');
      if (button && !disposed) button.click();
    },
    refreshLanguage,
    setDate(value) {
      date = value;
      // These panels use live application data rather than the selected date.
      if (
        renderedView === active &&
        [
          "weather",
          "countdown",
          "notifications",
          "games",
          "tools",
          "music",
          "reader",
          "typing",
          "vocabulary",
        ].includes(active)
      )
        return;
      render();
    },
    refreshTabs,
    mount,
    dispose,
  };
  mount();
  refreshLanguage();
  events.listen(
    document,
    "worktime:ready",
    () => {
      if (active === "music" || active === "reader")
        void WorkTimeApp.ui[active].open({ mini: true, restore: true });
    },
    { once: true },
  );
})(window);
