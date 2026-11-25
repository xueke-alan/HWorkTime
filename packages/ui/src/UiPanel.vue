<script setup lang="ts">
withDefaults(defineProps<{ as?: "section" | "aside" | "div" | "article" }>(), {
  as: "section",
});
</script>
<template>
  <component :is="as" data-ui="panel"><slot /></component>
</template>
