import { shallowRef } from "vue";
interface Row {
  label: string;
  value: string;
}
export interface SidebarView {
  month: string;
  observation: string;
  context: string;
  live: "polite" | "off";
  choices: { date: string; label: string }[];
  pinned: string | null;
  focus: null | {
    title: string;
    kind: string;
    times: { next: boolean; clock: string }[];
    rows: Row[];
    source: string;
  };
  scope: Row[];
  comparison: string;
}
export const sidebar = shallowRef<SidebarView>();
export function renderAnalysisSidebar(view: SidebarView) {
  sidebar.value = view;
}
