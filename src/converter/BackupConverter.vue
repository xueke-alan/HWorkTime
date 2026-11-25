<script setup lang="ts">
import { ref, onUnmounted } from "vue";
import Button from "primevue/button";
import Textarea from "primevue/textarea";
import FileUpload from "primevue/fileupload";
import { catalog } from "../catalog";
const input = ref(""),
  output = ref(""),
  status = ref("");
const { t } = catalog;
let generation = 0;
const downloads = WorkTimeApp.services.downloads.create({
  document,
  URL,
  Blob,
});
function reset() {
  ++generation;
  output.value = "";
  status.value = "";
}
async function select(event: { files: File[] }) {
  reset();
  const file = event.files[0],
    request = generation;
  if (!file) return;
  if (file.size > WorkTimeApp.services.backup.MAX_BYTES) {
    status.value = t("copy.9e4f8963f1");
    return;
  }
  try {
    const text = await file.text();
    if (request === generation) input.value = text;
  } catch (error) {
    if (request === generation)
      status.value = WorkTimeApp.i18n.message((error as Error).message);
  }
}
async function convert() {
  reset();
  const request = generation;
  try {
    const archive = await WorkTimeApp.services.backup.decode(
      input.value,
      WorkBackupConversion.convert,
    );
    if (request !== generation) return;
    output.value = JSON.stringify(archive, null, 2);
    status.value = t("converter.success", { count: archive.modules.length });
  } catch (error) {
    if (request === generation)
      status.value =
        t("copy.5793742753") +
        WorkTimeApp.i18n.message((error as Error).message);
  }
}
function download() {
  if (output.value)
    downloads.download(
      t("copy.7a6b07d795"),
      output.value,
      "application/json;charset=utf-8",
    );
}
onUnmounted(() => {
  ++generation;
  downloads.dispose();
});
</script>
<template>
  <h1>{{ t("copy.c55d0fcace") }}</h1>
  <p>{{ t("copy.3433eb0e22") }}</p>
  <FileUpload
    mode="basic"
    custom-upload
    auto
    :choose-label="t('copy.0981fe54f0')"
    accept=".json,.txt,application/json,text/plain"
    @select="select"
  />
  <label for="backupInput">{{ t("copy.8fe82e067d") }}</label>
  <Textarea
    id="backupInput"
    v-model="input"
    rows="8"
    spellcheck="false"
    @update:model-value="reset"
  />
  <Button id="convert" :label="t('copy.b0b46a9022')" @click="convert" />
  <p id="status" role="status" aria-live="polite">{{ status }}</p>
  <label for="backupOutput">{{ t("copy.d82ec67b65") }}</label
  ><Textarea
    id="backupOutput"
    :model-value="output"
    rows="8"
    readonly
    spellcheck="false"
  />
  <Button
    id="download"
    :disabled="!output"
    :label="t('copy.0ac86c668c')"
    @click="download"
  />
  <p>
    {{ t("copy.75a8a24ac8")
    }}<a href="../index.html">{{ t("copy.5cb9bad7c9") }}</a
    >{{ t("copy.18f4734a91") }}
  </p>
</template>
