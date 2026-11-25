"use strict";
WorkTimeApp.ui.musicText = (key, n) =>
  key === "returnMain"
    ? WorkTimeApp.i18n.t("workspace.returnCalendar")
    : WorkTimeApp.i18n.t("media.music." + key, { n: n ?? "" });
