import { createApp } from "vue";
import { installUI } from "../ui";
import FooterPlayback from "./FooterPlayback.vue";
export type PlaybackAction = "previous" | "toggle" | "next";
export interface PlaybackSnapshot {
  current?: { title?: string; name?: string };
  tracks: unknown[];
  paused: boolean;
  needsAccess: boolean;
}
export function mountPlayback(
  host: HTMLElement,
  action: (value: PlaybackAction) => void,
) {
  const mount = document.createElement("span");
  mount.style.display = "contents";
  host.prepend(mount);
  const app = createApp(FooterPlayback, { action });
  installUI(app);
  const view = app.mount(mount) as InstanceType<typeof FooterPlayback>;
  return {
    refresh: view.refresh,
    dispose() {
      app.unmount();
      mount.remove();
    },
  };
}
