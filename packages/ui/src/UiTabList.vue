<script setup lang="ts">
withDefaults(defineProps<{ as?: "div" | "nav" }>(), { as: "div" });
</script>
<template>
  <component :is="as" data-ui="tablist" role="tablist"><slot /></component>
</template>
