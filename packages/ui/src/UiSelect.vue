<script lang="ts">
let nextSelectId = 0;
</script>
<script
  setup
  lang="ts"
  generic="T extends Record<string, unknown>, K extends keyof T"
>
import { computed, ref, onBeforeUnmount } from "vue";
import { QiChevronDown } from "qingicon-vue";
defineOptions({ inheritAttrs: false });
const props = defineProps<{
  inputId?: string;
  options: readonly T[];
  optionValue: K;
  optionLabel: keyof T;
  optionDisabled?: keyof T;
  modelValue?: T[K];
  disabled?: boolean;
}>();
const emit = defineEmits<{ "update:modelValue": [value: T[K]] }>();
const id = "hw-options-" + ++nextSelectId;
const trigger = ref<HTMLButtonElement>(),
  list = ref<HTMLElement>();
const open = ref(false),
  active = ref(-1);
const selected = computed(() =>
  props.options.findIndex(
    (item) => item[props.optionValue] === props.modelValue,
  ),
);
function enabled(index: number) {
  const item = props.options[index];
  return !!item && !(props.optionDisabled && item[props.optionDisabled]);
}
function place() {
  if (!open.value || !trigger.value || !list.value) return;
  const rect = trigger.value.getBoundingClientRect(),
    el = list.value;
  el.style.width = Math.min(rect.width, innerWidth - 12) + "px";
  el.style.left =
    Math.max(6, Math.min(rect.left, innerWidth - el.offsetWidth - 6)) + "px";
  const below = innerHeight - rect.bottom - 6,
    above = rect.top - 6,
    down = below >= Math.min(el.scrollHeight, 240) || below >= above;
  el.style.maxHeight = Math.max(0, Math.min(300, down ? below : above)) + "px";
  el.style.top = (down ? rect.bottom : rect.top - el.offsetHeight) + "px";
}
function show() {
  if (props.disabled || open.value || !list.value) return;
  list.value.showPopover();
  open.value = true;
  active.value = enabled(selected.value)
    ? selected.value
    : props.options.findIndex((_, i) => enabled(i));
  place();
  window.addEventListener("resize", place);
  window.addEventListener("scroll", place, true);
}
function cleanup() {
  open.value = false;
  window.removeEventListener("resize", place);
  window.removeEventListener("scroll", place, true);
}
function hide(focus = false) {
  list.value?.hidePopover();
  cleanup();
  if (focus) trigger.value?.focus();
}
function choose(index: number) {
  if (enabled(index)) {
    emit("update:modelValue", props.options[index][props.optionValue]);
    hide(true);
  }
}
function key(event: KeyboardEvent) {
  if (event.key === "Tab") {
    hide();
    return;
  }
  if (
    !["ArrowDown", "ArrowUp", "Home", "End", "Escape", "Enter", " "].includes(
      event.key,
    )
  )
    return;
  if (event.key === "Escape" && !open.value) return;
  event.preventDefault();
  event.stopPropagation();
  if (event.key === "Escape") {
    hide(true);
    return;
  }
  if (!open.value) {
    show();
    return;
  }
  if (event.key === "Enter" || event.key === " ") {
    choose(active.value);
    return;
  }
  const indices = props.options.map((_, i) => i).filter(enabled);
  if (!indices.length) return;
  const pos = indices.indexOf(active.value);
  active.value =
    event.key === "Home"
      ? indices[0]
      : event.key === "End"
        ? indices[indices.length - 1]
        : indices[
            (pos + (event.key === "ArrowDown" ? 1 : -1) + indices.length) %
              indices.length
          ];
  list.value?.children[active.value]?.scrollIntoView({ block: "nearest" });
}
onBeforeUnmount(cleanup);
defineExpose({ hide });
</script>
<template>
  <button
    ref="trigger"
    v-bind="$attrs"
    :id="inputId ?? id + '-trigger'"
    type="button"
    class="hw-select"
    role="combobox"
    aria-haspopup="listbox"
    :aria-controls="id"
    :aria-expanded="open"
    :aria-activedescendant="open && active >= 0 ? id + '-' + active : undefined"
    :disabled="disabled"
    @keydown="key"
    @click="open ? hide() : show()"
  >
    <span>{{ selected >= 0 ? options[selected][optionLabel] : "" }}</span
    ><slot name="dropdownicon"
      ><QiChevronDown :size="16" aria-hidden="true"
    /></slot>
  </button>
  <div
    ref="list"
    :id="id"
    class="hw-options"
    role="listbox"
    popover="auto"
    :aria-labelledby="inputId ?? id + '-trigger'"
    @toggle="!list?.matches(':popover-open') && cleanup()"
  >
    <div
      v-for="(item, i) in options"
      :id="id + '-' + i"
      :key="String(item[optionValue])"
      role="option"
      :aria-selected="i === selected"
      :aria-disabled="!enabled(i)"
      :data-active="i === active"
      @pointermove="enabled(i) && (active = i)"
      @mousedown.prevent
      @click="choose(i)"
    >
      {{ item[optionLabel] }}
    </div>
  </div>
</template>
