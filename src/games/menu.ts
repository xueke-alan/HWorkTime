import { createApp, ref } from "vue";
import { installUI } from "../ui";
import GameMenu from "./GameMenu.vue";
export interface MenuEntry {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
}
export interface GameMenuOptions {
  selectedId: string;
  onSelect: (id: string) => void;
  onLaunch: (id: string) => void;
  archiveUI?: { decorate(container: HTMLElement, header: HTMLElement): void };
}
export function renderGameMenu(
  container: HTMLElement,
  options: GameMenuOptions,
) {
  const entries = WorkTimeApp.games.list();
  const selection = ref(
    entries.find((entry) => entry.id === options.selectedId)?.id ??
      entries[0]?.id ??
      "",
  );
  const revision = ref(0);
  const app = createApp(GameMenu, {
    container,
    entries,
    options,
    selection,
    revision,
    onChoose(id: string) {
      selection.value = id;
    },
  });
  installUI(app);
  app.mount(container);
  return {
    select(id: string) {
      if (entries.some((entry) => entry.id === id)) selection.value = id;
    },
    refreshProgress() {
      revision.value++;
    },
    dispose() {
      app.unmount();
    },
  };
}

import SessionToolbar from "./SessionToolbar.vue";
export function mountGameToolbar(host: HTMLElement, exit: () => void) {
  const app = createApp(SessionToolbar, { exit });
  installUI(app);
  const view = app.mount(host) as InstanceType<typeof SessionToolbar>;
  return { show: view.show, dispose: () => app.unmount() };
}
