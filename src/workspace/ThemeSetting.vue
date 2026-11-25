<script setup lang="ts">
import { UiStatus } from "@hworktime/ui";
import { ref, computed, onUnmounted } from "vue";
import { UiRadioButton as RadioButton } from "@hworktime/ui";
import { catalog } from "../catalog";
const preferences = WorkTimeApp.services.preferences.page;
const current = ref(preferences.state.pageTheme || "green"),
  failed = ref(false);
const choices = computed(() =>
  WorkTimeApp.domain.preferences.themes.map((theme) => ({
    ...theme,
    name: catalog.locale.value && WorkTimeApp.i18n.message(theme.name),
  })),
);
onUnmounted(
  preferences.subscribe((state, result) => {
    current.value = state.pageTheme || "green";
    if (result.preferenceNames?.includes("pageTheme"))
      failed.value = !result.persisted && !result.pending;
  }),
);
</script>
<template>
  <fieldset class="theme-settings">
    <legend>{{ catalog.t("copy.808b0205aa") }}</legend>
    <div class="theme-grid">
      <label
        v-for="theme in choices"
        :key="theme.id"
        class="theme-card"
        :title="theme.name"
        :style="{ '--theme-option-color': theme.color }"
      >
        <RadioButton
          :model-value="current"
          name="pageTheme"
          :value="theme.id"
          @update:model-value="preferences.saveTheme($event)"
        /><span class="theme-swatch" aria-hidden="true"></span
        ><span class="theme-name">{{ theme.name }}</span>
      </label>
    </div>
    <UiStatus as="p" class="theme-save-notice">
      {{ failed ? catalog.t("copy.121c73541e") : "" }}
    </UiStatus>
  </fieldset>
</template>
