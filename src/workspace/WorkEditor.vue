<script setup lang="ts">
import SettingsPane from "./SettingsPane.vue";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
</script>
<template>
  <aside class="panel editor">
    <div class="editor-content">
      <section
        id="yearAnalysisSidebar"
        class="year-analysis-sidebar"
        hidden
        aria-labelledby="yearAnalysisTitle"
      >
        <header class="year-analysis-header">
          <h2
            id="yearAnalysisTitle"
            class="editor-date"
            data-i18n-text='{"0":"yearView.report"}'
          >
            年度报告
          </h2>
        </header>
        <div id="yearAnalysisCards" class="year-analysis-cards"></div>
      </section>
      <section
        id="analysisSidebar"
        class="analysis-sidebar"
        hidden
        aria-labelledby="analysisSidebarTitle"
      >
        <header class="analysis-sidebar-header">
          <p id="analysisSidebarMonth" class="calendar-today-number"></p>
          <h2
            id="analysisSidebarTitle"
            class="calendar-today-weekday"
            data-i18n-text='{"0":"analysis.sidebarShortTitle"}'
          >
            作息
          </h2>
        </header>
        <section class="analysis-sidebar-section">
          <h3 data-i18n-text='{"0":"analysis.sidebarObservation"}'>本月观察</h3>
          <p id="analysisObservation" class="analysis-observation"></p>
          <p id="analysisObservationContext" class="analysis-sidebar-muted"></p>
        </section>
        <section class="analysis-sidebar-section">
          <h3 data-i18n-text='{"0":"analysis.sidebarFocus"}'>关注日期</h3>
          <div
            id="analysisFocusDates"
            class="analysis-focus-dates"
            role="group"
            data-i18n-aria-label="analysis.sidebarFocus"
            aria-label="关注日期"
          ></div>
          <div
            id="analysisFocusDetail"
            class="analysis-focus-detail"
            aria-live="polite"
            aria-atomic="true"
          ></div>
        </section>
        <section class="analysis-sidebar-section">
          <h3 data-i18n-text='{"0":"analysis.sidebarScope"}'>数据范围</h3>
          <div id="analysisSidebarScope" class="analysis-sidebar-scope"></div>
        </section>
      </section>
      <section
        id="batchBar"
        class="batch-editor editor-mode hidden"
        aria-label="批量填写"
        data-i18n-aria-label="copy.3f712eac83"
      >
        <div class="batch-editor-header editor-mode-header">
          <h2 data-i18n-text='{"0":"copy.3f712eac83"}'>批量填写</h2>
        </div>
        <form id="batchForm" class="batch-inline-form editor-mode-form">
          <div
            id="batchInputSection"
            class="batch-input-section"
            data-input-mode="direct"
          >
            <div class="two time-fields batch-time-fields editor-time-fields">
              <div class="field">
                <label for="batchStart" data-i18n-text='{"0":"copy.111190d5c0"}'
                  >上班打卡时间</label
                >
                <div class="time-entry is-blank">
                  <InputText
                    type="text"
                    class="clock-input"
                    inputmode="numeric"
                    maxlength="5"
                    autocomplete="off"
                    spellcheck="false"
                    id="batchStart"
                    required
                    placeholder="08:00"
                    title="例如 08:00"
                    data-i18n-title="copy.3cdcf38b5f"
                  />
                </div>
              </div>
              <div class="field" id="batchEndField">
                <label for="batchEnd" data-i18n-text='{"0":"copy.c3a416d554"}'
                  >下班打卡时间</label
                >
                <div class="time-entry is-blank">
                  <InputText
                    type="text"
                    class="clock-input"
                    inputmode="numeric"
                    maxlength="5"
                    autocomplete="off"
                    spellcheck="false"
                    id="batchEnd"
                    required
                    placeholder="17:30"
                    title="例如 17:30"
                    data-i18n-title="copy.b1da808151"
                  />
                </div>
              </div>
              <div id="batchOvertimeFields" class="field" hidden>
                <label
                  for="batchCalcOvertime"
                  data-i18n-text='{"0":"batch.dailyOvertime"}'
                  >每天加班 / 小时</label
                >
                <div class="time-entry">
                  <InputText
                    id="batchCalcOvertime"
                    type="number"
                    class="number-input"
                    min="0"
                    max="24"
                    step="0.5"
                    aria-describedby="batchCalcResult"
                  />
                </div>
              </div>
              <div class="nextday-control" id="batchNextField">
                <input type="checkbox" id="batchNext" class="hidden" /><Button
                  id="batchNextToggle"
                  class="ui-button nextday-toggle"
                  type="button"
                  aria-label="次日下班（跨午夜）"
                  aria-pressed="false"
                  data-hint="detail"
                  title="次日下班：跨午夜时开启"
                  data-i18n-title="copy.edc4600260"
                  data-i18n-aria-label="copy.905f84b1cb"
                  ><svg class="ui-icon" aria-hidden="true">
                    <use href="#ms-dark-mode" /></svg
                ></Button>
              </div>
            </div>
            <div class="batch-schedule-line">
              <p id="batchSchedule" class="day-schedule"></p>
              <p
                id="batchCalcResult"
                class="day-schedule"
                aria-live="polite"
              ></p>
            </div>
            <section
              class="time-template-area batch-template-area"
              aria-label="模板填写"
              data-i18n-aria-label="copy.a3aafbc510"
            >
              <div class="time-template-header">
                <h3
                  class="time-template-title"
                  data-i18n-text='{"0":"copy.a4de4da184"}'
                >
                  打卡模板
                </h3>
                <div class="template-header-actions">
                  <div
                    class="template-share-buttons"
                    role="group"
                    aria-label="分享与导入打卡模板"
                    data-i18n-aria-label="copy.1772e6394b"
                  >
                    <Button
                      id="batchShareTemplates"
                      class="ui-button icon-only"
                      type="button"
                      title="分享全部打卡模板"
                      aria-label="分享全部打卡模板"
                      data-i18n-title="copy.421587d4c1"
                      data-i18n-aria-label="copy.421587d4c1"
                      ><span class="template-share-icon-slot" aria-hidden="true"
                        ><svg class="ui-icon">
                          <use href="#ms-template-share" /></svg></span></Button
                    ><Button
                      id="batchImportTemplates"
                      class="ui-button icon-only"
                      type="button"
                      title="导入打卡模板"
                      aria-label="导入打卡模板"
                      aria-haspopup="dialog"
                      aria-controls="templateImportDialog"
                      data-i18n-title="copy.67d8959c5f"
                      data-i18n-aria-label="copy.67d8959c5f"
                      ><svg class="ui-icon" aria-hidden="true">
                        <use href="#ms-download" /></svg
                    ></Button>
                  </div>
                  <Button
                    id="batchAddTimeTemplate"
                    class="ui-button icon-only"
                    type="button"
                    aria-label="添加上下班时间模板"
                    title="添加模板"
                    data-i18n-aria-label="copy.5dee818996"
                    data-i18n-title="copy.026d50c271"
                    ><svg class="ui-icon" aria-hidden="true">
                      <use href="#ms-add" /></svg
                  ></Button>
                </div>
              </div>
              <div class="template-toolbar">
                <div
                  id="batchTimeTemplateList"
                  class="time-template-list"
                ></div>
              </div>
            </section>
          </div>
          <div class="editor-footer batch-footer">
            <div id="batchError" class="warnings" role="alert"></div>
            <div class="batch-toolbar">
              <div
                class="batch-selection-group batch-button-group"
                role="group"
                aria-label="选择日期"
                data-i18n-aria-label="batch.chooseDates"
              >
                <Button
                  id="batchAutoSelect"
                  class="ui-button subtle"
                  type="button"
                  data-i18n-title="batch.autoSelectHint"
                  title="选择本月所有可批量填写且信息不全的日期"
                  ><span
                    class="button-label"
                    data-i18n-text='{"0":"batch.selectMissing"}'
                    >选本月未填</span
                  ></Button
                ><Button
                  id="batchClearSelection"
                  class="ui-button subtle icon-only"
                  type="button"
                  aria-label="清空选择"
                  title="清空选择"
                  data-i18n-aria-label="batch.clearSelection"
                  data-i18n-title="batch.clearSelection"
                  ><svg class="ui-icon" aria-hidden="true">
                    <use href="#ms-close" /></svg
                ></Button>
              </div>
              <Button
                id="batchModeToggle"
                class="ui-button subtle batch-mode-toggle"
                type="button"
                aria-controls="batchInputSection"
                ><svg
                  class="ui-icon batch-mode-icon"
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="m7 3-4 4 4 4M3 7h17M17 13l4 4-4 4M21 17H4"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  /></svg
                ><span class="button-label">按加班时长</span></Button
              >
            </div>
            <div class="editor-actions day-action-row batch-editor-actions">
              <Button
                id="batchReset"
                class="ui-button subtle danger"
                type="button"
                title="删除所选日期的已填数据"
                aria-label="删除所选日期的已填数据"
                data-i18n-title="batch.clearSelectedAction"
                data-i18n-aria-label="batch.clearSelectedAction"
                ><svg class="ui-icon" aria-hidden="true">
                  <use href="#ms-delete-outline" /></svg
                ><span
                  class="button-label"
                  data-i18n-text='{"0":"batch.clearSelectedShort"}'
                  >删除所选</span
                ></Button
              ><Button class="ui-button" id="batchCancel" type="button"
                ><svg class="ui-icon" aria-hidden="true">
                  <use href="#ms-close" /></svg
                ><span
                  class="button-label"
                  data-i18n-text='{"0":"batch.cancelShort"}'
                  >取消</span
                ></Button
              ><Button id="batchSave" class="ui-button primary" type="submit"
                ><svg class="ui-icon" aria-hidden="true">
                  <use href="#ms-check" /></svg
                ><span
                  class="button-label"
                  data-i18n-text='{"0":"batch.saveShort"}'
                  >确认</span
                ></Button
              >
            </div>
            <section class="calc-preview editor-preview batch-preview-card">
              <strong
                id="batchSelectionCount"
                class="batch-selection-count"
                role="status"
                aria-live="polite"
                >已选 0 天</strong
              >
              <div
                id="batchPreviewStatus"
                class="batch-preview-status"
                role="status"
                aria-live="polite"
              ></div>
            </section>
          </div>
        </form>
      </section>
      <div id="dayEditor" class="editor-mode">
        <div class="editor-day-header editor-mode-header">
          <div id="editorDate" class="editor-date"></div>
        </div>
        <form id="dayForm" class="editor-mode-form">
          <div class="two time-fields editor-time-fields">
            <div class="field">
              <label for="dayStart" data-i18n-text='{"0":"copy.111190d5c0"}'
                >上班打卡时间</label
              >
              <div class="time-entry is-blank">
                <InputText
                  type="text"
                  class="clock-input"
                  inputmode="numeric"
                  maxlength="5"
                  autocomplete="off"
                  spellcheck="false"
                  id="dayStart"
                  placeholder="08:00"
                  title="例如 08:00"
                  data-i18n-title="copy.3cdcf38b5f"
                />
              </div>
            </div>
            <div class="field">
              <label for="dayEnd" data-i18n-text='{"0":"copy.c3a416d554"}'
                >下班打卡时间</label
              >
              <div class="time-entry is-blank">
                <InputText
                  type="text"
                  class="clock-input"
                  inputmode="numeric"
                  maxlength="5"
                  autocomplete="off"
                  spellcheck="false"
                  id="dayEnd"
                  placeholder="17:30"
                  title="例如 17:30"
                  data-i18n-title="copy.b1da808151"
                />
              </div>
            </div>
            <div class="nextday-control">
              <input type="checkbox" id="dayNext" class="hidden" /><Button
                id="dayNextToggle"
                class="ui-button nextday-toggle"
                type="button"
                aria-label="次日下班（跨午夜）"
                aria-pressed="false"
                data-hint="detail"
                title="次日下班：跨午夜时开启"
                data-i18n-title="copy.edc4600260"
                data-i18n-aria-label="copy.905f84b1cb"
                ><svg class="ui-icon" aria-hidden="true">
                  <use href="#ms-dark-mode" /></svg
              ></Button>
            </div>
          </div>
          <p
            id="daySchedule"
            class="day-schedule"
            aria-label="当前工时排班"
            data-i18n-aria-label="copy.139ee0e57d"
          ></p>
          <section
            class="time-template-area"
            aria-label="模板填写"
            data-i18n-aria-label="copy.a3aafbc510"
          >
            <div class="time-template-header">
              <h3
                class="time-template-title"
                data-i18n-text='{"0":"copy.a4de4da184"}'
              >
                打卡模板
              </h3>
              <div class="template-header-actions">
                <div
                  class="template-share-buttons"
                  role="group"
                  aria-label="分享与导入打卡模板"
                  data-i18n-aria-label="copy.1772e6394b"
                >
                  <Button
                    id="dayShareTemplates"
                    class="ui-button icon-only"
                    type="button"
                    title="分享全部打卡模板"
                    aria-label="分享全部打卡模板"
                    data-i18n-title="copy.421587d4c1"
                    data-i18n-aria-label="copy.421587d4c1"
                    ><span class="template-share-icon-slot" aria-hidden="true"
                      ><svg class="ui-icon">
                        <use href="#ms-template-share" /></svg></span></Button
                  ><Button
                    id="dayImportTemplates"
                    class="ui-button icon-only"
                    type="button"
                    title="导入打卡模板"
                    aria-label="导入打卡模板"
                    aria-haspopup="dialog"
                    aria-controls="templateImportDialog"
                    data-i18n-title="copy.67d8959c5f"
                    data-i18n-aria-label="copy.67d8959c5f"
                    ><svg class="ui-icon" aria-hidden="true">
                      <use href="#ms-download" /></svg
                  ></Button>
                </div>
                <Button
                  id="addTimeTemplate"
                  class="ui-button icon-only"
                  type="button"
                  aria-label="添加上下班时间模板"
                  title="添加模板"
                  data-i18n-aria-label="copy.5dee818996"
                  data-i18n-title="copy.026d50c271"
                  ><svg class="ui-icon" aria-hidden="true">
                    <use href="#ms-add" /></svg
                ></Button>
              </div>
            </div>
            <div class="template-toolbar">
              <div id="timeTemplateList" class="time-template-list"></div>
            </div>
          </section>

          <div id="dayError" class="warnings" role="alert"></div>
          <div class="editor-footer">
            <div class="editor-actions day-action-row">
              <div id="dayLeaveArea" class="leave-control">
                <Button
                  id="dayLeaveToggle"
                  class="ui-button leave-action-button"
                  type="button"
                  aria-label="填写请假时长"
                  aria-expanded="false"
                  aria-pressed="false"
                  aria-controls="dayLeavePanel"
                  data-i18n-aria-label="copy.c8dda684c7"
                  ><svg class="ui-icon" aria-hidden="true">
                    <use href="#ms-event-busy" /></svg
                  ><span
                    class="button-label"
                    id="dayLeaveLabel"
                    data-i18n-text='{"0":"copy.b847a1b638"}'
                    >请假</span
                  ></Button
                >
                <div
                  id="dayLeavePanel"
                  class="leave-inline hidden"
                  role="group"
                  aria-label="请假时长填写"
                  data-i18n-aria-label="copy.91981865eb"
                >
                  <div class="leave-inline-content">
                    <div class="leave-input-wrap">
                      <InputText
                        type="number"
                        class="number-input"
                        id="dayLeave"
                        min="0"
                        step="0.5"
                        aria-label="请假时长 / 小时"
                        aria-describedby="dayLeaveError"
                        data-i18n-aria-label="copy.e4d7defa2e"
                      /><span class="leave-inline-unit" aria-hidden="true"
                        >h</span
                      >
                    </div>
                    <Button
                      class="ui-button"
                      id="dayLeaveFull"
                      type="button"
                      aria-label="全天请假"
                      data-i18n-aria-label="copy.0c09c38655"
                      ><svg class="ui-icon" aria-hidden="true">
                        <use href="#ms-event-busy" /></svg
                      ><span
                        class="button-label"
                        data-i18n-text='{"0":"copy.79b62069f5"}'
                        >全天</span
                      ></Button
                    ><Button
                      class="ui-button"
                      id="dayLeaveDone"
                      type="button"
                      aria-label="提交请假时长"
                      data-i18n-aria-label="copy.6e985fed7d"
                      ><svg class="ui-icon" aria-hidden="true">
                        <use href="#ms-check" /></svg
                      ><span
                        class="button-label"
                        data-i18n-text='{"0":"copy.09cbc97ae2"}'
                        >提交</span
                      ></Button
                    >
                  </div>
                </div>
              </div>
              <div id="plannedOvertimeArea" class="planned-overtime hidden">
                <Button
                  class="ui-button"
                  id="plannedOvertimeToggle"
                  type="button"
                  aria-pressed="false"
                  ><svg class="ui-icon" aria-hidden="true">
                    <use href="#ms-today" /></svg
                  ><span
                    class="button-label"
                    data-i18n-text='{"0":"copy.3cf2307526"}'
                    >计划加班</span
                  ></Button
                >
              </div>
              <Button
                id="clearManual"
                type="button"
                class="ui-button subtle danger"
                title="清除当天手动工时、请假、备注和日期类型；保留 OA 原始记录及时间模板"
                aria-label="重置当天填写"
                data-i18n-title="copy.2bb2fc44a7"
                data-i18n-aria-label="copy.26490f361a"
                ><svg class="ui-icon" aria-hidden="true">
                  <use href="#ms-restore" /></svg
                ><span
                  class="button-label"
                  data-i18n-text='{"0":"copy.3d81345303"}'
                  >重置</span
                ></Button
              ><Button
                id="sourceOpen"
                type="button"
                class="ui-button subtle"
                aria-label="查看记录来源"
                title="查看记录来源"
                data-i18n-aria-label="copy.ebb94ef899"
                data-i18n-title="copy.ebb94ef899"
                ><svg class="ui-icon" aria-hidden="true">
                  <use href="#ms-info" /></svg
                ><span
                  class="button-label"
                  data-i18n-text='{"0":"copy.c63f79e636"}'
                  >来源</span
                ></Button
              >
            </div>
            <p
              id="dayLeaveError"
              class="warnings leave-inline-error"
              role="alert"
            ></p>
            <div
              id="dayPreview"
              class="calc-preview editor-preview"
              aria-live="polite"
            ></div>
          </div>
        </form>
      </div>
    </div>
    <SettingsPane />
    <div class="date-info-area">
      <section
        id="editorInfo"
        class="editor-info"
        role="tabpanel"
        aria-labelledby="date-tab-notifications"
      >
        <div
          id="feedbackList"
          class="feedback-list"
          role="status"
          aria-live="polite"
          aria-atomic="false"
        ></div>
        <div id="storageNotice" class="hidden" role="alert">
          <span id="storageNoticeText"></span>
          <div class="storage-recovery-actions">
            <Button class="ui-button" id="retryStorage" type="button"
              ><span
                class="button-label"
                data-i18n-text='{"0":"copy.4fab98659c"}'
                >重新检查</span
              ></Button
            ><Button
              class="ui-button"
              id="exportCorruptStorage"
              type="button"
              hidden
              ><span
                class="button-label"
                data-i18n-text='{"0":"copy.8e8c503a51"}'
                >导出无法读取的原始数据</span
              ></Button
            ><Button class="ui-button" id="restoreStorage" type="button" hidden
              ><span
                class="button-label"
                data-i18n-text='{"0":"copy.35a251c943"}'
                >恢复备份</span
              ></Button
            ><Button
              class="ui-button danger"
              id="initializeStorage"
              type="button"
              hidden
              ><span
                class="button-label"
                data-i18n-text='{"0":"copy.4e07c587e5"}'
                >初始化存档</span
              ></Button
            ><a
              class="ui-button"
              id="convertStorage"
              href="tools/convert-backup.html"
              target="_blank"
              rel="noopener"
              hidden
              data-i18n-text='{"0":"copy.3150220769"}'
              >打开备份转换工具</a
            >
          </div>
        </div>
        <div id="timeAnomalyNotice" class="hidden" role="alert"></div>
        <div id="oaStaleNotice" class="hidden" role="alert"></div>
        <div
          id="setupNotice"
          class="notice hidden"
          data-i18n-text='{"0":"copy.bc45d8544a"}'
        >
          请设置作息与休息时段。<Button class="ui-button" id="setupButton"
            ><span class="button-label" data-i18n-text='{"0":"copy.996681903f"}'
              >填写规则</span
            ></Button
          >
        </div>
        <div
          id="yearNotice"
          class="notice hidden"
          data-i18n-text='{"0":"copy.ac6fd9ce70"}'
        >
          本年无节假日数据，按周一至周五统计。
        </div>
        <div id="notificationEmpty" class="notification-empty hidden">
          <svg class="ui-icon" aria-hidden="true">
            <use href="#ms-notifications-off" /></svg
          ><span data-i18n-text='{"0":"copy.9f144d4667"}'>暂无通知或异常</span>
        </div>
      </section>
      <section
        id="dateInfoPanel"
        class="date-info-panel"
        hidden
        role="tabpanel"
        tabindex="0"
      ></section>
    </div>
    <div class="notification-tabs">
      <h2
        id="notificationsTitle"
        class="notification-tab"
        aria-label="通知"
        title="通知"
        data-i18n-aria-label="copy.7a66c0d036"
        data-i18n-title="copy.7a66c0d036"
      >
        <svg class="ui-icon" aria-hidden="true">
          <use href="#ms-notifications" />
        </svg>
      </h2>
    </div>
  </aside>
</template>
