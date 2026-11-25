<script setup lang="ts">
withDefaults(defineProps<{ as?: "div" | "header" | "nav" }>(), { as: "div" });
</script>
<template>
  <component :is="as" data-ui="toolbar"><slot /></component>
</template>
