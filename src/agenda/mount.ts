import { createApp, reactive } from "vue";
import { createI18n } from "vue-i18n";
import PrimeVue from "primevue/config";
import Aura from "@primeuix/themes/aura";
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
const keys = [
  "title",
  "titlePlaceholder",
  "note",
  "notePlaceholder",
  "status",
  "statusPending",
  "statusCompleted",
  "statusInProgress",
  "statusCancelled",
  "cancel",
  "saveChanges",
  "createItem",
];
function messages() {
  return Object.fromEntries(
    keys.map((key) => [key, WorkTimeApp.i18n.t("agenda." + key)]),
  );
}
export function mount(host: HTMLElement, options: EditorOptions) {
  const draft = reactive(options.draft);
  const view = reactive({ editing: false, busy: false, locked: false });
  const language = WorkTimeApp.i18n.language;
  const i18n = createI18n({
    legacy: false,
    locale: language,
    messages: { [language]: messages() },
  });
  const app = createApp(AgendaEditor, { ...options, draft, view });
  app.use(i18n).use(PrimeVue, {
    theme: { preset: Aura, options: { darkModeSelector: false } },
  });
  app.mount(host);
  function synchronize() {
    const locale = WorkTimeApp.i18n.language;
    i18n.global.setLocaleMessage(locale, messages());
    i18n.global.locale.value = locale;
  }
  document.addEventListener("worktime:languagechange", synchronize);
  return {
    draft,
    view,
    dispose() {
      document.removeEventListener("worktime:languagechange", synchronize);
      app.unmount();
    },
  };
}
