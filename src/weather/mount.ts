import { createApp } from "vue";
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";
import PrimeVue from "primevue/config";
import Aura from "@primeuix/themes/aura";
import WeatherSetting from "./WeatherSetting.vue";

function messages() {
  const owner = WorkTimeApp.i18n;
  return {
    label: owner.t("weather.settings.label"),
    days: owner.t("weather.settings.days", { days: "{days}" }),
    off: owner.t("weather.settings.off"),
    failed: owner.t("copy.121c73541e"),
  };
}
export function mount(host: HTMLElement) {
  const owner = WorkTimeApp.i18n;
  const i18n = createI18n({
    legacy: false,
    locale: owner.language,
    messages: { [owner.language]: messages() },
  });
  const app = createApp(WeatherSetting);
  app
    .use(createPinia())
    .use(i18n)
    .use(PrimeVue, {
      theme: { preset: Aura, options: { darkModeSelector: false } },
    });
  function synchronize() {
    i18n.global.setLocaleMessage(owner.language, messages());
    i18n.global.locale.value = owner.language;
  }
  document.addEventListener("worktime:languagechange", synchronize);
  app.onUnmount(() =>
    document.removeEventListener("worktime:languagechange", synchronize),
  );
  app.mount(host);
}
