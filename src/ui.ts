import { watch, type App } from "vue";
import { catalog } from "./catalog";
import { createPinia } from "pinia";
import PrimeVue, { usePrimeVue } from "primevue/config";
import Aura from "@primeuix/themes/aura";
import { definePreset } from "@primeuix/themes";

const workspaceTheme = definePreset(Aura, {
  semantic: {
    formField: { borderRadius: "var(--control-radius, 0.57rem)" },
    colorScheme: {
      light: {
        primary: {
          color: "var(--accent, #157e68)",
          hoverColor: "var(--theme-accent-deep, #155f4d)",
          activeColor: "var(--theme-accent-deep, #155f4d)",
          contrastColor: "#fff",
        },
        highlight: {
          background: "var(--accent-light, #e7f5ef)",
          color: "var(--ink, #233c3a)",
        },
        formField: {
          background: "var(--paper, white)",
          borderColor: "var(--control-border, #d7e3de)",
          focusBorderColor: "var(--accent, #157e68)",
          color: "var(--ink, #233c3a)",
        },
      },
    },
  },
});
const pinia = createPinia();
export function installUI(app: App) {
  app.use(pinia).use(PrimeVue, {
    theme: {
      preset: workspaceTheme,
      options: { darkModeSelector: false, cssLayer: true },
    },
  });
  const config = app.runWithContext(() => usePrimeVue().config);
  const stop = watch(
    catalog.locale,
    () => {
      for (const key of [
        "emptyMessage",
        "emptySearchMessage",
        "searchMessage",
        "selectionMessage",
        "emptySelectionMessage",
        "choose",
        "cancel",
        "upload",
        "completed",
        "pending",
      ] as const) {
        config.locale![key] = catalog.t("prime." + key, { 0: "{0}" });
      }
    },
    { immediate: true },
  );
  app.onUnmount(stop);
}
