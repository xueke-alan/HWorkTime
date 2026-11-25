<script setup lang="ts">
import { computed, ref, nextTick, onBeforeUnmount } from "vue";
import Button from "primevue/button";
import { QiRotateCcw } from "qingicon-vue";
import { catalog } from "../catalog";
import type { RestartOptions } from "./restart";
const props = defineProps<{
  options: RestartOptions;
  show: (visible: boolean) => void;
  cover: HTMLElement;
}>();
const opened = ref(false);
let source: HTMLElement | undefined;
const saved = new Map<HTMLElement, boolean>();
const labels = computed(() => {
  void catalog.locale.value;
  return (
    props.options.labels?.() ?? {
      title: catalog.t("games.restartNew"),
      cancel: catalog.t("games.restartCancel"),
      accept: catalog.t("games.restartNew"),
    }
  );
});
function focus(action: string) {
  props.cover
    .querySelector<HTMLElement>('[data-game-restart="' + action + '"]')
    ?.focus({ preventScroll: true });
}
function restore() {
  for (const [el, inert] of saved) el.inert = inert;
  saved.clear();
}
function open(trigger: HTMLElement) {
  if (opened.value || props.options.signal.aborted) return;
  source = trigger;
  props.options.onOpen?.();
  opened.value = true;
  const root = props.options.host.closest(".game-session");
  for (
    let branch: HTMLElement = props.cover;
    branch.parentElement && branch !== root;
    branch = branch.parentElement
  ) {
    for (const el of Array.from(branch.parentElement.children)) {
      if (el === branch || !(el instanceof HTMLElement)) continue;
      saved.set(el, el.inert);
      el.inert = true;
    }
  }
  props.show(true);
  nextTick(() => {
    if (opened.value) focus("cancel");
  });
}
function close(confirm: boolean) {
  if (!opened.value) return;
  opened.value = false;
  props.show(false);
  restore();
  if (confirm) props.options.onConfirm();
  else {
    props.options.onCancel?.();
    source?.focus({ preventScroll: true });
  }
}
function keydown(event: KeyboardEvent) {
  event.stopPropagation();
  if (event.key === "Escape") {
    event.preventDefault();
    close(false);
  } else if (event.key === "Tab") {
    event.preventDefault();
    focus(
      document.activeElement?.getAttribute("data-game-restart") === "cancel"
        ? "new"
        : "cancel",
    );
  }
}
onBeforeUnmount(restore);
defineExpose({ open, isOpen: () => opened.value });
</script>
<template>
  <div
    v-if="opened"
    class="game-restart-content"
    role="dialog"
    aria-modal="true"
    :aria-label="labels.title"
    @keydown="keydown"
  >
    <h3 v-if="options.labels" class="game-restart-message">
      {{ labels.title }}
    </h3>
    <QiRotateCcw v-else class="game-restart-icon" aria-hidden="true" />
    <div class="game-restart-actions">
      <Button
        class="game-button"
        type="button"
        data-game-restart="cancel"
        :label="labels.cancel"
        @click="close(false)"
      /><Button
        class="game-button"
        type="button"
        data-game-restart="new"
        :label="labels.accept"
        @click="close(true)"
      />
    </div>
  </div>
</template>
