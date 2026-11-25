<script setup lang="ts">
import { ref, nextTick } from "vue";
import Button from "primevue/button";
import { catalog } from "../catalog";
export interface ToolEntry {
  id: string;
  trigger: string;
  label: string;
  description: string;
  development: boolean;
}
defineProps<{
  entries: ToolEntry[];
  open: (id: string) => void;
  back: () => void;
}>();
const active = ref("tools"),
  development = ref(false);
defineExpose({
  refresh(tab: string, dev: boolean) {
    active.value = tab;
    development.value = dev;
  },
  focus(id: string) {
    nextTick(() => document.getElementById(id)?.focus({ preventScroll: true }));
  },
});
</script>
<template>
  <Button
    type="button"
    class="ui-text-action tools-back"
    :hidden="active === 'tools' || active === 'vocabulary'"
    :label="catalog.t('tools.back')"
    @click="back"
  />
  <div class="tools-cards" :hidden="active !== 'tools'">
    <Button
      v-for="entry in entries"
      :key="entry.id"
      type="button"
      :id="entry.trigger"
      class="tool-card"
      :hidden="entry.development && !development"
      :title="catalog.t(entry.description)"
      @click="open(entry.id)"
    >
      <svg
        v-if="entry.id === 'reader'"
        class="tool-logo"
        viewBox="0 0 80 80"
        aria-hidden="true"
        focusable="false"
      >
        <rect width="80" height="80" rx="18" fill="#f1e8da" />
        <path d="M18 21h19c4 0 7 2 7 5v34c-2-3-5-4-9-4H18z" fill="#ac754d" />
        <path d="M62 21H47c-4 0-7 2-7 5v34c2-3 5-4 9-4h13z" fill="#c38c61" />
        <path
          d="M24 29h8m-8 7h8m17-7h7m-7 7h7"
          stroke="#f8f2e8"
          stroke-width="2.5"
          stroke-linecap="round"
        />
        <path d="M50 21v23l4-3 4 3V21" fill="#697f70" />
      </svg>
      <svg
        v-if="entry.id === 'typing'"
        class="tool-logo"
        viewBox="0 0 80 80"
        aria-hidden="true"
        focusable="false"
      >
        <rect width="80" height="80" rx="18" fill="#e5edf5" />
        <path d="M15 24h50v35H15z" fill="#21568f" />
        <rect x="12" y="21" width="56" height="36" rx="7" fill="#f2f7fc" />
        <g fill="#527da9">
          <rect x="19" y="28" width="8" height="7" rx="2" />
          <rect x="31" y="28" width="8" height="7" rx="2" />
          <rect x="43" y="28" width="8" height="7" rx="2" />
          <rect x="55" y="28" width="6" height="7" rx="2" />
          <rect x="19" y="39" width="8" height="7" rx="2" />
          <rect x="31" y="39" width="8" height="7" rx="2" />
          <rect x="43" y="39" width="8" height="7" rx="2" />
        </g>
        <path d="M55 39h6v12H45v-5h10z" fill="#efa855" />
        <rect x="27" y="49" width="14" height="3" rx="1.5" fill="#a3bed7" />
        <path
          d="m26 65 5 4 7-7"
          fill="none"
          stroke="#c7e5f7"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <svg
        v-if="entry.id === 'vocabulary'"
        class="tool-logo"
        viewBox="0 0 80 80"
        aria-hidden="true"
        focusable="false"
      >
        <rect width="80" height="80" rx="18" fill="#e8eeeb" />
        <ellipse cx="40" cy="66" rx="27" ry="5" fill="#16856f" />
        <path
          d="M17 23c16 1 31-1 43-12 8 12 9 27 6 39-3 12-11 17-26 17-13 0-23-3-25-14-2-10 2-20-1-30z"
          fill="#303b39"
        />
        <ellipse cx="29" cy="37" rx="15" ry="15" fill="#fff" />
        <ellipse cx="53" cy="34" rx="15" ry="15" fill="#fff" />
        <circle cx="30" cy="37" r="4.6" fill="#303b39" />
        <circle cx="28.6" cy="35.3" r="1.5" fill="#fff" />
        <path
          d="m47 34 10-2"
          fill="none"
          stroke="#303b39"
          stroke-width="3"
          stroke-linecap="round"
        />
        <path d="m39 44 7 1-3 6z" fill="#dfb66b" />
        <g transform="translate(53.5 62) scale(1.4) translate(-53.5 -62)">
          <path
            d="M44 62c4-6 10-6 14-1l5-3v8l-5-3c-4 4-10 4-14-1z"
            fill="#c7e1d2"
          />
          <circle cx="49" cy="61" r="1" fill="#303b39" />
        </g>
      </svg>
      <svg
        v-if="entry.id === 'games'"
        class="tool-logo"
        viewBox="0 0 80 80"
        aria-hidden="true"
        focusable="false"
      >
        <rect width="80" height="80" rx="18" fill="#ece8f2" />
        <path d="m16 48 24-9 24 9v10l-24 9-24-9z" fill="#81739e" />
        <path d="m16 48 24-9 24 9-24 9z" fill="#a99abe" />
        <path
          d="M34 44V27"
          stroke="#706184"
          stroke-width="5"
          stroke-linecap="round"
        />
        <ellipse cx="34" cy="44" rx="7" ry="3" fill="#706184" />
        <circle cx="34" cy="24" r="9" fill="#81739e" />
        <path
          d="M29 23a5 5 0 0 1 4-4"
          fill="none"
          stroke="#bfb2d0"
          stroke-width="2"
          stroke-linecap="round"
        />
        <ellipse cx="51" cy="46" rx="5" ry="3" fill="#e6c095" />
      </svg>
      <svg
        v-if="entry.id === 'music'"
        class="tool-logo"
        viewBox="0 0 80 80"
        aria-hidden="true"
        focusable="false"
      >
        <rect width="80" height="80" rx="18" fill="#f2e6e9" />
        <path
          d="M43 23c0-2 2-3 4-2l13 7c1 1 2 2 1 4l-1 6-13-7v22c0 6-6 11-13 12-7 1-12-2-12-7s6-10 13-11c3 0 5 0 8 1z"
          fill="#a97887"
        />
      </svg>
      <strong>{{ catalog.t(entry.label) }}</strong
      ><span role="status"></span>
    </Button>
  </div>
</template>
