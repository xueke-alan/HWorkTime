<script setup lang="ts">
import { ref } from "vue";
import { UiButton as Button } from "@hworktime/ui";
import { QiCalendar } from "qingicon-vue";
import { catalog } from "../catalog";
defineProps<{ exit: () => void }>();
const title = ref("games.menu");
defineExpose({
  show(key: string) {
    title.value = key;
  },
});
</script>
<template>
  <Button
    id="gameExitButton"
    type="button"
    class="ui-button icon-only workspace-toolbar-action"
    :aria-label="catalog.t('workspace.returnCalendar')"
    @click="exit"
    ><QiCalendar class="ui-icon" aria-hidden="true"
  /></Button>
  <h2 id="gameTitle">{{ catalog.t(title) }}</h2>
</template>
