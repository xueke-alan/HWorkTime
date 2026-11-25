import { installUI } from "../ui";
import { createApp, reactive } from "vue";

import AgendaEditor from "./AgendaEditor.vue";

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
  const draft = reactive(options.draft);
  const view = reactive({ editing: false, busy: false, locked: false });
  const app = createApp(AgendaEditor, { ...options, draft, view });
  installUI(app);
  app.mount(host);
  return {
    draft,
    view,
    dispose() {
      app.unmount();
    },
  };
}
