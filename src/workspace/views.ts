import { setNumberValue } from "./number-field";
import { setCheckedValue } from "./SwitchField";
import { createWorkspaceSelect } from "./select";
import { mountCityField } from "./CityField";
import { mountNotice } from "./Notice";
import { mountSummary } from "./SummaryCards";
import PickerGrid from "./views/PickerGrid";
import ScheduleChoices from "./views/ScheduleChoices";
import BreakFields from "./views/BreakFields";
import TimeTemplates from "./views/TimeTemplates";
import { controllerState } from "../controller-state";
import { createElement, type ComponentProps } from "react";
import { mountView } from "../mount-view";
import StartupPermissions from "./views/StartupPermissions";
import OnboardingSteps from "./views/OnboardingSteps";
import FolderChange from "./views/FolderChange";
import DatePickerFrame from "./views/DatePickerFrame";
import AgendaDayFrame from "./views/AgendaDayFrame";
import AgendaScheduleFields from "./views/AgendaScheduleFields";
import YearDisplay from "./views/YearDisplay";
import AgendaDisplay from "./views/AgendaDisplay";
import { AgendaList, AgendaOverview } from "../agenda/AgendaLists";
const roots = new WeakMap<HTMLElement, ReturnType<typeof mountView>>();
function viewFor(host: HTMLElement) {
  let view = roots.get(host);
  if (!view) {
    view = mountView(host);
    roots.set(host, view);
  }
  return view;
}
export const { state: oaActions, useSnapshot: useOAActions } = controllerState({
  back: "",
  yearMode: false,
  clipboardNotice: false,
});
export const workspaceViews = {
  setNumberValue,
  setCheckedValue,
  mountCityField,
  mountNotice,
  createWorkspaceSelect,
  mountSummary,
  AgendaDisplay(
    host: HTMLElement,
    props: ComponentProps<typeof AgendaDisplay>,
  ) {
    viewFor(host).render(createElement(AgendaDisplay, props));
  },
  YearDisplay(host: HTMLElement, props: ComponentProps<typeof YearDisplay>) {
    viewFor(host).render(createElement(YearDisplay, props));
  },
  focusMenu() {
    const target =
      document.querySelector<HTMLElement>(
        ".workspace-views input:checked:not(:disabled)",
      ) ?? document.getElementById("monthTitle");
    target?.focus({ preventScroll: true });
  },
  oaActions,
  AgendaList(host: HTMLElement, props: ComponentProps<typeof AgendaList>) {
    viewFor(host).render(createElement(AgendaList, props));
  },
  AgendaOverview(
    host: HTMLElement,
    props: ComponentProps<typeof AgendaOverview>,
  ) {
    viewFor(host).render(createElement(AgendaOverview, props));
  },
  PickerGrid(host: HTMLElement, props: ComponentProps<typeof PickerGrid>) {
    viewFor(host).render(createElement(PickerGrid, props));
  },
  ScheduleChoices(
    host: HTMLElement,
    props: ComponentProps<typeof ScheduleChoices>,
  ) {
    viewFor(host).render(createElement(ScheduleChoices, props));
  },
  BreakFields(host: HTMLElement, props: ComponentProps<typeof BreakFields>) {
    viewFor(host).render(createElement(BreakFields, props));
  },
  TimeTemplates(
    host: HTMLElement,
    props: ComponentProps<typeof TimeTemplates>,
  ) {
    viewFor(host).render(createElement(TimeTemplates, props));
  },
  StartupPermissions(host: HTMLElement) {
    viewFor(host).render(createElement(StartupPermissions));
  },
  OnboardingSteps(host: HTMLElement) {
    viewFor(host).render(createElement(OnboardingSteps));
  },
  FolderChange(host: HTMLElement) {
    viewFor(host).render(createElement(FolderChange));
  },
  DatePickerFrame(host: HTMLElement) {
    viewFor(host).render(createElement(DatePickerFrame));
  },
  AgendaDayFrame(host: HTMLElement) {
    viewFor(host).render(createElement(AgendaDayFrame));
  },
  AgendaScheduleFields(host: HTMLElement, props: { prefix: string }) {
    viewFor(host).render(createElement(AgendaScheduleFields, props));
  },
  dispose(host: HTMLElement) {
    roots.get(host)?.dispose();
    roots.delete(host);
  },
};
