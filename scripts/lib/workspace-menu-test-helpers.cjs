"use strict";
async function selectWorkspaceCommand(page, id) {
  if (["analysis", "calendar", "agenda"].includes(id)) {
    await page.locator('.workspace-views [data-view="' + id + '"]').click();
    return;
  }
  await page.locator("#" + id).click();
}
async function cycleAgendaView(page) {
  const display = page.locator("#agendaViewToggle");
  const current = await display
    .locator("label:has(input:checked) [data-agenda-weeks]")
    .getAttribute("data-agenda-weeks");
  await display
    .locator(`[data-agenda-weeks="${(Number(current) + 1) % 4}"]`)
    .click();
}
async function toggleAgenda(page) {
  const agenda = page.locator('.workspace-views [data-view="agenda"]');
  const selected = await agenda
    .locator("xpath=ancestor::label")
    .getByRole("radio")
    .isChecked();
  await selectWorkspaceCommand(page, selected ? "calendar" : "agenda");
}
async function selectAgendaStatus(page, status) {
  const keys = {
    pending: "statusPending",
    completed: "statusCompleted",
    "in-progress": "statusInProgress",
    cancelled: "statusCancelled",
  };
  const name = await page.evaluate(
    (key) => WorkTimeApp.i18n.t("agenda." + key),
    keys[status],
  );
  await page.locator("#agendaItemStatus").click();
  await page.getByRole("option", { name, exact: true }).click();
}
module.exports = {
  cycleAgendaView,
  selectWorkspaceCommand,
  toggleAgenda,
  selectAgendaStatus,
};
