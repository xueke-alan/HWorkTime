<script setup lang="ts">
import { UiToolbar, UiStatus } from "@hworktime/ui";
import { ref } from "vue";
import { UiButton as Button } from "@hworktime/ui";
import { QiCalendar } from "qingicon-vue";
import { catalog } from "../catalog";
defineProps<{ navigate: (page: string) => void; close: () => void }>();
const current = ref("courses");
const pages = ["courses", "practice", "challenges", "statistics"];
defineExpose({
  setPage: (page: string) => {
    current.value = page;
  },
});
</script>
<template>
  <div class="game-surface" aria-hidden="true"></div>
  <UiToolbar as="header" class="typing-toolbar workspace-toolbar">
    <Button
      id="typingExitButton"
      type="button"
      class="ui-button icon-only workspace-toolbar-action"
      :title="catalog.t('workspace.returnCalendar')"
      :aria-label="catalog.t('workspace.returnCalendar')"
      @click="close"
      ><QiCalendar aria-hidden="true"
    /></Button>
    <div class="typing-heading">
      <h2 id="typingTitle">{{ catalog.t("typing.title") }}</h2>
    </div>
  </UiToolbar>
  <div class="typing-main">
    <div class="typing-section-bar">
      <nav class="typing-navigation" :aria-label="catalog.t('typing.title')">
        <Button
          v-for="page in pages"
          :key="page"
          type="button"
          class="typing-button"
          :aria-current="current === page ? 'page' : 'false'"
          :label="catalog.t('typing.' + page)"
          @click="navigate(page)"
        />
      </nav>
    </div>
    <div class="typing-content"></div>
    <UiStatus as="div" class="typing-notice" hidden></UiStatus>
  </div>
</template>
