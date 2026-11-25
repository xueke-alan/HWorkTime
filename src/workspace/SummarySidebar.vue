<script setup lang="ts">
import { UiPanel, UiDialogSurface, UiStatus } from "@hworktime/ui";
import ImportHistory from "../imports/ImportHistory.vue";
import ImportRows from "../imports/ImportRows.vue";
import { UiButton as Button, UiTextarea as Textarea } from "@hworktime/ui";
</script>
<template>
  <UiPanel
    as="aside"
    class="panel summary-sidebar"
    aria-label="工时概览"
    data-i18n-aria-label="copy.6bcc55abab"
  >
    <header class="sidebar-header">
      <div class="sidebar-brand">
        <h1>
          <span class="sidebar-brand-name">HWorkTime</span>
          <span aria-hidden="true">·</span>
          <span
            class="sidebar-brand-subtitle"
            data-i18n-title="copy.5754e634a8"
            data-i18n-text='{"0":"short.brand"}'
            >工时记录</span
          >
        </h1>
      </div>
      <div class="sidebar-actions">
        <Button
          id="importOpen"
          class="ui-button primary"
          type="button"
          aria-label="OA记录"
          title="打开 OA 导入"
          data-i18n-aria-label="copy.f80695ff47"
          data-i18n-title="copy.ed282645c7"
          ><span class="import-main"
            ><svg class="ui-icon" aria-hidden="true"><use href="#ms-add" /></svg
            ><span data-i18n-text='{"0":"copy.f80695ff47"}'>OA记录</span></span
          ></Button
        >
        <div
          class="import-secondary-actions"
          role="group"
          aria-label="OA快捷操作"
          data-i18n-aria-label="copy.194dc497b1"
        >
          <Button
            id="importOASite"
            class="ui-button primary"
            type="button"
            aria-label="打开 OA 网站并进入导入界面"
            title="打开 OA 网站并进入导入界面"
            data-i18n-aria-label="copy.bba6f511e6"
            data-i18n-title="copy.bba6f511e6"
            ><svg class="ui-icon" aria-hidden="true">
              <use href="#ms-open-in-new" /></svg
          ></Button>
        </div>
        <span class="sidebar-year-month" aria-hidden="true"
          ><span
            id="sidebarYearMonthText"
            class="sidebar-year-month-text"
            role="img"
            ><span
              class="sidebar-year-month-number sidebar-year-number"
              aria-hidden="true"
            ></span
            ><svg
              class="calendar-date-divider"
              viewBox="0 0 12 24"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M9 4 3 20"
                fill="none"
                stroke="currentColor"
                stroke-width="3.2"
                stroke-linecap="round"
              /></svg
            ><span
              class="sidebar-year-month-number sidebar-month-number"
              aria-hidden="true"
            ></span></span
        ></span>
      </div>
    </header>
    <hr class="summary-divider" aria-hidden="true" />
    <section
      id="cards"
      class="cards"
      aria-label="工时汇总"
      tabindex="0"
      data-i18n-aria-label="copy.370463779d"
    ></section>
    <UiPanel
      as="section"
      class="target-panel"
      aria-label="月度加班要求"
      data-i18n-aria-label="copy.ac05786a10"
    >
      <div class="target-copy">
        <h3
          data-i18n-title="copy.ac05786a10"
          data-i18n-text='{"0":"short.target"}'
        >
          月度加班要求
        </h3>
        <div id="targetValue" class="target-value">-<small>h</small></div>
        <div id="targetCounts" class="target-counts"></div>
      </div>
      <div class="target-divider" aria-hidden="true">
        <span
          ><svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            focusable="false"
          >
            <path d="M0 100 H65 C82.5 100 82.5 0 100 0" /></svg
        ></span>
      </div>
      <div class="target-metrics">
        <div id="targetResult" class="target-result" aria-live="polite"></div>
        <span id="targetTotalLabel" class="target-total-label">剩余合计</span
        ><span id="targetDailyLabel" hidden>平均每天</span>
        <div class="target-metric-values">
          <strong
            id="targetMetric"
            class="target-metric"
            aria-live="polite"
            aria-labelledby="targetTotalLabel"
            >—</strong
          ><strong
            id="targetDailyMetric"
            class="target-metric"
            aria-live="polite"
            aria-labelledby="targetDailyLabel"
            >—</strong
          >
        </div>
      </div>
    </UiPanel>
    <div class="sidebar-oa-workspace" hidden>
      <UiDialogSurface
        id="importDialog"
        aria-label="导入 OA 记录"
        class="sidebar-oa-pane"
        aria-modal="false"
        data-i18n-aria-label="copy.8e91ca9989"
      >
        <div class="dialog-body">
          <div class="import-input-grid">
            <Textarea
              id="pasteText"
              rows="6"
              aria-label="粘贴OA网站的考勤信息"
              placeholder="粘贴OA网站的考勤信息"
              data-i18n-aria-label="copy.4c7c6082dd"
              data-i18n-placeholder="copy.4c7c6082dd"
            ></Textarea
            ><UiStatus
              as="span"
              id="importClipboardNotice"
              class="import-clipboard-notice"
              hidden
              data-i18n-text='{"0":"import.clipboardAutofilled"}'
              >已自动填入剪切板记录</UiStatus
            ><Button
              id="pasteOAClipboard"
              class="ui-button icon-only import-paste-button"
              type="button"
              aria-label="粘贴剪贴板中的OA考勤信息"
              title="粘贴"
              data-i18n-aria-label="copy.6ca0a85066"
              data-i18n-title="copy.de7fb7d3cf"
              ><svg class="ui-icon" aria-hidden="true">
                <use href="#ms-content-paste-go" /></svg
            ></Button>
          </div>
          <div class="row dialog-section-spacing">
            <span id="importSummary" class="muted import-caption"
              >暂无解析</span
            >
          </div>
        </div>
        <div class="dialog-foot import-dialog-foot">
          <div class="import-footer-links">
            <Button
              class="ui-button"
              id="oaShortcut"
              type="button"
              title="OA系统"
              aria-label="OA系统，点击打开，按住两秒编辑链接"
              data-i18n-title="copy.17ee70762b"
              data-i18n-aria-label="copy.a6ba7e0e2c"
              ><span class="oa-icon-slot" aria-hidden="true"
                ><svg class="ui-icon oa-link-icon">
                  <use href="#ms-open-in-new" /></svg
                ><svg
                  class="oa-hold-icon"
                  viewBox="0 0 32 32"
                  aria-hidden="true"
                >
                  <circle class="hold-track" cx="16" cy="16" r="13" />
                  <circle
                    class="hold-progress"
                    cx="16"
                    cy="16"
                    r="13"
                    pathLength="100"
                  />
                  <use
                    class="oa-paperclip"
                    href="#ms-attach-file"
                    x="6"
                    y="6"
                    width="20"
                    height="20"
                    fill="currentColor"
                    stroke="none"
                  /></svg></span
              ><span
                class="button-label"
                data-i18n-text='{"0":"copy.17ee70762b"}'
                >OA系统</span
              ></Button
            >
          </div>
          <div class="import-footer-actions">
            <Button id="commitImport" class="ui-button primary" disabled
              ><svg class="ui-icon" aria-hidden="true">
                <use href="#ms-check" /></svg
              ><span
                class="button-label"
                data-i18n-text='{"0":"copy.de6433b70d"}'
                >确认导入</span
              ></Button
            >
          </div>
        </div>
        <section
          class="sidebar-import-history"
          aria-label="导入历史"
          data-i18n-aria-label="copy.dc71cd204d"
        >
          <div class="sidebar-history-heading">
            <h3 id="importResultsTitle">导入历史</h3>
            <span
              id="importHistoryCount"
              class="muted"
              aria-live="polite"
            ></span>
          </div>
          <div class="sidebar-history-scroll">
            <ImportHistory />
            <div id="importDetails" class="hidden">
              <div id="importWarnings" class="warnings" role="alert"></div>
              <div id="importTable" class="hidden">
                <ImportRows />
              </div>
            </div>
          </div>
        </section>
      </UiDialogSurface>

      <UiDialogSurface
        id="sourceDialog"
        class="sidebar-oa-pane"
        aria-modal="false"
      >
        <div class="dialog-head">
          <h2 data-i18n-text='{"0":"copy.d82c9100ca"}'>记录来源</h2>
          <Button
            class="ui-button"
            data-close="sourceDialog"
            aria-label="关闭"
            data-i18n-aria-label="copy.6c14bd7f6f"
            ><span class="button-label">×</span></Button
          >
        </div>
        <div id="sourceBody" class="dialog-body"></div>
        <div class="dialog-foot">
          <Button class="ui-button" data-close="sourceDialog"
            ><span class="button-label" data-i18n-text='{"0":"copy.6c14bd7f6f"}'
              >关闭</span
            ></Button
          >
        </div>
      </UiDialogSurface>
    </div>
  </UiPanel>
</template>
