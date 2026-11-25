<script setup lang="ts">
import { ref } from "vue";
import Button from "primevue/button";
import { QiChevronLeft, QiLibrary, QiSidebarLeftOpen } from "qingicon-vue";
import { catalog } from "../catalog";
defineProps<{ activate: (id: string) => void }>();
const reading = ref(false),
  narrow = ref(false),
  visible = ref(false),
  controls = ref(""),
  book = ref("");
defineExpose({
  update(
    isReading: boolean,
    isNarrow: boolean,
    isVisible: boolean,
    controlled: string,
    name: string,
  ) {
    reading.value = isReading;
    narrow.value = isNarrow;
    visible.value = isVisible;
    controls.value = controlled;
    book.value = name;
  },
});
</script>
<template>
  <Button
    id="readerExit"
    class="reader-button reader-icon-button"
    type="button"
    :title="catalog.t('copy.11d0241540')"
    :aria-label="catalog.t('copy.11d0241540')"
    @click="activate('exit')"
    ><QiChevronLeft class="ui-icon" aria-hidden="true"
  /></Button>
  <Button
    id="readerSidebarToggle"
    class="reader-button reader-icon-button"
    type="button"
    :hidden="!reading && !narrow"
    :aria-expanded="visible"
    :aria-controls="controls"
    :title="catalog.t('media.reader.sidebar')"
    :aria-label="catalog.t('media.reader.sidebar')"
    @click="activate('sidebar')"
    ><span class="reader-glyph"><QiSidebarLeftOpen aria-hidden="true" /></span
    ><span class="reader-button-label">{{
      catalog.t("media.reader.sidebar")
    }}</span></Button
  >
  <h2 id="readerTitle" class="reader-title">
    {{ catalog.t("media.reader.title") }}
  </h2>
  <span class="reader-book-title">{{ book }}</span>
  <Button
    id="readerShelf"
    class="reader-button reader-icon-button"
    type="button"
    :hidden="!reading"
    :title="catalog.t('media.reader.shelf')"
    :aria-label="catalog.t('media.reader.shelf')"
    @click="activate('shelf')"
    ><span class="reader-glyph"><QiLibrary aria-hidden="true" /></span
    ><span class="reader-button-label">{{
      catalog.t("media.reader.shelf")
    }}</span></Button
  >
</template>
