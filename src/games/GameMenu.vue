<script setup lang="ts">
import {
  computed,
  ref,
  onMounted,
  onUnmounted,
  watch,
  nextTick,
  type Ref,
  type ObjectDirective,
} from "vue";
import { QiRotateCcw } from "qingicon-vue";
import Button from "primevue/button";
import { catalog } from "../catalog";
import { bindScroll } from "./menu-scroll";
import type { MenuEntry, GameMenuOptions } from "./menu";
const props = defineProps<{
  container: HTMLElement;
  entries: MenuEntry[];
  options: GameMenuOptions;
  selection: Ref<string>;
  revision: Ref<number>;
  onChoose: (id: string) => void;
}>();
const header = ref<HTMLElement>(),
  list = ref<HTMLElement>(),
  area = ref<HTMLElement>(),
  track = ref<HTMLElement>(),
  thumb = ref<HTMLElement>(),
  detail = ref<HTMLElement>(),
  description = ref<HTMLElement>();
const active = computed(() =>
  props.entries.find((entry) => entry.id === props.selection.value),
);
const stop = ref(props.selection.value);
const vArtwork: ObjectDirective<HTMLElement, string> = {
  mounted(el, { value }) {
    el.replaceChildren(WorkTimeApp.games.createIcon(value));
  },
  updated(el, { value, oldValue }) {
    if (value !== oldValue)
      el.replaceChildren(WorkTimeApp.games.createIcon(value));
  },
};
const progress = computed(() => {
  void props.revision.value;
  const { kind, value } = WorkTimeApp.services.gameArchive.progressSummary(
    props.selection.value,
  );
  return catalog.t(
    "games.progress." + kind,
    value === undefined ? {} : { n: WorkTimeApp.i18n.number(value) },
  );
});
let cleanup: (() => void) | undefined;
onMounted(() => {
  props.options.archiveUI?.decorate(props.container, header.value!);
  if (list.value)
    cleanup = bindScroll(list.value, area.value!, track.value!, thumb.value!);
});
onUnmounted(() => cleanup?.());
watch(
  () => props.selection.value,
  (id) => {
    stop.value = id;
    nextTick(() => {
      if (description.value) description.value.scrollTop = 0;
      if (detail.value) detail.value.scrollTop = 0;
    });
  },
);
function select(id: string) {
  props.onChoose(id);
  props.options.onSelect(id);
}
function keydown(e: KeyboardEvent) {
  const buttons = Array.from(list.value!.querySelectorAll("button"));
  const i = buttons.indexOf(e.target as HTMLButtonElement);
  if (i < 0) return;
  const index = (
    {
      ArrowDown: Math.min(i + 1, buttons.length - 1),
      ArrowUp: Math.max(i - 1, 0),
      Home: 0,
      End: buttons.length - 1,
    } as Record<string, number>
  )[e.key];
  if (index !== undefined) {
    e.preventDefault();
    buttons[index].focus();
  }
}
</script>
<template>
  <header ref="header" class="game-menu-header">
    <h2>{{ catalog.t("games.menu") }}</h2>
    <template v-if="options.archiveUI"
      ><p class="game-menu-archive-status" role="status"></p>
      <div
        class="game-menu-archive-actions"
        role="group"
        :aria-label="
          catalog.t('gameArchive.save') +
          ' / ' +
          catalog.t('gameArchive.import')
        "
      >
        <Button
          type="button"
          class="icon-only"
          data-game-archive="save"
          :title="catalog.t('gameArchive.saveHint')"
          :aria-label="catalog.t('gameArchive.saveHint')"
          ><span class="backup-icon-slot" aria-hidden="true"
            ><svg class="ui-icon backup-idle-icon">
              <use href="#ms-backup" /></svg
            ><svg class="backup-hold-icon" viewBox="0 0 32 32">
              <circle class="hold-track" cx="16" cy="16" r="14" />
              <circle
                class="hold-progress"
                cx="16"
                cy="16"
                r="14"
                pathLength="100"
              />
              <use
                class="download-glyph"
                href="#ms-download"
                x="6"
                y="6"
                width="20"
                height="20"
                fill="currentColor"
                stroke="none"
              /></svg></span
        ></Button>
        <Button
          type="button"
          class="icon-only"
          data-game-archive="import"
          :title="catalog.t('gameArchive.import')"
          :aria-label="catalog.t('gameArchive.import')"
          ><QiRotateCcw class="ui-icon" aria-hidden="true"
        /></Button></div
    ></template>
  </header>
  <div class="game-library">
    <template v-if="active">
      <div ref="area" class="game-menu-scroll">
        <div
          ref="list"
          class="game-menu-list"
          role="group"
          :aria-label="catalog.t('games.menu')"
          @keydown="keydown"
        >
          <Button
            v-for="entry in entries"
            :key="entry.id"
            type="button"
            class="ui-button game-menu-entry"
            :data-game="entry.id"
            :aria-pressed="selection.value === entry.id"
            :tabindex="stop === entry.id ? 0 : -1"
            @focus="stop = entry.id"
            @click="select(entry.id)"
            @dblclick="options.onLaunch(entry.id)"
          >
            <span
              v-artwork="entry.icon"
              class="game-menu-artwork"
              aria-hidden="true"
            /><span class="game-menu-name">{{
              catalog.t(entry.nameKey)
            }}</span></Button
          >
        </div>
        <div ref="track" class="game-menu-scroll-track" aria-hidden="true">
          <div ref="thumb" class="game-menu-scroll-thumb" />
        </div>
      </div>
      <section
        ref="detail"
        class="game-menu-detail"
        :aria-label="catalog.t(active.nameKey)"
      >
        <header class="game-menu-detail-header">
          <span
            v-artwork="active.icon"
            class="game-menu-artwork"
            aria-hidden="true"
          />
          <h3>{{ catalog.t(active.nameKey) }}</h3>
        </header>
        <p ref="description" class="game-menu-description" tabindex="-1">
          {{ catalog.t(active.descriptionKey) }}
        </p>
        <Button
          type="button"
          class="ui-button primary game-menu-play"
          :label="catalog.t('games.play')"
          :aria-label="
            catalog.t('games.play') + ' · ' + catalog.t(active.nameKey)
          "
          @click="options.onLaunch(active.id)"
        />
        <div class="game-menu-progress">
          <h4>{{ catalog.t("games.progress.title") }}</h4>
          <p>{{ progress }}</p>
        </div>
      </section> </template
    ><template v-else>{{ catalog.t("games.empty") }}</template>
  </div>
</template>
