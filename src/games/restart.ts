import { createApp } from "vue";
import { installUI } from "../ui";
import RestartPrompt from "./RestartPrompt.vue";
export interface RestartOptions {
  host: HTMLElement;
  signal: AbortSignal;
  labels?: () => { title: string; cancel: string; accept: string };
  onOpen?: () => void;
  onConfirm: () => void;
  onCancel?: () => void;
}
export function createRestartPrompt(options: RestartOptions) {
  const cover = document.createElement("div");
  cover.className = "game-restart-panel game-restart-cover";
  cover.hidden = true;
  options.host.classList.add("game-restart-host");
  options.host.append(cover);
  const app = createApp(RestartPrompt, {
    cover,
    options,
    show(visible: boolean) {
      cover.hidden = !visible;
    },
  });
  installUI(app);
  const view = app.mount(cover) as InstanceType<typeof RestartPrompt>;
  options.signal.addEventListener(
    "abort",
    () => {
      app.unmount();
      cover.remove();
    },
    { once: true },
  );
  return { open: view.open, isOpen: view.isOpen };
}
