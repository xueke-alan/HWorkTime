import { defineStore } from "pinia";
import { ref } from "vue";
interface Preferences {
  weatherDays?: number;
}
interface SaveResult {
  persisted: boolean;
  pending?: boolean;
  preferenceNames?: string[];
}
declare global {
  const WorkTimeApp: {
    services: {
      preferences: {
        page: {
          state: Preferences;
          saveWeatherDays(days: number): Promise<SaveResult>;
          subscribe(
            callback: (state: Preferences, result: SaveResult) => void,
          ): () => void;
        };
      };
    };
    i18n: {
      language: string;
      t(key: string, values?: Record<string, string>): string;
    };
  };
}
export const useWeatherPreferences = defineStore("weather-settings", () => {
  const page = WorkTimeApp.services.preferences.page;
  const days = ref(page.state.weatherDays ?? 5);
  const busy = ref(false);
  const failed = ref(false);
  function subscribe() {
    return page.subscribe((state, result) => {
      days.value = state.weatherDays ?? 5;
      if (result.preferenceNames?.includes("weatherDays"))
        failed.value = !result.pending && !result.persisted;
    });
  }
  async function save(value: number) {
    busy.value = true;
    try {
      failed.value = !(await page.saveWeatherDays(value)).persisted;
    } catch {
      failed.value = true;
    } finally {
      busy.value = false;
      days.value = page.state.weatherDays ?? 5;
    }
  }
  return { days, busy, failed, subscribe, save };
});
