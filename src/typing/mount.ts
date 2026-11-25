import { createApp } from "vue";
import { installUI } from "../ui";
import TypingWorkspace from "./TypingWorkspace.vue";
export function mountTyping(
  shell: HTMLElement,
  navigate: (page: string) => void,
  close: () => void,
) {
  const app = createApp(TypingWorkspace, { navigate, close });
  installUI(app);
  const view = app.mount(shell) as InstanceType<typeof TypingWorkspace>;
  return { setPage: view.setPage, dispose: () => app.unmount() };
}
