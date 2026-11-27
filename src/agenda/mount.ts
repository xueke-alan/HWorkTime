import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { ApplicationTheme } from "../ApplicationTheme";
import { SidebarTheme } from "../sidebar-theme";
import { AgendaEditor } from "./AgendaEditor";

export type Status = "pending" | "completed" | "in-progress" | "cancelled";
export interface Draft {
  title: string;
  note: string;
  status: Status;
}
export interface EditorOptions {
  draft: Draft;
  schedule: HTMLElement;
  footer: HTMLElement;
  cancel: () => void;
  changed: () => void;
}
export function mount(host: HTMLElement, options: EditorOptions) {
  const root = createRoot(host);
  function update(view: { editing: boolean; busy: boolean; locked: boolean }) {
    flushSync(() =>
      root.render(
        createElement(
          ApplicationTheme,
          null,
          createElement(
            SidebarTheme,
            null,
            createElement(AgendaEditor, {
              ...options,
              draft: { ...options.draft },
              view,
              change(patch: Partial<Draft>) {
                Object.assign(options.draft, patch);
                options.changed();
              },
            }),
          ),
        ),
      ),
    );
  }
  update({ editing: false, busy: false, locked: false });
  return {
    update,
    dispose() {
      root.unmount();
    },
  };
}
