<script setup lang="ts">
import { computed, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import Select from "primevue/select";
import { QiChevronDown } from "qingicon-vue";
import { useWeatherPreferences } from "./preferences";
const preferences = useWeatherPreferences();
onUnmounted(preferences.subscribe());
const { t } = useI18n();
const options = computed(() =>
  [3, 5, 7, 0].map((value) => ({
    value,
    label: value ? t("days", { days: value }) : t("off"),
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
  <label id="weatherLabel" for="weatherDays">{{ t("label") }}</label>
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
    {{ preferences.failed ? t("failed") : "" }}
  </p>
</template>
