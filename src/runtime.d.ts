export {};
interface Preferences {
  pageTheme?: string;
  weatherDays?: number;
  language?: string;
  motionMode?: string;
}
interface SaveResult {
  persisted: boolean;
  pending?: boolean;
  preferenceNames?: string[];
}
declare global {
  const WorkBackupConversion: { convert: (input: unknown) => unknown };
  const WorkTimeApp: {
    games: {
      list(): import("./games/menu").MenuEntry[];
      createIcon(icon: string): Element;
    };
    ui: {
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
