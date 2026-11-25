<script setup lang="ts">
import Button from "primevue/button";
import { QiDeleteTrash } from "qingicon-vue";
import { catalog } from "../catalog";
import { records } from "./records";
</script>
<template>
  <div id="importHistoryList">
    <article
      v-for="log in records.history"
      :key="log.id"
      class="import-history-item"
      :data-history-id="log.id"
    >
      <div class="row between">
        <h3>{{ log.when }}</h3>
        <div class="row">
          <Button
            type="button"
            class="ui-button"
            :data-view-import="log.id"
            :aria-label="catalog.t('oa.details')"
            :title="catalog.t('oa.details')"
            ><svg class="ui-icon" aria-hidden="true">
              <use href="#ms-info" /></svg></Button
          ><Button
            type="button"
            class="ui-button danger"
            :data-delete-import="log.id"
            :aria-label="catalog.t('oa.remove')"
            :title="catalog.t('oa.remove')"
            ><QiDeleteTrash class="ui-icon" aria-hidden="true"
          /></Button>
        </div>
      </div>
      <div class="import-history-meta">
        {{ log.range }} · {{ catalog.t("oa.records", { count: log.count }) }}
      </div>
    </article>
    <div v-if="!records.history.length" class="import-history-empty">
      {{ catalog.t("oa.empty") }}
    </div>
  </div>
</template>
