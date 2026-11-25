<script setup lang="ts" generic="T extends string">
defineProps<{ modelValue: T; value: T }>();
const emit = defineEmits<{ "update:modelValue": [value: T] }>();
</script>
<template>
  <input
    class="hw-check"
    type="radio"
    :value="value"
    :checked="modelValue === value"
    @change="emit('update:modelValue', value)"
  />
</template>
