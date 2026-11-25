<script setup lang="ts">
import { ref, watchEffect, useId } from "vue";
import Button from "./UiButton.vue";
const props = withDefaults(
  defineProps<{
    visible: boolean;
    header: string;
    closable?: boolean;
    closeOnEscape?: boolean;
    closeLabel?: string;
  }>(),
  { closable: true, closeOnEscape: true },
);
const emit = defineEmits<{ "update:visible": [visible: boolean] }>();
const dialog = ref<HTMLDialogElement>();
const title = useId();
watchEffect(
  () => {
    const el = dialog.value;
    if (!el) return;
    if (props.visible && !el.open) el.showModal();
    else if (!props.visible && el.open) el.close();
  },
  { flush: "post" },
);
</script>
<template>
  <dialog
    ref="dialog"
    class="hw-dialog"
    :aria-labelledby="title"
    @cancel.prevent="closeOnEscape && emit('update:visible', false)"
  >
    <header>
      <strong :id="title">{{ header }}</strong
      ><Button
        v-if="closable"
        :aria-label="closeLabel"
        @click="emit('update:visible', false)"
        >×</Button
      >
    </header>
    <slot v-if="visible" />
    <footer v-if="visible && $slots.footer"><slot name="footer" /></footer>
  </dialog>
</template>
