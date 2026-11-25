import { createApp } from "vue";
import { installUI } from "../ui";
import VocabularyNavigation from "./VocabularyNavigation.vue";
export function mountVocabularyNavigation(
  nav: HTMLElement,
  navigate: (page: string) => void,
) {
  const app = createApp(VocabularyNavigation, { navigate });
  installUI(app);
  const view = app.mount(nav) as InstanceType<typeof VocabularyNavigation>;
  return { update: view.update, dispose: () => app.unmount() };
}
