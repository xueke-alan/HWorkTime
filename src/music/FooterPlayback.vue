<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import Button from "primevue/button";
import { QiSkipBack, QiSkipForward, QiPause, QiPlay } from "qingicon-vue";
import { catalog } from "../catalog";
import type { PlaybackSnapshot, PlaybackAction } from "./playback";
defineProps<{ action: (action: PlaybackAction) => void }>();
const visible = ref(false),
  title = ref(""),
  paused = ref(true),
  disabled = ref(false);
const name = ref<HTMLElement>(),
  original = ref<HTMLElement>(),
  track = ref<HTMLElement>();
const buttons = computed(() => [
  { action: "previous" as const, glyph: "previous", icon: QiSkipBack },
  {
    action: "toggle" as const,
    glyph: paused.value ? "play" : "pause",
    icon: paused.value ? QiPlay : QiPause,
  },
  { action: "next" as const, glyph: "next", icon: QiSkipForward },
]);
let signature = "",
  frame: number | null = null,
  animation: Animation | null = null,
  observer: ResizeObserver;
function measure() {
  frame = null;
  if (!visible.value || !name.value!.clientWidth) {
    animation?.cancel();
    animation = null;
    signature = "";
    return;
  }
  const scrolling =
    original.value!.getBoundingClientRect().width >
      name.value!.clientWidth + 1 &&
    document.documentElement.dataset.reducedMotion !== "true";
  const distance = original.value!.getBoundingClientRect().width + 24;
  const next = `${title.value}|${name.value!.clientWidth}|${distance}|${scrolling}`;
  if (signature === next) return;
  signature = next;
  animation?.cancel();
  animation = null;
  name.value!.classList.remove("is-scrolling");
  if (scrolling && typeof track.value!.animate === "function") {
    const duration = distance / 24 + 1;
    name.value!.classList.add("is-scrolling");
    try {
      animation = track.value!.animate(
        [
          { transform: "translateX(0)", offset: 0 },
          { transform: "translateX(0)", offset: 1 / duration },
          { transform: `translateX(${-distance}px)`, offset: 1 },
        ],
        {
          duration: duration * 1000,
          iterations: Infinity,
          easing: "linear",
        },
      );
    } catch {
      name.value!.classList.remove("is-scrolling");
    }
  }
}
function scheduleMeasure() {
  if (frame === null) frame = requestAnimationFrame(measure);
}

onMounted(() => {
  observer = new ResizeObserver(scheduleMeasure);
  observer.observe(name.value!);
  document.addEventListener("worktime:motionchange", scheduleMeasure);
});
watch([title, visible], scheduleMeasure, { flush: "post" });
onBeforeUnmount(() => {
  observer.disconnect();
  if (frame !== null) cancelAnimationFrame(frame);
  animation?.cancel();
  document.removeEventListener("worktime:motionchange", scheduleMeasure);
});
defineExpose({
  refresh(state: PlaybackSnapshot | undefined, started: boolean) {
    visible.value = started && !!state?.current;
    title.value = state?.current?.title || state?.current?.name || "";
    paused.value = !!state?.paused;
    disabled.value = !state?.tracks.length || !!state.needsAccess;
  },
});
</script>
<template>
  <span
    class="site-music-controls"
    :hidden="!visible"
    role="group"
    :aria-label="catalog.t('media.music.title')"
  >
    <span ref="name" class="site-music-name" :title="title"
      ><span ref="track" class="site-music-name-track"
        ><span ref="original">{{ title }}</span
        ><span aria-hidden="true">{{ title }}</span></span
      ></span
    >
    <Button
      v-for="button in buttons"
      :key="button.action"
      type="button"
      class="site-music-button"
      :data-music-action="button.action"
      :data-glyph="button.glyph"
      :disabled="disabled"
      :title="catalog.t('media.music.' + button.glyph)"
      :aria-label="catalog.t('media.music.' + button.glyph)"
      @click="action(button.action)"
      ><component :is="button.icon" class="ui-icon" aria-hidden="true"
    /></Button>
    <svg class="site-audio-divider" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 4v8" />
    </svg>
  </span>
</template>
