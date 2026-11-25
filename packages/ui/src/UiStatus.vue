<script setup lang="ts">
withDefaults(defineProps<{ as?: "span" | "p" | "div" | "strong" }>(), {
  as: "p",
});
</script>
<template>
  <component :is="as" data-ui="status" role="status"><slot /></component>
</template>
