export {};
interface Preferences {
  pageTheme?: string;
  weatherDays?: number;
  language?: string;
  motionMode?: string;
  showCalendarMascot?: boolean;
}
interface SaveResult {
  persisted: boolean;
  pending?: boolean;
  preferenceNames?: string[];
}
declare global {
  const WorkBackupConversion: { convert: (input: unknown) => unknown };
  const WorkTimeApp: {
    isDevelopmentEnabled(): boolean;
    games: {
      list(): import("./games/menu").MenuEntry[];
      createIcon(icon: string): Element;
    };
    ui: {
      selectWorkspaceView?: (
        view: import("./workspace/WorkspaceMenubar").WorkspaceView,
      ) => Promise<void>;
      mountAeroplaneControls: typeof import("./games/AeroplaneControls").mountAeroplaneControls;
      mountUnoDialog: typeof import("./games/UnoDialog").mountUnoDialog;
      mountSessionCover: typeof import("./games/SessionCover").mountSessionCover;
      mountPauseContent: typeof import("./games/Results").mountPauseContent;
      mountRestartContent: typeof import("./games/Results").mountRestartContent;
      mountGameResult: typeof import("./games/Results").mountGameResult;
      mountBrushResult: typeof import("./games/Results").mountBrushResult;
      createGameHelp: typeof import("./games/Help").createGameHelp;
      mountReplayHistory: typeof import("./games/ReplayHistory").mountReplayHistory;
      calendarCells: typeof import("./workspace/CalendarGrid").calendarCells;
      mountTimetable: typeof import("./agenda/Timetable").mountTimetable;
      mountMusicLibrary: typeof import("./media/MusicLibrary").mountMusicLibrary;
      loadGameViews: () => Promise<void>;
      fileWorkspace?: {
        mountWorkspace: typeof import("./workspace-entry").mountWorkspace;
        loadAgenda: () => Promise<typeof import("./agenda/mount")>;
      };
      renderWorkspaceTabs: typeof import("./workspace/tabs").renderWorkspaceTabs;
      workspaceViews: typeof import("./workspace/views").workspaceViews;
      native: typeof import("./dom");
      mountGameToolbar: typeof import("./games/menu").mountGameToolbar;
      mountMusicTransport: typeof import("./media/mount").mountMusicTransport;
      importRecords: typeof import("./imports/records").records;
      loadTypingViews: () => Promise<void>;
      loadMusicViews: () => Promise<void>;
      loadVocabularyViews: () => Promise<void>;
      loadReaderToolbar: () => Promise<
        typeof import("./media/reader-entry").mountReaderToolbar
      >;
      createMediaSelectGroup: typeof import("./media/selects").createMediaSelectGroup;
      createRestartPrompt: typeof import("./games/restart").createRestartPrompt;

      mountMusicToolbar: typeof import("./media/mount").mountMusicToolbar;
      confirmations: typeof import("./imports/confirmations").confirmations;
      renderAnalysisMetrics: typeof import("./analysis/metrics").renderAnalysisMetrics;
      afterAnalysisRender: typeof import("./analysis/metrics").afterAnalysisRender;
      renderAnalysisSidebar: typeof import("./analysis/sidebar").renderAnalysisSidebar;
      mountVocabularyPage: typeof import("./vocabulary/Pages").mountVocabularyPage;
      mountVocabularyNavigation: typeof import("./vocabulary/mount").mountVocabularyNavigation;
      createSelect: typeof import("./workspace/select").createWorkspaceSelect;
      mountPlayback: typeof import("./music/playback").mountPlayback;
      mountToolDirectory: typeof import("./tools/mount").mountToolDirectory;
      mountTyping: typeof import("./typing/mount").mountTyping;
      renderGameMenu: typeof import("./games/menu").renderGameMenu;
    };
    data: { locales: Record<string, Record<string, string>> };
    domain: {
      preferences: { themes: { id: string; name: string; color: string }[] };
    };
    services: {
      gameArchive: {
        progressSummary(id: string): { kind: string; value?: number };
      };
      backup: {
        MAX_BYTES: number;
        decode(
          input: string,
          convert: (input: unknown) => unknown,
        ): Promise<{ modules: unknown[] }>;
      };
      downloads: {
        create(deps: {
          document: Document;
          URL: typeof URL;
          Blob: typeof Blob;
        }): {
          download(name: string, content: string, type: string): void;
          dispose(): void;
        };
      };

      preferences: {
        page: {
          state: Preferences;
          saveMotionMode(mode: string): Promise<SaveResult>;
          saveCalendarMascot(show: boolean): Promise<SaveResult>;
          saveLanguage(locale: string): Promise<SaveResult>;
          saveTheme(theme: string): Promise<SaveResult>;
          saveWeatherDays(days: number): Promise<SaveResult>;
          subscribe(
            callback: (state: Preferences, result: SaveResult) => void,
          ): () => void;
        };
      };
    };
    i18n: {
      setTranslator(
        fn: (key: string, values: Record<string, string | number>) => string,
      ): void;
      message(value: string): string;
      number(value: number): string;
      apply(): void;
      languages: { id: string; name: string }[];
      preference: string;
      language: string;
      t(key: string, values?: Record<string, string>): string;
    };
  };
}
