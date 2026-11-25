<script setup lang="ts">
import { ref } from "vue";
import Button from "./UiButton.vue";
defineProps<{ accept?: string; chooseLabel: string }>();
const emit = defineEmits<{ select: [event: { files: File[] }] }>();
const input = ref<HTMLInputElement>();
function choose() {
  const el = input.value!;
  const files = Array.from(el.files ?? []);
  el.value = "";
  if (files.length) emit("select", { files });
}
</script>
<template>
  <span
    ><Button :label="chooseLabel" @click="input?.click()" /><input
      ref="input"
      type="file"
      hidden
      :accept="accept"
      @change="choose"
  /></span>
</template>
