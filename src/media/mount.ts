import { createApp } from "vue";
import { installUI } from "../ui";
import MusicToolbar from "./MusicToolbar.vue";
export function mountMusicToolbar(
  host: HTMLElement,
  activate: (key: string) => void,
  text: (key: string) => string,
) {
  const app = createApp(MusicToolbar, { activate, text });
  installUI(app);
  const view = app.mount(host) as InstanceType<typeof MusicToolbar>;
  return {
    setStatusHost: view.setStatusHost,
    update: view.update,
    dispose: () => app.unmount(),
  };
}

import MusicTransport from "./MusicTransport.vue";
export function mountMusicTransport(
  host: HTMLElement,
  activate: (action: string, event: MouseEvent) => void,
) {
  const app = createApp(MusicTransport, { activate });
  installUI(app);
  const view = app.mount(host) as InstanceType<typeof MusicTransport>;
  return { update: view.update, dispose: () => app.unmount() };
}
