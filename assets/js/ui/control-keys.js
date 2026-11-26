"use strict";
/** Apply the same control keyboard behavior to the page and reader frames. */
WorkTimeApp.ui.installControlKeys = function (root) {
  const controls =
    'button, summary, select, input:is([type="button"], [type="submit"], [type="reset"], [type="checkbox"], [type="radio"], [type="file"], [type="image"]), input[readonly][role="combobox"], [role="button"], [role="checkbox"], [role="radio"], [role="switch"], [role="tab"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="option"]';
  function preventActivation(event) {
    const modified = event.ctrlKey || event.metaKey || event.altKey;
    if (event.key === "Tab") {
      if (!modified) event.preventDefault();
      event.stopImmediatePropagation();
    } else if (
      event.key === " " &&
      !modified &&
      !event.isComposing &&
      event.target?.closest?.(controls) &&
      !event.target.isContentEditable
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }
  root.addEventListener("keydown", preventActivation, true);
  root.addEventListener("keyup", preventActivation, true);
};
WorkTimeApp.ui.installControlKeys(document);
