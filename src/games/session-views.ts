import { mountUnoDialog } from "./UnoDialog";
import { mountAeroplaneControls } from "./AeroplaneControls";
import { mountSessionCover } from "./SessionCover";
import {
  mountGameResult,
  mountBrushResult,
  mountPauseContent,
  mountRestartContent,
} from "./Results";
import { createGameHelp } from "./Help";
import { mountReplayHistory } from "./ReplayHistory";
import { createRestartPrompt } from "./restart";
import { createWorkspaceSelect } from "../workspace/select";
export function registerSessionViews() {
  WorkTimeApp.ui.createSelect = createWorkspaceSelect;
  WorkTimeApp.ui.mountAeroplaneControls = mountAeroplaneControls;
  WorkTimeApp.ui.mountUnoDialog = mountUnoDialog;
  WorkTimeApp.ui.mountSessionCover = mountSessionCover;
  WorkTimeApp.ui.mountPauseContent = mountPauseContent;
  WorkTimeApp.ui.mountRestartContent = mountRestartContent;
  WorkTimeApp.ui.mountGameResult = mountGameResult;
  WorkTimeApp.ui.mountBrushResult = mountBrushResult;
  WorkTimeApp.ui.createGameHelp = createGameHelp;
  WorkTimeApp.ui.mountReplayHistory = mountReplayHistory;
  WorkTimeApp.ui.createRestartPrompt = createRestartPrompt;
}
