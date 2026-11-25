<script setup lang="ts">
import { ref, shallowRef } from "vue";
import Select from "primevue/select";
import { QiChevronDown } from "qingicon-vue";
const props = defineProps<{
  source: HTMLSelectElement;
  labelId: string;
  triggerClass: string;
}>();
const options = shallowRef<
  { value: string; label: string; disabled: boolean }[]
>([]);
const value = ref(""),
  disabled = ref(false);
const picker = ref<InstanceType<typeof Select>>();
function sync() {
  const native = props.source;
  const next = Array.from(native.options, (opt) => ({
    value: opt.value,
    label: opt.text,
    disabled: opt.disabled,
  }));
  if (
    next.length !== options.value.length ||
    next.some((item, i) => {
      const previous = options.value[i];
      return (
        item.value !== previous.value ||
        item.label !== previous.label ||
        item.disabled !== previous.disabled
      );
    })
  )
    options.value = next;
  value.value = native.value;
  disabled.value = native.disabled;
}
const emit = defineEmits<{ choose: [value: string] }>();
function choose(next: string) {
  value.value = next;
  emit("choose", next);
}
sync();
defineExpose({
  sync,
  close(focus = false) {
    picker.value?.hide(focus);
  },
});
</script>
<template>
  <Select
    ref="picker"
    :input-id="source.id + 'Trigger'"
    :aria-labelledby="labelId"
    :class="triggerClass"
    :options="options"
    :model-value="value"
    :disabled="disabled"
    option-value="value"
    option-label="label"
    option-disabled="disabled"
    @update:model-value="choose"
  >
    <template #dropdownicon><QiChevronDown aria-hidden="true" /></template>
  </Select>
</template>
