import { createApp } from "vue";
import { installUI } from "../ui";
import ReaderToolbar from "./ReaderToolbar.vue";
export function mountReaderToolbar(
  host: HTMLElement,
  activate: (key: string) => void,
) {
  const app = createApp(ReaderToolbar, { activate });
  installUI(app);
  return app.mount(host) as InstanceType<typeof ReaderToolbar>;
}
