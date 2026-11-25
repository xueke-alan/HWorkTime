<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    type?: "button" | "submit" | "reset";
    severity?: string;
    size?: "small" | "large";
  }>(),
  { type: "button" },
);
</script>
<template>
  <button
    class="hw-button"
    :type="type"
    :data-variant="severity"
    :data-size="size"
  >
    <slot>{{ label }}</slot>
  </button>
</template>
