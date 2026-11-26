"use strict";
/** Standalone and startup conversion use the same registry. */
const WorkBackupConversion = {
  convert(input) {
    return WorkTimeApp.services.archive.encode(
      WorkTimeApp.services.archive.migrate(input),
    );
  },
};
const converterModule = document.querySelector(
  'meta[name="converter-module"]',
)?.content;
if (converterModule && location.protocol !== "file:") {
  void import(new URL(converterModule, document.baseURI).href);
} else {
  void Promise.all([
    WorkTimeApp.services.assets.style("assets/js/ui/converter-file.min.css"),
    WorkTimeApp.services.assets.script("assets/js/ui/converter-file.min.js"),
  ]);
}
