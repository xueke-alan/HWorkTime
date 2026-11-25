import "./catalog";
import { createApp } from "vue";
import Workspace from "./WorkWorkspace.vue";
import { installUI } from "./ui";
import { renderGameMenu } from "./games/menu";
import { mountTyping } from "./typing/mount";
import { mountVocabularyNavigation } from "./vocabulary/mount";
import { createWorkspaceSelect } from "./workspace/select";
import { mountPlayback } from "./music/playback";
import { mountToolDirectory } from "./tools/mount";
export function mountWorkspace() {
  WorkTimeApp.ui.createSelect = createWorkspaceSelect;
  WorkTimeApp.ui.mountVocabularyNavigation = mountVocabularyNavigation;
  WorkTimeApp.ui.mountPlayback = mountPlayback;
  WorkTimeApp.ui.mountToolDirectory = mountToolDirectory;
  WorkTimeApp.ui.mountTyping = mountTyping;
  WorkTimeApp.ui.renderGameMenu = renderGameMenu;
  const app = createApp(Workspace);
  installUI(app);
  app.mount("#worktime-app");
  WorkTimeApp.i18n.apply();
}
