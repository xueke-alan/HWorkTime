<script setup lang="ts">
import { ref, type ObjectDirective } from "vue";
import { UiButton as Button } from "@hworktime/ui";
import { metrics } from "./metrics";
const expanded = ref(new Set<string>());
function toggle(key: string) {
  if (expanded.value.has(key)) expanded.value.delete(key);
  else expanded.value.add(key);
}
const vNumeric: ObjectDirective<HTMLElement, string> = {
  mounted(el, { value }) {
    metrics.value?.paint(el, value, 0);
  },
  updated(el, { value, oldValue }) {
    if (value !== oldValue) metrics.value?.paint(el, value, 0);
  },
};
</script>
<template>
  <div id="analysisMetrics" class="analysis-metrics">
    <section
      v-for="group in metrics?.groups"
      :key="group.key"
      :data-key="'group-' + group.key"
      :class="['analysis-metric-group', 'analysis-metric-group-' + group.key]"
      :title="group.description || undefined"
      :aria-description="group.description || undefined"
    >
      <h3>{{ group.title }}</h3>
      <div
        v-for="metric in group.items"
        :key="metric.key"
        class="analysis-metric"
        :data-key="metric.key"
      >
        <span :title="metric.title">{{ metric.label }}</span
        ><strong v-numeric="metric.numeric"></strong>
        <div class="analysis-metric-footer">
          <small>{{ metric.context }}</small>
          <div v-if="metric.dates.length > 1" class="analysis-date-disclosure">
            <Button
              type="button"
              :aria-label="metric.dateHint"
              :aria-controls="'metric-dates-' + metric.key"
              :aria-expanded="expanded.has(metric.key)"
              @click="toggle(metric.key)"
              >+{{ metric.dateCount }}</Button
            >
            <p
              :id="'metric-dates-' + metric.key"
              class="analysis-date-hint"
              :hidden="!expanded.has(metric.key)"
            >
              {{ metric.dates.join(" · ") }}
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
