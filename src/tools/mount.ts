import { createApp } from "vue";
import { installUI } from "../ui";
import ToolDirectory, { type ToolEntry } from "./ToolDirectory.vue";
export function mountToolDirectory(
  host: HTMLElement,
  entries: ToolEntry[],
  open: (id: string) => void,
  back: () => void,
) {
  const app = createApp(ToolDirectory, { entries, open, back });
  installUI(app);
  const view = app.mount(host) as InstanceType<typeof ToolDirectory>;
  return {
    refresh: view.refresh,
    focus: view.focus,
    dispose: () => app.unmount(),
  };
}
