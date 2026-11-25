<script setup lang="ts">
import { computed, ref, onUnmounted } from "vue";
import { catalog } from "../catalog";
import Select from "primevue/select";
import { QiChevronDown } from "qingicon-vue";
import { useWeatherPreferences } from "./preferences";
const preferences = useWeatherPreferences();
onUnmounted(preferences.subscribe());
const { t } = catalog;
const options = computed(() =>
  [3, 5, 7, 0].map((value) => ({
    value,
    label: value
      ? t("weather.settings.days", { days: value })
      : t("weather.settings.off"),
  })),
);
const owner = WorkTimeApp.services.preferences.page;
const WorkTimeAppLanguages = WorkTimeApp.i18n.languages;
const language = ref(WorkTimeApp.i18n.preference);
const motion = ref(owner.state.motionMode ?? "full");
const failures = ref({ language: false, motion: false });
const saving = ref({ language: false, motion: false });
onUnmounted(
  owner.subscribe((state, result) => {
    language.value = WorkTimeApp.i18n.preference;
    motion.value = state.motionMode ?? "full";
    if (result.preferenceNames?.includes("language"))
      failures.value.language = !result.persisted && !result.pending;
    if (result.preferenceNames?.includes("motionMode"))
      failures.value.motion = !result.persisted && !result.pending;
  }),
);
async function save(key: "language" | "motion", value: string) {
  saving.value[key] = true;
  try {
    const result =
      key === "language"
        ? await owner.saveLanguage(value)
        : await owner.saveMotionMode(value);
    failures.value[key] = !result.persisted;
  } catch {
    failures.value[key] = true;
  } finally {
    saving.value[key] = false;
  }
}
const motionOptions = computed(() =>
  ["system", "full", "reduce"].map((value) => ({
    value,
    label: t("motion." + value),
  })),
);
const tokens = {
  root: {
    background: "var(--paper)",
    color: "var(--ink)",
    borderColor: "var(--control-border)",
    focusBorderColor: "var(--accent)",
    borderRadius: "var(--control-radius)",
  },
  option: {
    selectedBackground: "var(--accent-light)",
    selectedColor: "var(--ink)",
  },
};
</script>
<template>
  <div class="field language-settings">
    <label for="languageTrigger">{{ t("language.label") }}</label>
    <Select
      input-id="languageTrigger"
      :options="WorkTimeAppLanguages"
      option-value="id"
      option-label="name"
      :model-value="language"
      :disabled="saving.language"
      :dt="tokens"
      fluid
      @update:model-value="save('language', $event)"
    />
    <p class="theme-save-notice" role="status">
      {{ failures.language ? t("language.failed") : "" }}
    </p>
  </div>
  <div class="field language-settings">
    <label for="motionTrigger">{{ t("motion.label") }}</label>
    <Select
      input-id="motionTrigger"
      :options="motionOptions"
      option-value="value"
      option-label="label"
      :model-value="motion"
      :disabled="saving.motion"
      :dt="tokens"
      fluid
      @update:model-value="save('motion', $event)"
    />
    <p class="theme-save-notice" role="status">
      {{ failures.motion ? t("motion.failed") : "" }}
    </p>
  </div>
  <div class="field language-settings">
    <label id="weatherLabel" for="weatherDays">{{
      t("weather.settings.label")
    }}</label>
    <Select
      input-id="weatherDays"
      aria-labelledby="weatherLabel"
      :model-value="preferences.days"
      :options="options"
      option-label="label"
      option-value="value"
      :disabled="preferences.busy"
      :dt="tokens"
      fluid
      @update:model-value="preferences.save"
    >
      <template #dropdownicon
        ><QiChevronDown :size="16" aria-hidden="true"
      /></template>
    </Select>
    <p class="theme-save-notice" role="status">
      {{ preferences.failed ? t("copy.121c73541e") : "" }}
    </p>
  </div>
</template>
