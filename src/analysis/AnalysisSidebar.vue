<script setup lang="ts">
import { UiPanel } from "@hworktime/ui";
import { UiButton as Button } from "@hworktime/ui";
import { catalog } from "../catalog";
import { sidebar as view } from "./sidebar";
</script>
<template>
  <section
    id="analysisSidebar"
    class="analysis-sidebar"
    hidden
    aria-labelledby="analysisSidebarTitle"
  >
    <header class="analysis-sidebar-header">
      <p id="analysisSidebarMonth" class="calendar-today-number">
        {{ view?.month }}
      </p>
      <h2 id="analysisSidebarTitle" class="calendar-today-weekday">
        {{ catalog.t("analysis.sidebarShortTitle") }}
      </h2>
    </header>
    <UiPanel as="section" class="analysis-sidebar-section">
      <h3>{{ catalog.t("analysis.sidebarObservation") }}</h3>
      <p id="analysisObservation" class="analysis-observation">
        {{ view?.observation }}
      </p>
      <p id="analysisObservationContext" class="analysis-sidebar-muted">
        {{ view?.context }}
      </p>
    </UiPanel>
    <UiPanel as="section" class="analysis-sidebar-section">
      <h3>{{ catalog.t("analysis.sidebarFocus") }}</h3>
      <div
        id="analysisFocusDates"
        class="analysis-focus-dates"
        role="group"
        :aria-label="catalog.t('analysis.sidebarFocus')"
      >
        <Button
          v-for="choice in view?.choices"
          :key="choice.date"
          class="ui-button"
          type="button"
          :data-analysis-focus="choice.date"
          :aria-pressed="choice.date === view?.pinned"
          :label="choice.label"
        />
      </div>
      <div
        id="analysisFocusDetail"
        class="analysis-focus-detail"
        :aria-live="view?.live || 'polite'"
        aria-atomic="true"
      >
        <template v-if="view?.focus">
          <div class="analysis-focus-heading">
            <strong>{{ view.focus.title }}</strong
            ><span>{{ view.focus.kind }}</span>
          </div>
          <div class="analysis-focus-times">
            <template v-for="(time, i) in view.focus.times" :key="i"
              ><span v-if="i" aria-hidden="true">→</span
              ><strong
                ><small v-if="time.next">{{
                  catalog.t("analysis.nextDay")
                }}</small
                >{{ time.clock }}</strong
              ></template
            >
          </div>
          <div
            v-for="row in view.focus.rows"
            :key="row.label"
            class="analysis-sidebar-row"
          >
            <span>{{ row.label }}</span
            ><strong>{{ row.value }}</strong>
          </div>
          <p class="analysis-sidebar-muted analysis-focus-source">
            {{ view.focus.source }}
          </p></template
        ><template v-else>{{ catalog.t("analysis.sidebarNoFocus") }}</template>
      </div>
    </UiPanel>
    <UiPanel as="section" class="analysis-sidebar-section">
      <h3>{{ catalog.t("analysis.sidebarScope") }}</h3>
      <div id="analysisSidebarScope" class="analysis-sidebar-scope">
        <div
          v-for="row in view?.scope"
          :key="row.label"
          class="analysis-sidebar-row"
        >
          <span>{{ row.label }}</span
          ><strong>{{ row.value }}</strong>
        </div>
        <p class="analysis-sidebar-muted">{{ view?.comparison }}</p>
      </div>
    </UiPanel>
  </section>
</template>
