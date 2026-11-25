<script setup lang="ts">
import { UiToolbar } from "@hworktime/ui";
import { ref } from "vue";
import { UiButton as Button, UiInputText as InputText } from "@hworktime/ui";
import { QiCalendar, QiSearch, QiFolder } from "qingicon-vue";
import { catalog } from "../catalog";
const props = defineProps<{
  activate: (id: string) => void;
  text: (key: string) => string;
}>();
function label(key: string) {
  void catalog.locale.value;
  return props.text(key);
}
const busy = ref(false),
  reading = ref(false),
  needsAccess = ref(false);
const statusHost = ref<HTMLElement>();
defineExpose({
  setStatusHost(host: HTMLElement) {
    statusHost.value = host;
  },
  update(scanning: boolean, tagging: boolean, access: boolean) {
    busy.value = scanning;
    reading.value = tagging;
    needsAccess.value = access;
  },
});
</script>
<template>
  <Button
    id="musicExitButton"
    class="music-button ui-button icon-only workspace-toolbar-action"
    type="button"
    :aria-label="label('returnMain')"
    @click="activate('exit')"
    ><QiCalendar class="ui-icon" aria-hidden="true"
  /></Button>
  <h2 id="musicTitle">{{ label("title") }}</h2>
  <div class="music-search-box">
    <span class="music-glyph" aria-hidden="true"><QiSearch /></span
    ><InputText
      type="search"
      class="music-search"
      :aria-label="label('search')"
      :title="label('search')"
      :placeholder="label('search')"
    />
  </div>
  <details class="music-menu music-management">
    <summary
      class="music-menu-toggle workspace-toolbar-action"
      :title="label('manage')"
      :aria-label="label('manage')"
    >
      <QiFolder aria-hidden="true" />
    </summary>
    <UiToolbar as="div" class="music-menu-panel music-toolbar">
      <Button
        v-for="key in ['choose', 'importFolder', 'rescan']"
        :key="key"
        type="button"
        class="music-button"
        :disabled="key === 'rescan' && busy"
        :data-runtime-action="
          key === 'choose' || key === 'importFolder' ? 'import' : undefined
        "
        :label="label(key)"
        @click="activate(key)"
      />
    </UiToolbar>
  </details>
  <Button
    id="musicMinimize"
    type="button"
    class="music-button ui-button icon-only workspace-toolbar-action"
    :title="label('minimize')"
    :aria-label="label('minimize')"
    @click="activate('minimize')"
    ><svg class="ui-icon" aria-hidden="true">
      <use href="#ms-horizontal-rule" /></svg
  ></Button>
  <Teleport v-if="statusHost" :to="statusHost"
    ><Button
      type="button"
      id="musicReconnect"
      class="music-button"
      :hidden="!needsAccess"
      :label="label('access')"
      @click="activate('access')" /><Button
      type="button"
      class="music-button"
      :hidden="!busy && !reading"
      :label="label('cancel')"
      @click="activate('cancel')"
  /></Teleport>
</template>
