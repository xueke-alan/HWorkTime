<script setup lang="ts">
defineProps<{ modelValue?: string }>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();
</script>
<template>
  <textarea
    class="hw-field"
    :value="modelValue"
    @input="
      emit('update:modelValue', ($event.target as HTMLInputElement).value)
    "
  />
</template>
