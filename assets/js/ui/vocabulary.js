"use strict";
WorkTimeApp.ui.vocabulary = (() => {
  const S = WorkTimeApp.services.vocabularyStorage;
  const E = WorkTimeApp.services.vocabularyEngine;
  const speech = WorkTimeApp.services.vocabularySpeech;
  const idle = WorkTimeApp.services.vocabularyIdle;
  const models = WorkTimeApp.services.vocabularyModels;
  const entries = WorkTimeApp.data.vocabularyCatalog.entries;
  const lookup = new Map(entries.map((e) => [e.id, e]));
  let data = S.read(),
    panel,
    session = null,
    current = null,
    busy = false,
    failed = null;
  let query = "",
    booksQuery = "",
    booksShown = 40,
    wordReturn = "book",
    shown = 40,
    disposed = false,
    draftTimer,
    inputDraft = null,
    renderCount = 0,
    viewedBook = null,
    viewedEntry = null,
    bookScroll = 0,
    revealAnimation = false,
    previousReview = null,
    correction = null,
    advanceTimer,
    miniMode = false,
    advancePending = false,
    savedScroll = 0;
  let pageView = null;
  let modelImportStatus = "";
  let audioReady = false,
    view = "home",
    notice = "saved",
    speechStatus = speech.status;
  const t = (key, values) => WorkTimeApp.i18n.t("vocabulary." + key, values);
  const host = document.getElementById("vocabularyPanel");
  const editor = host.closest(".editor");
  const content = node("div", undefined, "vocabulary-content");
  content.id = "vocabularyContent";
  const drawerViewport = node("div", undefined, "vocabulary-drawer-viewport");
  const drawerBody = node("div", undefined, "vocabulary-drawer-body");
  const pageSurface = node("div", undefined, "vocabulary-page-surface");
  const navigation = node("nav", undefined, "vocabulary-navigation");
  drawerBody.append(pageSurface, navigation);
  drawerViewport.append(drawerBody);
  content.append(drawerViewport);
  host.replaceChildren(content);
  const navView = WorkTimeApp.ui.mountVocabularyNavigation(navigation, (id) => {
    if (!busy && !failed) id === "learning" ? enterReview() : changePage(id);
  });
  const fullHost = host.parentElement;
  const mini = node("div", undefined, "vocabulary-mini vocabulary-content");
  mini.dataset.page = "study";
  mini.hidden = true;
  let miniView = null;
  host.append(mini);
  panel = content;
  const visible = () =>
    !miniMode &&
    !host.hidden &&
    !editor.classList.contains("is-settings-open") &&
    !editor.classList.contains("is-page-settings-open");
  let suspended = !visible();
  const animationCompat = WorkTimeApp.ui.animationCompat;
  const motionPreference = animationCompat.preference();
  let modeAnimations = [],
    modeSnapshots = [],
    movingSurface = null,
    movingStreak = null,
    movingDistance = 0;
  let modeStyles = [];
  function modeStyle(element, property, value) {
    if (
      !modeStyles.some(
        (item) => item.element === element && item.property === property,
      )
    )
      modeStyles.push({ element, property, value: element.style[property] });
    element.style[property] = value;
  }
  function stopModeAnimation() {
    modeAnimations.splice(0).forEach((animation) => animation.cancel());
    modeSnapshots.splice(0).forEach((snapshot) => snapshot.remove());
    modeStyles.splice(0).forEach(({ element, property, value }) => {
      element.style[property] = value;
    });
    movingSurface = null;
    movingStreak = null;
    movingDistance = 0;
    if (editor.classList.contains("is-vocabulary-drawer-moving"))
      editor.classList.remove("is-vocabulary-drawer-moving");
  }
  function drawerSnapshot(source, bounds = source?.getBoundingClientRect()) {
    if (!source || !bounds) return null;
    const frame = node(
      "div",
      undefined,
      "vocabulary-content vocabulary-drawer-snapshot",
    );
    frame.dataset.page = content.dataset.page;
    frame.inert = true;
    frame.setAttribute("aria-hidden", "true");
    const origin = editor.getBoundingClientRect();
    Object.assign(frame.style, {
      top: bounds.top - origin.top - editor.clientTop + editor.scrollTop + "px",
      left:
        bounds.left -
        origin.left -
        editor.clientLeft +
        editor.scrollLeft +
        "px",
      width: bounds.width + "px",
      height: bounds.height + "px",
    });
    const copy = source.cloneNode(true);
    for (const element of [copy, ...copy.querySelectorAll("*")]) {
      element.removeAttribute("id");
      element.removeAttribute("autofocus");
      // Cloning a revealed answer must not restart its CSS entrance animation
      // underneath the drawer's outgoing meaning fade.
      element.classList.remove("vocabulary-revealing");
    }
    Object.assign(copy.style, {
      width: "100%",
      height: "100%",
      flex: "none",
      margin: "0",
    });
    if (source !== drawerBody) {
      copy.style.background = "transparent";
      copy.style.border = "0";
    }
    frame.append(copy);
    editor.append(frame);
    const originals = [source, ...source.querySelectorAll("*")];
    [copy, ...copy.querySelectorAll("*")].forEach((element, index) => {
      element.scrollTop = originals[index].scrollTop;
      element.scrollLeft = originals[index].scrollLeft;
      if (element.matches(".vocabulary-meaning")) {
        const painted = getComputedStyle(originals[index]);
        element.style.opacity = painted.opacity;
        element.style.transform = painted.transform;
      }
    });
    modeSnapshots.push(frame);
    return copy;
  }
  const unlistenMotion = animationCompat.listen(motionPreference, () => {
    if (motionPreference.matches) stopModeAnimation();
  });
  function stopHiddenAnimation() {
    if (document.hidden) stopModeAnimation();
  }
  document.addEventListener("visibilitychange", stopHiddenAnimation);
  window.addEventListener("resize", stopModeAnimation);
  function node(tag, text, className) {
    const el = WorkTimeApp.ui.native.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  function button(text, fn, className = "ui-button") {
    const el = node("button", text, className);
    if (className.includes("vocabulary-primary")) el.classList.add("primary");
    el.type = "button";
    el.disabled = busy || !!failed;
    el.onclick = fn;
    return el;
  }
  async function persist(candidate, after, rerender = true) {
    if (busy) return false;
    clearTimeout(draftTimer);
    busy = true;
    const previousRender = renderCount;
    if (rerender) render();
    try {
      const result = await S.save(candidate);
      if (!result?.persisted) throw Error("Save not persisted");
      data = candidate;
      failed = null;
      notice = "saved";
      after?.();
      return true;
    } catch {
      if (candidate.draft && candidate.draft.id === current?.id)
        data.draft = structuredClone(candidate.draft);
      failed = { candidate, after };
      notice = "saveFailed";
      return false;
    } finally {
      busy = false;
      if (rerender || failed || renderCount !== previousRender) render();
    }
  }
  function updateSettings(key, value, after) {
    speech.stop();
    const next = structuredClone(data);
    if (key === "accent" && inputDraft && inputDraft.id === next.draft?.id)
      next.draft.answer = inputDraft.answer;
    inputDraft = null;
    next.settings[key] = value;
    if (key === "wordOrder" && value === "random")
      next.settings.orderSeed = crypto.getRandomValues(new Uint32Array(1))[0];
    if (!["accent", "autoRead"].includes(key)) next.draft = null;
    const settingsPanel =
      view === "preferences" ||
      (["wordOrder", "mode"].includes(key) && view === "books")
        ? panel
        : null;
    const focused = settingsPanel?.contains(document.activeElement)
      ? document.activeElement
      : null;
    if (settingsPanel) settingsPanel.inert = true;
    return persist(
      next,
      () => {
        if (!["accent", "autoRead"].includes(key)) {
          session = null;
          current = null;
          previousReview = correction = null;
        }
        audioReady = false;

        after?.();
      },
      !settingsPanel,
    ).finally(() => {
      if (settingsPanel) settingsPanel.inert = false;
      if (
        !failed &&
        focused?.isConnected &&
        document.activeElement === document.body
      )
        focused.focus({ preventScroll: true });
      if (
        key === "mode" &&
        settingsPanel?.isConnected &&
        !failed &&
        document.activeElement === document.body
      )
        settingsPanel
          .querySelector('[data-setting-field="mode"] [role="combobox"]')
          ?.focus({ preventScroll: true });
    });
  }
  function phoneticText(entry) {
    const accent = data.settings.accent;
    const ipa =
      entry.phonetics?.[accent] ||
      entry.pronunciationVariants?.[accent]?.[0]?.ipa;
    return ipa ? "/" + ipa + "/" : "";
  }

  function refreshStatus() {
    const status = panel?.querySelector(".vocabulary-speech-status");
    if (status) {
      status.textContent = t(speechStatus);
      status.hidden =
        view === "preferences" ||
        ["idle", "ready", "loading", "generating"].includes(speechStatus);
    }
  }
  const unsubscribe = speech.subscribe(() => {
    speechStatus = speech.status;
    refreshStatus();
  });
  function refreshPreferences() {
    if (pageView && view === "preferences") preferences();
  }
  const unsubscribeCache = idle.subscribe(refreshPreferences);
  const unsubscribeModels = models.subscribe(refreshPreferences);
  const unsubscribeStorage = S.subscribe((changes, reset) => {
    if (!reset || disposed) return;
    speech.stop();
    clearTimeout(draftTimer);
    data = S.read();
    current = null;
    session = null;
    previousReview = correction = null;
    clearTimeout(advanceTimer);
    view = "home";
    failed = null;
    render();
  });
  async function play(entry = current, miniPlayback = false, onSynthesis) {
    if (
      !entry ||
      (miniPlayback
        ? !miniMode ||
          host.hidden ||
          editor.classList.contains("is-settings-open") ||
          editor.classList.contains("is-page-settings-open")
        : !visible())
    )
      return;
    const id = current?.id,
      mode = data.settings.mode;
    try {
      const played = await speech.play(
        entry,
        data.settings.accent,
        onSynthesis,
      );
      if (
        played &&
        !miniPlayback &&
        view === "study" &&
        current?.id === id &&
        mode === "dictation" &&
        entry.id === id
      ) {
        audioReady = true;
        if (!disposed && visible() && !data.draft?.revealed) {
          render();
          content.querySelector(".vocabulary-answer")?.focus();
        }
      }
    } catch {
      /* Speech status exposes a retryable failure; no online fallback. */
    }
  }
  function start() {
    if (busy || failed) return;
    panel.scrollTop = 0;
    speech.stop();
    previousReview = correction = null;
    const items = E.queue(data, entries).items;
    if (
      data.draft &&
      data.draft.mode === data.settings.mode &&
      items.some((entry) => entry.id === data.draft.id)
    ) {
      const entry = lookup.get(data.draft.id);
      session = [entry, ...items.filter((e) => e.id !== entry.id)];
    } else session = items;
    view = "study";
    nextCard();
  }
  function nextCard() {
    if (miniMode) {
      advancePending = true;
      return;
    }
    advancePending = false;
    panel.scrollTop = 0;
    if (session && !correction) {
      session = E.queue(data, entries).items;
      if (data.draft?.mode === data.settings.mode) {
        const index = session.findIndex((entry) => entry.id === data.draft.id);
        if (index > 0) session.unshift(...session.splice(index, 1));
      }
    }
    current = session?.[0] || null;
    audioReady = false;
    if (current) {
      const next = structuredClone(data);
      if (!next.draft || next.draft.id !== current.id)
        next.draft = {
          id: current.id,
          mode: data.settings.mode,
          answer: "",
          revealed: false,
          correct: null,
        };
      void persist(next, () => {
        if (!visible() || view !== "study") return;
        if (data.settings.mode === "dictation") void play();
      });
    } else {
      view = "home";
      render();
    }
  }
  function reveal() {
    if (busy || failed || !current || data.draft?.revealed) return;
    const next = structuredClone(data);
    const answer =
      content.querySelector(".vocabulary-answer")?.value ?? next.draft.answer;
    inputDraft = null;
    next.draft = {
      ...next.draft,
      answer,
      revealed: true,
      correct:
        data.settings.mode === "recall" ? null : E.correct(current, answer),
    };
    void persist(next, () => {
      revealAnimation = true;
      if (data.settings.autoRead !== false) void play();
    });
  }
  function grade(value) {
    if (busy || failed || !current || !data.draft?.revealed) return;
    if (data.draft.correct === false) value = 1;
    try {
      const entry = current;
      const mode = data.settings.mode;
      const key = E.key(entry.id, mode);
      const before = {
        entry,
        mode,
        key,
        card: structuredClone(data.cards[key]),
        reinforcement: structuredClone(data.reinforcement),
        draft: structuredClone(data.draft),
        session: [...session],
        grade: value,
      };
      const next = E.review(data, entry, mode, value);
      const correcting = correction?.id === entry.id;
      if (correcting && correction.resumeDraft)
        next.draft = correction.resumeDraft;
      before.log = structuredClone(next.logs.at(-1));
      void persist(next, () => {
        speech.stop();
        previousReview = before;
        correction = null;
        session.shift();
        advanceTimer = setTimeout(nextCard, 0);
      });
    } catch {
      notice = "saveFailed";
      render();
    }
  }
  function undoReview() {
    if (busy || failed || !previousReview || correction) return;
    const previous = previousReview;
    if (
      previous.mode !== data.settings.mode ||
      JSON.stringify(data.logs.at(-1)) !== JSON.stringify(previous.log)
    )
      return;
    const next = structuredClone(data);
    if (previous.card === undefined) delete next.cards[previous.key];
    else next.cards[previous.key] = structuredClone(previous.card);
    next.logs.pop();
    if (previous.reinforcement === undefined) delete next.reinforcement;
    else next.reinforcement = structuredClone(previous.reinforcement);
    const resumeDraft =
      next.draft?.id !== previous.entry.id ? next.draft : null;
    next.draft = structuredClone(previous.draft);
    inputDraft = null;
    void persist(next, () => {
      clearTimeout(advanceTimer);
      speech.stop();
      previousReview = null;
      correction = {
        id: previous.entry.id,
        grade: previous.grade,
        resumeDraft,
      };
      session = [...previous.session];
      current = previous.entry;
      audioReady = true;
      view = "study";
      panel.scrollTop = 0;
    });
  }
  function keyboard(event) {
    if (
      disposed ||
      !visible() ||
      event.defaultPrevented ||
      event.isComposing ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      document.querySelector("dialog[open], .workspace.is-game-expanded") ||
      !["study", "home"].includes(view)
    )
      return;
    const target = event.target;
    if (
      target instanceof Element &&
      (target.closest(
        'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]',
      ) ||
        (target !== document.body &&
          target !== document.documentElement &&
          !content.contains(target)))
    )
      return;
    const recognized = [
      "ArrowLeft",
      "ArrowDown",
      "ArrowRight",
      "ArrowUp",
    ].includes(event.key);
    if (
      !recognized ||
      (view !== "study" && !(event.key === "ArrowUp" && previousReview))
    )
      return;
    event.preventDefault();
    if (event.repeat || busy || failed) return;
    if (event.key === "ArrowUp") {
      undoReview();
      return;
    }
    const rating = { ArrowLeft: 3, ArrowDown: 2, ArrowRight: 1 }[event.key];
    const choice = content.querySelector(`[data-grade="${rating}"]`);
    if (choice && !choice.disabled) choice.click();
  }
  document.addEventListener("keydown", keyboard);
  function home() {
    const stats = E.statistics(data);
    pageView.home(stats.streak, {
      newLearned: stats.newLearned,
      reviewCount: stats.reviewCount,
      today: stats.today,
      pendingPractice: E.queue(data, entries).practice.length,
    });
  }
  function bookSummary(book) {
    const words = entries.filter((e) => e.books.includes(book)),
      known = new Set(data.logs.map((l) => l.id));
    return words.filter((e) => known.has(e.id)).length + " / " + words.length;
  }
  function books() {
    const global = view === "books";
    const book = global ? null : viewedBook || data.settings.book;
    panel.classList.toggle("vocabulary-book-selection", global);
    const queue = E.queue(data, entries);
    const days = E.estimateLearningDays(data, entries);
    pageView.books({
      book,
      current: data.settings.book,
      entries,
      disabled: busy || !!failed,
      initialQuery: global ? booksQuery : query,
      initialLimit: global ? booksShown : shown,
      summaries: Object.fromEntries(
        ["daily", "cet6", "kaoyan", "toefl", "ielts"].map((id) => [
          id,
          bookSummary(id),
        ]),
      ),
      distribution: E.bookDistribution(data, entries),
      counts: {
        pendingReviewShort: queue.due.length + " / " + queue.allDue,
        pendingNew: String(queue.fresh.length),
        pendingPractice: String(queue.practice.length),
      },
      estimate: days ? t("estimatedDays", { days }) : t("estimateComplete"),
      dailyTotal: data.settings.dailyTotal,
      mode: data.settings.mode,
      random: data.settings.wordOrder === "random",
      update: (key, value) =>
        updateSettings(key, value).finally(() => {
          if (!disposed && pageView && view === "books") {
            books();
            navView.update(
              "books",
              new Set(E.queue(data, entries).items.map((item) => item.id)).size,
            );
          }
        }),
      remember: (text, limit) => {
        if (global) {
          booksQuery = text;
          booksShown = limit;
        } else {
          query = text;
          shown = limit;
        }
      },
      phonetic: phoneticText,
      play: (entry, synthesis) => play(entry, false, synthesis),
      openWord: (entry, scroll) => {
        if (busy || failed) return;
        bookScroll = scroll;
        wordReturn = global ? "books" : "book";
        viewedEntry = entry;
        changePage("word");
        content
          .querySelector(".vocabulary-word-back")
          ?.focus({ preventScroll: true });
      },
      openBook: (id) => {
        viewedBook = id;
        query = "";
        shown = 40;
        changePage("book");
      },
      back: () => changePage("books"),
      useBook: (id) => {
        if (id === data.settings.book) enterReview();
        else
          updateSettings("book", id, () => {
            view = "home";
          });
      },
    });
  }
  function analysis() {
    const stats = E.statistics(data);
    const report = E.analysis(data);
    pageView.analysis(
      {
        learned: stats.learned,
        totalReviews: report.total,
        streak: stats.streak,
      },
      report,
    );
  }
  async function installModel(file) {
    if (modelImportStatus === "models_importing") return;
    modelImportStatus = "models_importing";
    refreshPreferences();
    try {
      await models.install(file);
      modelImportStatus = "models_installed";
    } catch {
      modelImportStatus = "models_failed";
    } finally {
      refreshPreferences();
    }
  }
  function preferences() {
    panel.classList.add("vocabulary-preferences");
    pageView.preferences({
      disabled: busy || !!failed,
      accent: data.settings.accent,
      autoRead: data.settings.autoRead !== false,
      autoCache: idle.settings.enabled && !idle.settings.paused,
      limit: idle.settings.limit,
      limits: idle.limits,
      poolSize: idle.settings.poolSize,
      poolSizes: idle.poolSizes,
      modelStatus: modelImportStatus,
      importing:
        modelImportStatus === "models_importing" ||
        ["downloading", "importing"].includes(models.state.phase),
      setAccent: (value) =>
        updateSettings("accent", value).finally(refreshPreferences),
      setAutoRead: (value) =>
        updateSettings("autoRead", value).finally(refreshPreferences),
      setAutoCache: (enabled) => idle.configure({ enabled, paused: false }),
      setPool: (poolSize) => idle.configure({ poolSize }),
      setLimit: (limit) => idle.configure({ limit }),
      clear: async () => {
        try {
          await speech.clear();
        } catch {
          speechStatus = "cacheWarning";
          refreshStatus();
        }
      },
      install: installModel,
    });
  }
  function enterReview() {
    if (busy || failed) return;
    if (session && !correction) {
      session = E.queue(data, entries).items;
    }
    if (session === null || session.length === 0) {
      start();
      return;
    }
    changePage("study");
  }
  function changePage(next) {
    flushInput();
    speech.stop();
    panel.scrollTop = 0;
    view = next;
    render();
  }
  function headerProps(entry, miniPlayback, detail) {
    return {
      word: entry.word,
      mode: detail ? "recall" : data.settings.mode,
      revealed: detail || !!data.draft?.revealed,
      disabled: busy || !!failed,
      accent: data.settings.accent,
      phonetic: phoneticText(entry),
      play: (synthesis) => play(entry, miniPlayback, synthesis),
    };
  }
  function study(detail = false) {
    const entry = detail ? viewedEntry : current;
    if (!entry) {
      pageView.complete();
      return;
    }
    const header = headerProps(entry, false, detail);
    const draft = detail
      ? { answer: "", correct: null }
      : data.draft || { answer: "", correct: null };
    const headerHost = node("div", undefined, "vocabulary-study-header");
    pageSurface.insertBefore(headerHost, panel);
    const recall = !header.revealed && header.mode === "recall";
    const actionsHost =
      detail || recall
        ? undefined
        : node("div", undefined, "vocabulary-study-actions");
    if (actionsHost) pageSurface.append(actionsHost);
    if (recall) {
      panel.classList.add("vocabulary-recall");
      panel.dataset.action = "reveal";
      panel.tabIndex = 0;
      panel.setAttribute("aria-label", t("tapReveal"));
      panel.onclick = headerHost.onclick = (event) => {
        if (
          !event.target.closest("button,input,a,select,textarea,label") &&
          !window.getSelection()?.toString()
        )
          reveal();
      };
      panel.onkeydown = (event) => {
        if (event.target === panel && event.key === "Enter") {
          event.preventDefault();
          reveal();
        }
      };
    }
    const ratings = [];
    if (header.revealed && !detail) {
      const now = Date.now(),
        today = Date.parse(E.day(now));
      for (const [label, value, shortcut] of [
        ["recognized", 3, "ArrowLeft"],
        ["uncertain", 2, "ArrowDown"],
        ["forgotten", 1, "ArrowRight"],
      ]) {
        const result = E.preview(data, entry, header.mode, value, now);
        ratings.push({
          label,
          value,
          shortcut,
          previous:
            correction?.id === entry.id
              ? correction.grade === value
              : undefined,
          delay: result.gap
            ? t("reviewToday")
            : t("reviewDays", {
                n: Math.max(
                  1,
                  (Date.parse(E.day(result.card.due)) - today) / 86400000,
                ),
              }),
        });
      }
    }
    pageView.study({
      header,
      headerHost,
      actionsHost,
      meaning: entry.zh,
      draft,
      initialAnswer:
        inputDraft?.id === entry.id ? inputDraft.answer : draft.answer,
      audioReady,
      ratings,
      early:
        !detail &&
        data.reinforcement?.[E.key(entry.id, header.mode)] &&
        E.queue(data, entries).early,
      details: header.revealed
        ? {
            entry,
            disabled: header.disabled,
            speak: (word, synthesis) =>
              play({ word, kind: "example" }, false, synthesis),
          }
        : undefined,
      history: detail ? memoryHistory(entry) : undefined,
      back: detail
        ? () => {
            changePage(wordReturn);
            (wordReturn === "books"
              ? panel
              : panel.querySelector(".vocabulary-list")
            ).scrollTop = bookScroll;
            [...panel.querySelectorAll(".vocabulary-word-open")]
              .find((button) => button.dataset.word === entry.id)
              ?.focus({ preventScroll: true });
          }
        : undefined,
      input: (answer) => {
        inputDraft = { id: entry.id, answer };
        clearTimeout(draftTimer);
        draftTimer = setTimeout(flushInput, 500);
      },
      reveal,
      grade,
    });
    if (!detail && header.revealed && revealAnimation) {
      headerHost.classList.add("vocabulary-revealing");
      panel.classList.add("vocabulary-revealing");
      revealAnimation = false;
    }
  }
  function memoryHistory(entry) {
    const logs = data.logs
      .filter((log) => log.id === entry.id)
      .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    const date = new Intl.DateTimeFormat(WorkTimeApp.i18n.language, {
      dateStyle: "medium",
    });
    const calendarDay = (at) => Date.parse(E.day(at));
    const daysBetween = (later, earlier) =>
      (calendarDay(later) - calendarDay(earlier)) / 86400000;
    const dateTitle = (at) => date.format(new Date(at));
    const first = logs[0]?.at;
    let summary = "";
    if (first) {
      const last = logs.at(-1).at;
      const range =
        E.day(first) === E.day(last)
          ? dateTitle(first)
          : dateTitle(first) + " → " + dateTitle(last);
      summary = t("memoryHistorySummary", { range, n: logs.length });
    }
    const upcoming = [];
    const now = Date.now();
    for (const mode of ["recall", "spelling", "dictation"]) {
      const key = E.key(entry.id, mode);
      const due = data.cards[key]?.due;
      const pending = data.reinforcement?.[key];
      if (!due && !pending) continue;
      let status = t("pendingPractice");
      let overdue = false;
      if (!pending) {
        const days = daysBetween(due, now);
        overdue = days < 0;
        status = overdue
          ? t("memoryHistoryOverdue", { n: -days })
          : days === 0
            ? t("memoryHistoryDueToday")
            : t("memoryHistoryNext", { date: date.format(new Date(due)) });
      }
      upcoming.push({ mode, status, overdue });
    }
    return {
      logs,
      summary,
      due: upcoming,
      dateTitle,
      dayNumber: (at) => daysBetween(at, first) + 1,
    };
  }
  function render() {
    if (miniMode) {
      renderMini();
      return;
    }
    if (disposed || !panel || !visible() || !data) return;
    if (view === "word" && !viewedEntry) view = "book";
    if (view === "home" && session === null && !busy && !failed) {
      start();
      return;
    }
    const scroll = (panel.querySelector(".vocabulary-list") || panel).scrollTop;
    const previousPage = navigation.querySelector('[aria-current="page"]')
      ?.dataset.page;
    WorkTimeApp.ui.motion?.stopWithin(pageSurface);
    pageView?.dispose();
    pageView = null;
    renderCount++;
    pageSurface.replaceChildren();
    content.dataset.page = view;
    const activePage = ["home", "study"].includes(view)
      ? "learning"
      : ["books", "book", "word"].includes(view)
        ? "books"
        : view;
    panel = node("div", undefined, "vocabulary-page");
    panel.id = "vocabularyPage";
    pageSurface.append(panel);
    {
      const host = node("div", undefined, "vocabulary-react-content");
      panel.append(host);
      pageView = WorkTimeApp.ui.mountVocabularyPage(host);
    }
    if (view === "study") study();
    else if (view === "book" || view === "books") books();
    else if (view === "word") study(true);
    else if (view === "analysis") analysis();
    else if (view === "preferences") preferences();
    else home();
    const status = node("p", t(speechStatus), "vocabulary-speech-status");
    status.setAttribute("role", "status");
    status.hidden =
      view === "preferences" ||
      ["idle", "ready", "loading", "generating"].includes(speechStatus);
    panel.append(status);
    const saved = node("p", t(notice), "vocabulary-save-status");
    saved.setAttribute("role", "status");
    saved.hidden = !failed;
    panel.append(saved);
    if (failed) {
      const retry = button(t("retry"), () => {
        const job = failed;
        failed = null;
        void persist(job.candidate, job.after);
      });
      retry.disabled = busy;
      panel.append(retry);
    }
    navigation.setAttribute("aria-label", t("title"));
    const planned = new Set(
      E.queue(data, entries).items.map((entry) => entry.id),
    );
    navView.update(activePage, planned.size);
    (panel.querySelector(".vocabulary-list") || panel).scrollTop = scroll;
    if (previousPage && previousPage !== activePage)
      WorkTimeApp.ui.motion?.play(pageSurface);
  }
  function flushInput() {
    clearTimeout(draftTimer);
    if (!inputDraft || disposed || failed) return;
    if (busy) {
      draftTimer = setTimeout(flushInput, 50);
      return;
    }
    const pending = inputDraft;
    inputDraft = null;
    if (
      !data.draft ||
      data.draft.id !== pending.id ||
      data.draft.revealed ||
      data.draft.answer === pending.answer
    )
      return;
    const next = structuredClone(data);
    next.draft.answer = pending.answer;
    void persist(next, null, false);
  }
  function synchronizeVisibility() {
    if (
      host.hidden ||
      (!miniMode &&
        (editor.classList.contains("is-settings-open") ||
          editor.classList.contains("is-page-settings-open")))
    )
      stopModeAnimation();
    const next = !visible();
    if (next && !suspended) {
      WorkTimeApp.ui.motion?.stop(pageSurface);
      pageView?.dispose();
      pageView = null;
      speech.stop();
      flushInput();
    }
    if (!next && suspended) render();
    suspended = next;
  }
  const observer = new MutationObserver(synchronizeVisibility);
  observer.observe(host, { attributes: true, attributeFilter: ["hidden"] });
  observer.observe(editor, { attributes: true, attributeFilter: ["class"] });
  function renderMini() {
    const entry = current || lookup.get(data.draft?.id);
    miniView ??= WorkTimeApp.ui.mountVocabularyPage(mini);
    miniView.mini({
      header: entry ? headerProps(entry, true, false) : null,
      streak: entry ? 0 : E.statistics(data).streak,
      expand: () => setMini(false),
    });
  }
  function setMini(value) {
    if (disposed) return;
    const changed = miniMode !== value;
    if (changed) WorkTimeApp.ui.motion?.stop(pageSurface);
    const animate =
      changed && !host.hidden && !document.hidden && !motionPreference.matches;
    let progress = miniMode ? 1 : 0;
    if (movingSurface) {
      const transform = getComputedStyle(movingSurface).transform;
      const height = movingDistance;
      if (height && transform !== "none")
        progress = Math.max(
          0,
          Math.min(1, new DOMMatrixReadOnly(transform).m42 / height),
        );
    }
    const beforeBody = drawerViewport.getBoundingClientRect();
    const source = miniMode ? mini : drawerBody;
    const sourceAnchor = source.querySelector(".vocabulary-word-header");
    const sourceStreak =
      animate && (movingStreak || source.querySelector(".vocabulary-hero"));
    const streakBounds = sourceStreak && sourceStreak.getBoundingClientRect();
    let sourceTop = sourceAnchor?.getBoundingClientRect().top;
    if (sourceTop !== undefined && !miniMode && movingSurface === drawerBody) {
      const transform = getComputedStyle(drawerBody).transform;
      if (transform !== "none")
        sourceTop -= new DOMMatrixReadOnly(transform).m42;
    }
    if (changed) stopModeAnimation();
    const outgoingBody =
      animate && value
        ? drawerSnapshot(drawerBody, drawerViewport.getBoundingClientRect())
        : null;
    if (value && changed) savedScroll = panel.scrollTop;
    if (!value && changed) {
      if (view !== "study") savedScroll = 0;
      view = current ? "study" : "home";
    }
    miniMode = value;
    content.hidden = value;
    content.inert = value;
    mini.hidden = !value;
    if (!value) {
      miniView?.dispose();
      miniView = null;
    }
    host.classList.toggle("is-mini", value);
    (value ? editor.querySelector(".date-info-area") : fullHost).append(host);
    if (value) renderMini();
    WorkTimeApp.ui.dateInfo.showVocabularyPanel();
    synchronizeVisibility();
    if (!value && advancePending) nextCard();
    if (!value && changed) {
      panel.scrollTop = savedScroll;
      if (!panel.hasAttribute("tabindex")) panel.tabIndex = -1;
      panel.focus({ preventScroll: true });
    }
    if (animate) {
      editor.classList.add("is-vocabulary-drawer-moving");
      const surface = outgoingBody || drawerBody;
      movingSurface = surface;
      const destination = value ? mini : drawerBody;
      const targetAnchor = destination.querySelector(".vocabulary-word-header");
      const targetStreak = destination.querySelector(".vocabulary-hero");
      const targetStreakBounds = targetStreak?.getBoundingClientRect();
      const targetTop = targetAnchor?.getBoundingClientRect().top;
      const distance = Math.max(
        0,
        value
          ? (targetTop ?? beforeBody.bottom) - (sourceTop ?? beforeBody.top)
          : (sourceTop ?? beforeBody.bottom) - (targetTop ?? beforeBody.top),
      );
      movingDistance = distance;
      if (outgoingBody && targetAnchor) {
        // Keep the clipping frame large enough for the destination on narrow
        // layouts, without stretching the captured drawer's contents.
        const frame = outgoingBody.parentElement;
        const bounds = frame.getBoundingClientRect();
        outgoingBody.style.height = outgoingBody.offsetHeight + "px";
        frame.style.height =
          Math.max(
            bounds.height,
            targetAnchor.getBoundingClientRect().bottom - bounds.top,
          ) + "px";
      }
      const duration = Math.max(
        100,
        (value ? 280 : 340) * Math.abs((value ? 1 : 0) - progress),
      );
      modeStyle(surface, "transform", `translateY(${value ? distance : 0}px)`);
      const tracks = [
        animationCompat.animate(
          surface,
          [
            { transform: `translateY(${progress * distance}px)` },
            { transform: `translateY(${value ? distance : 0}px)` },
          ],
          { duration, easing: "cubic-bezier(.22,.8,.25,1)" },
        ),
      ];
      if (streakBounds && targetStreakBounds) {
        movingStreak = drawerSnapshot(sourceStreak, streakBounds);
        movingStreak.style.boxSizing = "border-box";
        const outgoingStreak = outgoingBody?.querySelector(".vocabulary-hero");
        if (outgoingStreak) outgoingStreak.style.opacity = "0";
        modeStyle(targetStreak, "opacity", "0");
        const x =
          targetStreakBounds.left -
          streakBounds.left +
          (targetStreakBounds.width - streakBounds.width) / 2;
        const y =
          targetStreakBounds.top -
          streakBounds.top +
          (targetStreakBounds.height - streakBounds.height) / 2;
        tracks.push(
          animationCompat.animate(
            movingStreak.parentElement,
            [
              { transform: "translate(0px, 0px)" },
              { transform: `translate(${x}px, ${y}px)` },
            ],
            { duration, easing: "cubic-bezier(.22,.8,.25,1)" },
          ),
        );
      }
      if (value) {
        for (const meaning of surface.querySelectorAll(".vocabulary-meaning")) {
          const opacity = getComputedStyle(meaning).opacity;
          modeStyle(meaning, "opacity", "0");
          tracks.push(
            animationCompat.animate(meaning, [{ opacity }, { opacity: 0 }], {
              duration: Math.min(duration, 180),
              easing: "ease-out",
            }),
          );
        }
      }
      const wordHeader = surface.querySelector(".vocabulary-word-header");
      if (wordHeader) {
        const border = getComputedStyle(wordHeader).borderBottomColor;
        modeStyle(
          wordHeader,
          "borderBottomColor",
          value ? "transparent" : border,
        );
        tracks.push(
          animationCompat.animate(
            wordHeader,
            [
              { borderBottomColor: value ? border : "transparent" },
              { borderBottomColor: value ? "transparent" : border },
            ],
            { duration, easing: "ease-out" },
          ),
        );
      }
      if (value) {
        if (!sourceAnchor) {
          modeStyle(surface, "opacity", "0");
          tracks.push(
            animationCompat.animate(surface, [{ opacity: 1 }, { opacity: 0 }], {
              duration,
              easing: "ease-out",
            }),
          );
        }
        for (const background of [
          ...editor.querySelectorAll(".editor-content, #agendaEditor"),
        ].flatMap(WorkTimeApp.ui.motion.editorContent)) {
          if (getComputedStyle(background).display === "none") continue;
          modeStyle(background, "opacity", "1");
          tracks.push(
            animationCompat.animate(
              background,
              [{ opacity: 0 }, { opacity: 1 }],
              { duration, easing: "ease-out" },
            ),
          );
        }
      }
      modeAnimations = tracks;
      void Promise.all(tracks.map((track) => track.finished)).then(() => {
        if (modeAnimations === tracks) stopModeAnimation();
      });
    }
    WorkTimeApp.ui.motion.refreshEditorTitle();
  }
  function collapseOnClick(event) {
    if (
      !miniMode &&
      visible() &&
      event.target instanceof Element &&
      event.target.closest("#pageSettingsOpen")
    ) {
      setMini(true);
      return;
    }
    if (
      miniMode ||
      !visible() ||
      !(event.target instanceof Element) ||
      !event.target.closest(".workspace > .work-main")
    )
      return;
    setMini(true);
  }
  document.addEventListener("click", collapseOnClick, true);
  return {
    get isMini() {
      return miniMode;
    },
    open(options = {}) {
      if (disposed) return;
      if (!options.fromSettings) void models.prepare().catch(() => {});
      setMini(false);
    },
    refresh() {
      synchronizeVisibility();
      render();
    },
    hasDraft() {
      return !!data?.draft;
    },
    dispose() {
      disposed = true;
      WorkTimeApp.ui.motion?.stop(pageSurface);
      WorkTimeApp.ui.motion?.stopWithin(pageSurface);
      stopModeAnimation();
      unlistenMotion();
      document.removeEventListener("visibilitychange", stopHiddenAnimation);
      window.removeEventListener("resize", stopModeAnimation);
      clearTimeout(draftTimer);
      clearTimeout(advanceTimer);
      document.removeEventListener("keydown", keyboard);
      document.removeEventListener("click", collapseOnClick, true);
      observer.disconnect();
      unsubscribe();
      unsubscribeStorage();
      unsubscribeCache();
      unsubscribeModels();
      speech.dispose();
      pageView?.dispose();
      pageView = null;
      navView.dispose();
      content.remove();
      miniView?.dispose();
      mini.remove();
    },
  };
})();
