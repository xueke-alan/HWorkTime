"use strict";
WorkTimeApp.ui.readerText = (key) =>
  key === "exit"
    ? WorkTimeApp.i18n.t("copy.11d0241540")
    : WorkTimeApp.i18n.t("media.reader." + key);
