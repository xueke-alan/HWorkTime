<script setup lang="ts">
import { ref, computed } from "vue";
import Button from "primevue/button";
import {
  QiShuffle,
  QiSkipBack,
  QiPause,
  QiPlay,
  QiSkipForward,
  QiRepeat,
} from "qingicon-vue";
import { catalog } from "../catalog";
defineProps<{ activate: (action: string, event: MouseEvent) => void }>();
const mode = ref("order"),
  paused = ref(true),
  empty = ref(true),
  needsAccess = ref(false);
const buttons = computed(() => [
  {
    action: "shuffle",
    id: "musicShuffle",
    icon: QiShuffle,
    label: "shuffle",
    pressed: mode.value === "shuffle",
  },
  { action: "previous", icon: QiSkipBack, label: "previous" },
  {
    action: "toggle",
    id: "musicPlay",
    icon: paused.value ? QiPlay : QiPause,
    label: paused.value ? "play" : "pause",
  },
  { action: "next", icon: QiSkipForward, label: "next" },
  {
    action: "repeat",
    id: "musicRepeat",
    icon: QiRepeat,
    label: ["one", "list"].includes(mode.value) ? mode.value : "order",
    pressed: ["one", "list"].includes(mode.value),
  },
]);
defineExpose({
  update(
    nextMode: string,
    isPaused: boolean,
    isEmpty: boolean,
    access: boolean,
  ) {
    mode.value = nextMode;
    paused.value = isPaused;
    empty.value = isEmpty;
    needsAccess.value = access;
  },
});
</script>
<template>
  <Button
    v-for="btn in buttons"
    :key="btn.action"
    :id="btn.id"
    type="button"
    :class="[
      'music-button',
      {
        'music-play': btn.action === 'toggle',
        'is-repeat-one': btn.action === 'repeat' && mode === 'one',
      },
    ]"
    :aria-label="catalog.t('media.music.' + btn.label)"
    :title="catalog.t('media.music.' + btn.label)"
    :aria-pressed="btn.pressed"
    :data-music-glyph="btn.action === 'toggle' ? btn.label : btn.action"
    :disabled="empty || (btn.pressed === undefined && needsAccess)"
    @click="activate(btn.action, $event)"
    ><span class="music-glyph" aria-hidden="true"
      ><component :is="btn.icon" /></span
  ></Button>
</template>
