<script setup lang="ts">
import { UiDialog as Dialog, UiButton as Button } from "@hworktime/ui";
import { catalog } from "../catalog";
import { restore, removal, confirmations } from "./confirmations";
const { t } = catalog;
</script>
<template>
  <Dialog
    id="restoreDialog"
    :visible="restore.visible"
    :header="t('copy.35a251c943')"
    :close-label="t('copy.6c14bd7f6f')"
    :closable="!restore.busy"
    :close-on-escape="!restore.busy"
    :style="{ width: 'min(34rem, calc(100vw - 2rem))' }"
    @update:visible="
      (value) => {
        if (!value) confirmations.close(restore);
      }
    "
  >
    <p id="restoreSummary">{{ restore.summary }}</p>
    <p id="restoreError" class="warnings" role="alert">{{ restore.error }}</p>
    <Button
      v-if="restore.showRetry"
      id="retryRestoreTheme"
      class="ui-button"
      :label="t('copy.00ecd909a7')"
      @click="restore.retry?.()"
    />
    <p class="help dialog-section-spacing">{{ t("copy.c7cd96dadb") }}</p>
    <p v-if="restore.corrupt" id="backupScopeNote" class="help">
      {{ t("copy.e2cced4b6b") }}
    </p>
    <div class="row restore-backup-actions">
      <Button
        id="backupBeforeRestore"
        class="ui-button"
        :disabled="restore.backupBusy"
        :aria-busy="restore.backupBusy"
        :label="t(restore.corrupt ? 'copy.4b5a44d0fd' : 'copy.02ffd2393f')"
        @click="restore.backup?.()"
      />
    </div>
    <template #footer
      ><Button
        class="ui-button"
        data-close="restoreDialog"
        :disabled="restore.busy"
        :label="t('copy.4d0b4688c7')"
        @click="confirmations.close(restore)" /><Button
        id="confirmRestore"
        class="ui-button primary"
        :disabled="restore.busy"
        :label="t('copy.a7acce0c26')"
        @click="restore.confirm?.()"
    /></template>
  </Dialog>
  <Dialog
    id="deleteImportDialog"
    :visible="removal.visible"
    :header="t('copy.31fcbd78ba')"
    :close-label="t('copy.6c14bd7f6f')"
    :closable="!removal.busy"
    :close-on-escape="!removal.busy"
    :style="{ width: 'min(34rem, calc(100vw - 2rem))' }"
    @update:visible="
      (value) => {
        if (!value) confirmations.close(removal);
      }
    "
  >
    <p id="deleteImportSummary">{{ removal.summary }}</p>
    <p class="help dialog-section-spacing">{{ t("copy.cdb66f2811") }}</p>
    <template #footer
      ><Button
        class="ui-button"
        data-close="deleteImportDialog"
        :disabled="removal.busy"
        :label="t('copy.4d0b4688c7')"
        @click="confirmations.close(removal)" /><Button
        id="confirmDeleteImport"
        class="ui-button danger"
        :disabled="removal.busy"
        :label="t('copy.3c06abe116')"
        @click="removal.confirm?.()"
    /></template>
  </Dialog>
</template>
