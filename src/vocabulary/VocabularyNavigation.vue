<script setup lang="ts">
import { ref } from "vue";
import { UiButton as Button } from "@hworktime/ui";
import { QiBookOpen, QiBook, QiChartBar, QiSettings } from "qingicon-vue";
import { catalog } from "../catalog";
defineProps<{ navigate: (page: string) => void }>();
const pages = [
  { id: "learning", label: "navReview", icon: QiBookOpen },
  { id: "books", label: "navWords", icon: QiBook },
  { id: "analysis", label: "navStatistics", icon: QiChartBar },
  { id: "preferences", label: "navSettings", icon: QiSettings },
];
const current = ref("learning"),
  remaining = ref(0);
defineExpose({
  update(page: string, count: number) {
    current.value = page;
    remaining.value = count;
  },
});
</script>
<template>
  <Button
    v-for="page in pages"
    :key="page.id"
    class="vocabulary-nav-item"
    type="button"
    :data-page="page.id"
    :aria-current="current === page.id ? 'page' : 'false'"
    @click="navigate(page.id)"
  >
    <component :is="page.icon" aria-hidden="true" />
    <span>{{ catalog.t("vocabulary." + page.label) }}</span>
    <span
      v-if="page.id === 'learning'"
      class="vocabulary-review-badge"
      :aria-label="catalog.t('vocabulary.remaining') + ': ' + remaining"
      >{{ remaining }}</span
    >
  </Button>
</template>
