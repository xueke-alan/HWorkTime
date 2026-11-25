<script setup lang="ts">
defineProps<{ modelValue?: boolean }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();
</script>
<template>
  <input
    class="hw-check"
    type="checkbox"
    :checked="modelValue"
    @change="
      emit('update:modelValue', ($event.target as HTMLInputElement).checked)
    "
  />
</template>
