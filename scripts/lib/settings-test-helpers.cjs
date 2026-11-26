"use strict";
const { selectWorkspaceCommand } = require("./workspace-menu-test-helpers.cjs");
/** Exercise settings through the public entry and tabs, including return toggles. */
async function clickSettingsControl(page, selector) {
  const targets = {
    "#pageSettingsOpen": "#settingsGeneralTab",
    "#settingsWorkTab": "#settingsWorkTab",
    "#settingsPersonalTab": "#settingsPersonalTab",
  };
  const tab = targets[selector];
  if (!tab) return page.locator(selector).click();
  const open = await page.locator("#settingsPane").isVisible();
  if (
    open &&
    (await page.locator(tab).getAttribute("aria-selected")) === "true"
  ) {
    await selectWorkspaceCommand(page, "pageSettingsOpen");
    return;
  }
  if (!open) await selectWorkspaceCommand(page, "pageSettingsOpen");
  await page.locator(tab).click();
}
module.exports = { clickSettingsControl };
