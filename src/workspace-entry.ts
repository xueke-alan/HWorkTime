import * as native from "./dom";
import { createElement } from "react";
import Workspace from "./WorkWorkspace";
import { calendarCells } from "./workspace/CalendarGrid";
import { mountTimetable } from "./agenda/Timetable";
import { mountView } from "./mount-view";
import { renderGameMenu, mountGameToolbar } from "./games/menu";
import { mountPlayback } from "./music/playback";
import { mountToolDirectory } from "./tools/mount";
import { renderAnalysisSidebar } from "./analysis/sidebar";
import { renderAnalysisHover, positionAnalysisHover } from "./analysis/hover";
import { renderAnalysisMetrics, afterAnalysisRender } from "./analysis/metrics";
import { confirmations } from "./imports/confirmations";
import { records } from "./imports/records";
import { renderWorkspaceTabs } from "./workspace/tabs";
import { workspaceViews } from "./workspace/views";
export async function mountWorkspace(signal?: AbortSignal) {
  WorkTimeApp.ui.loadGameViews = async () =>
    (await import("./games/session-views")).registerSessionViews();
  WorkTimeApp.ui.calendarCells = calendarCells;
  WorkTimeApp.ui.mountTimetable = mountTimetable;
  WorkTimeApp.ui.loadVocabularyViews = async () => {
    const [pages, navigation] = await Promise.all([
      import("./vocabulary/Pages"),
      import("./vocabulary/mount"),
    ]);
    WorkTimeApp.ui.mountVocabularyPage = pages.mountVocabularyPage;
    WorkTimeApp.ui.mountVocabularyNavigation =
      navigation.mountVocabularyNavigation;
  };
  WorkTimeApp.ui.loadMusicViews = async () => {
    const [library, controls, selects] = await Promise.all([
      import("./media/MusicLibrary"),
      import("./media/mount"),
      import("./media/selects"),
    ]);
    WorkTimeApp.ui.createMediaSelectGroup = selects.createMediaSelectGroup;
    WorkTimeApp.ui.mountMusicLibrary = library.mountMusicLibrary;
    WorkTimeApp.ui.mountMusicToolbar = controls.mountMusicToolbar;
    WorkTimeApp.ui.mountMusicTransport = controls.mountMusicTransport;
  };
  WorkTimeApp.ui.loadTypingViews = async () => {
    WorkTimeApp.ui.mountTyping = (await import("./typing/mount")).mountTyping;
  };
  WorkTimeApp.ui.native = native;
  WorkTimeApp.ui.workspaceViews = workspaceViews;
  WorkTimeApp.ui.renderWorkspaceTabs = renderWorkspaceTabs;
  WorkTimeApp.ui.renderAnalysisSidebar = renderAnalysisSidebar;
  WorkTimeApp.ui.renderAnalysisHover = renderAnalysisHover;
  WorkTimeApp.ui.positionAnalysisHover = positionAnalysisHover;
  WorkTimeApp.ui.renderAnalysisMetrics = renderAnalysisMetrics;
  WorkTimeApp.ui.afterAnalysisRender = afterAnalysisRender;
  WorkTimeApp.ui.confirmations = confirmations;
  WorkTimeApp.ui.loadReaderToolbar = async () => {
    const [toolbar, selects] = await Promise.all([
      import("./media/reader-entry"),
      import("./media/selects"),
    ]);
    WorkTimeApp.ui.createMediaSelectGroup = selects.createMediaSelectGroup;
    return toolbar.mountReaderToolbar;
  };
  WorkTimeApp.ui.importRecords = records;
  WorkTimeApp.ui.mountGameToolbar = mountGameToolbar;
  WorkTimeApp.ui.mountPlayback = mountPlayback;
  WorkTimeApp.ui.mountToolDirectory = mountToolDirectory;
  WorkTimeApp.ui.renderGameMenu = renderGameMenu;
  const host = document.getElementById("worktime-app");
  if (!host) throw new Error("Missing workspace container");
  const view = mountView(host);
  try {
    for (let stage = 0; stage <= 4; stage++) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      signal?.throwIfAborted();
      view.render(createElement(Workspace, { stage }));
    }
    WorkTimeApp.i18n.apply();
  } catch (error) {
    view.dispose();
    throw error;
  }
  return view.dispose;
}
