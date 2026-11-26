import { mountWorkspace } from "./workspace-entry";
WorkTimeApp.ui.fileWorkspace = {
  mountWorkspace,
  loadAgenda: () => import("./agenda/mount"),
};
