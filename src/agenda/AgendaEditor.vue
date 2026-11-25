<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { catalog } from "../catalog";
import {
  UiTextarea as Textarea,
  UiSelect as Select,
  UiButton as Button,
} from "@hworktime/ui";
import { QiChevronDown } from "qingicon-vue";
import type { EditorOptions, Status } from "./mount";
const props = defineProps<
  EditorOptions & { view: { editing: boolean; busy: boolean; locked: boolean } }
>();
const scheduleHost = ref<HTMLElement>();
onMounted(() => scheduleHost.value!.append(props.schedule));
const t = (key: string) => catalog.t("agenda." + key);
const labels: Record<Status, string> = {
  pending: "statusPending",
  completed: "statusCompleted",
  "in-progress": "statusInProgress",
  cancelled: "statusCancelled",
};
const options = computed(() =>
  (Object.keys(labels) as Status[]).map((value) => ({
    value,
    label: t(labels[value]),
  })),
);
function change<K extends keyof EditorOptions["draft"]>(
  key: K,
  value: EditorOptions["draft"][K],
) {
  const draft = props.draft;
  draft[key] = value;
  props.changed();
}
const saveLabel = computed(() =>
  t(props.view.editing ? "saveChanges" : "createItem"),
);
</script>
<template>
  <div class="agenda-field agenda-title-field">
    <label for="agendaTitle">{{ t("title") }}</label>
    <Textarea
      id="agendaTitle"
      :model-value="draft.title"
      rows="1"
      maxlength="120"
      required
      autocomplete="off"
      :placeholder="t('titlePlaceholder')"
      @update:model-value="change('title', $event ?? '')"
    />
  </div>
  <div class="agenda-properties">
    <div class="agenda-field agenda-status-field">
      <label id="agendaItemStatusLabel" for="agendaItemStatus">{{
        t("status")
      }}</label>
      <div class="agenda-status-input" :data-status="draft.status">
        <span class="agenda-status-dot" aria-hidden="true"></span>
        <Select
          input-id="agendaItemStatus"
          aria-labelledby="agendaItemStatusLabel"
          :model-value="draft.status"
          :options="options"
          option-value="value"
          option-label="label"
          :disabled="view.locked"
          @update:model-value="change('status', $event)"
        >
          <template #dropdownicon
            ><QiChevronDown :size="16" aria-hidden="true"
          /></template>
        </Select>
      </div>
    </div>
    <div ref="scheduleHost"></div>
  </div>
  <div class="agenda-field agenda-note-field">
    <label for="agendaNote">{{ t("note") }}</label>
    <Textarea
      id="agendaNote"
      :model-value="draft.note"
      rows="3"
      maxlength="5000"
      :placeholder="t('notePlaceholder')"
      @update:model-value="change('note', $event ?? '')"
    />
  </div>
  <Teleport :to="footer">
    <Button
      id="agendaCancel"
      type="button"
      class="ui-button"
      severity="secondary"
      :disabled="view.busy"
      :label="t('cancel')"
      @click="cancel"
    />
    <Button
      id="agendaSave"
      form="agendaForm"
      type="submit"
      class="ui-button primary"
      :disabled="view.locked || !draft.title.trim()"
      aria-keyshortcuts="Control+Enter Meta+Enter"
      :title="saveLabel + ' (Ctrl/⌘ + Enter)'"
      :label="saveLabel"
    />
  </Teleport>
</template>
