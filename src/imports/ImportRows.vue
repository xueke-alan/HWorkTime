<script setup lang="ts">
import { UiSelect as Select } from "@hworktime/ui";
import { computed } from "vue";
import { catalog } from "../catalog";
import { records } from "./records";
const choices = computed(() =>
  ["new", "old"].map((value) => ({ value, label: catalog.t("oa." + value) })),
);
</script>
<template>
  <div id="importRows" class="import-parsed-list">
    <article v-for="(r, i) in records.rows" :key="r.date + '-' + i">
      <strong>{{ r.date.replaceAll("-", "/") }}</strong
      ><span>{{ r.time }}</span
      ><span class="import-record-anomaly">{{ r.anomaly }}</span
      ><template v-if="r.conflict"
        ><div class="conflict">{{ r.conflict }}</div>
        <Select
          :data-conflict="i"
          :model-value="records.choices[i] || 'new'"
          :options="choices"
          option-value="value"
          option-label="label"
          :aria-label="catalog.t('oa.conflict', { date: r.date })"
          @update:model-value="(value) => (records.choices[i] = value)"
      /></template>
      <div v-if="r.manual" class="muted">{{ catalog.t("oa.manual") }}</div>
    </article>
  </div>
</template>
