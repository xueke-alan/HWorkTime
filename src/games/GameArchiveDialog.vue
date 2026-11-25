<script setup lang="ts">
import { UiFileInput } from "@hworktime/ui";
import {
  UiButton as Button,
  UiDialog as Dialog,
  UiTextarea as Textarea,
  UiCheckbox as Checkbox,
} from "@hworktime/ui";
import { ref } from "vue";
import { catalog } from "../catalog";
import { archiveView as view } from "./archive";
const file = ref<HTMLInputElement>();
const t = (key: string) => catalog.t("gameArchive." + key);
function choose(e: Event) {
  const input = e.target as HTMLInputElement;
  const selected = input.files?.[0];
  input.value = "";
  if (selected) view.chooseFile?.(selected);
}
</script>
<template>
  <Dialog
    id="gameArchiveDialog"
    class="game-archive-dialog"
    :visible="view.open"
    :header="t('import')"
    :closable="false"
    :close-on-escape="!view.committing"
    @keydown.stop
    @update:visible="
      (v) => {
        if (!v) view.close?.();
      }
    "
  >
    <div class="game-archive-body">
      <label class="game-archive-input-label" for="gameArchiveText">{{
        t("paste")
      }}</label
      ><Textarea
        id="gameArchiveText"
        rows="3"
        :spellcheck="false"
        :model-value="view.input"
        :disabled="view.committing"
        @update:model-value="
          (v) => {
            view.input = v || '';
            view.edit?.();
          }
        "
      />
      <UiFileInput
        ref="file"
        type="file"
        hidden
        accept=".json,.txt,application/json,text/plain"
        @change="choose"
      />
      <div class="game-archive-actions">
        <Button
          class="ui-button"
          :label="t('file')"
          :disabled="view.committing"
          @click="file?.click()"
        /><Button
          class="ui-button"
          :label="t('preview')"
          :disabled="view.committing"
          @click="view.read?.(view.input)"
        /><Button
          class="ui-button"
          :label="t('before')"
          :disabled="view.committing"
          @click="view.download?.()"
        />
      </div>
      <p class="game-archive-error" role="alert">{{ view.error }}</p>
      <div class="game-archive-preview" :inert="view.committing">
        <template v-if="view.hasPreview"
          ><p class="game-archive-note">{{ t("mergeNote") }}</p>
          <ul class="game-archive-results">
            <li v-for="row in view.rows" :key="row.id" class="game-archive-row">
              <strong>{{ row.name }}</strong
              ><span class="game-archive-result" :data-status="row.status">{{
                row.result
              }}</span
              ><label v-if="row.conflict" class="game-archive-choice"
                ><Checkbox
                  :model-value="row.incoming"
                  :data-game-conflict="row.id"
                  :aria-label="row.name + ' · ' + t('incoming')"
                  @update:model-value="(v) => view.choice?.(row.id, !!v)"
                /><span>{{ t("incoming") }}</span></label
              >
            </li>
          </ul></template
        >
      </div>
    </div>
    <template #footer
      ><div class="game-archive-actions game-archive-footer">
        <Button
          class="ui-button"
          :label="t('cancel')"
          :disabled="view.committing"
          @click="view.close?.()"
        /><Button
          class="ui-button primary"
          :label="t('confirm')"
          :disabled="!view.rows.length || view.committing"
          @click="view.confirm?.()"
        /></div></template
  ></Dialog>
</template>
