import Card from "antd/es/card";
import Empty from "antd/es/empty";
import Input from "antd/es/input";
import { NumberField } from "./number-field";
import Button from "antd/es/button";
import { SidebarLayout, SidebarHeader } from "./SidebarLayout";
import AnalysisSidebar from "../analysis/AnalysisSidebar";
import SettingsPane from "./SettingsPane";
import YearReport from "./YearReport";

export default function WorkEditor() {
  return (
    <>
      <SidebarLayout
        functions={
          <>
            <div className="date-info-area">
              <section
                id="editorInfo"
                className="editor-info"
                role="tabpanel"
                aria-labelledby="date-tab-notifications"
              >
                <div
                  id="feedbackList"
                  className="feedback-list"
                  aria-live="polite"
                  aria-atomic="false"
                  data-ui="status"
                  role="status"
                ></div>
                <div id="storageNotice" className="hidden" role="alert">
                  <span id="storageNoticeText"></span>
                  <div className="storage-recovery-actions" data-ui="toolbar">
                    <Button
                      id="retryStorage"
                      htmlType="button"
                      className="hw-button ui-button"
                    >
                      <span
                        className="button-label"
                        data-i18n-text='{"0":"copy.4fab98659c"}'
                      >
                        重新检查
                      </span>
                    </Button>
                    <Button
                      id="exportCorruptStorage"
                      htmlType="button"
                      hidden
                      className="hw-button ui-button"
                    >
                      <span
                        className="button-label"
                        data-i18n-text='{"0":"copy.8e8c503a51"}'
                      >
                        导出无法读取的原始数据
                      </span>
                    </Button>
                    <Button
                      id="restoreStorage"
                      htmlType="button"
                      hidden
                      className="hw-button ui-button"
                    >
                      <span
                        className="button-label"
                        data-i18n-text='{"0":"copy.35a251c943"}'
                      >
                        恢复备份
                      </span>
                    </Button>
                    <Button
                      id="initializeStorage"
                      htmlType="button"
                      hidden
                      className="hw-button ui-button danger"
                    >
                      <span
                        className="button-label"
                        data-i18n-text='{"0":"copy.4e07c587e5"}'
                      >
                        初始化存档
                      </span>
                    </Button>
                    <a
                      className="ui-button"
                      id="convertStorage"
                      href="tools/convert-backup.html"
                      target="_blank"
                      rel="noopener"
                      hidden
                      data-i18n-text='{"0":"copy.3150220769"}'
                    >
                      打开备份转换工具
                    </a>
                  </div>
                </div>
                <div
                  id="timeAnomalyNotice"
                  className="hidden"
                  role="alert"
                ></div>
                <div id="oaStaleNotice" className="hidden" role="alert"></div>
                <div
                  id="setupNotice"
                  className="notice hidden"
                  data-i18n-text='{"0":"copy.bc45d8544a"}'
                >
                  请设置作息与休息时段。
                  <Button
                    id="setupButton"
                    className="hw-button ui-button"
                    htmlType="button"
                  >
                    <span
                      className="button-label"
                      data-i18n-text='{"0":"copy.996681903f"}'
                    >
                      填写规则
                    </span>
                  </Button>
                </div>
                <div
                  id="yearNotice"
                  className="notice hidden"
                  data-i18n-text='{"0":"copy.ac6fd9ce70"}'
                >
                  本年无节假日数据，按周一至周五统计。
                </div>
                <div
                  id="notificationEmpty"
                  className="notification-empty hidden"
                >
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <span data-i18n-text='{"0":"copy.9f144d4667"}'>
                        暂无通知或异常
                      </span>
                    }
                  />
                </div>
              </section>
              <section
                id="dateInfoPanel"
                className="date-info-panel"
                hidden
                role="tabpanel"
                tabIndex={0}
              ></section>
            </div>
            <div className="notification-tabs"></div>
          </>
        }
      >
        <div className="editor-content">
          <section
            id="yearAnalysisSidebar"
            className="year-analysis-sidebar"
            hidden
            aria-labelledby="yearAnalysisTitle"
          >
            <SidebarHeader className="year-analysis-header">
              <h2
                id="yearAnalysisTitle"
                className="editor-date"
                data-i18n-text='{"0":"yearView.report"}'
              >
                年度报告
              </h2>
            </SidebarHeader>
            <YearReport />
          </section>
          <AnalysisSidebar />
          <section
            id="batchBar"
            className="batch-editor editor-mode hidden"
            aria-label="批量填写"
            data-i18n-aria-label="copy.3f712eac83"
          >
            <SidebarHeader className="batch-editor-header editor-mode-header">
              <h2 data-i18n-text='{"0":"copy.3f712eac83"}'>批量填写</h2>
            </SidebarHeader>
            <form id="batchForm" className="batch-inline-form editor-mode-form">
              <div
                id="batchInputSection"
                className="batch-input-section"
                data-input-mode="direct"
              >
                <div className="two time-fields batch-time-fields editor-time-fields">
                  <div className="field" data-ui="field">
                    <label
                      htmlFor="batchStart"
                      data-i18n-text='{"0":"copy.111190d5c0"}'
                    >
                      上班打卡时间
                    </label>
                    <div className="time-entry is-blank">
                      <Input
                        id="batchStart"
                        required
                        placeholder="08:00"
                        data-hint-text="例如 08:00"
                        data-i18n-hint-text="copy.3cdcf38b5f"
                        className="clock-input hw-field"
                        inputMode="numeric"
                        maxLength={5}
                        autoComplete="off"
                        spellCheck={false}
                      />
                    </div>
                  </div>
                  <div id="batchEndField" className="field" data-ui="field">
                    <label
                      htmlFor="batchEnd"
                      data-i18n-text='{"0":"copy.c3a416d554"}'
                    >
                      下班打卡时间
                    </label>
                    <div className="time-entry is-blank">
                      <Input
                        id="batchEnd"
                        required
                        placeholder="17:30"
                        data-hint-text="例如 17:30"
                        data-i18n-hint-text="copy.b1da808151"
                        className="clock-input hw-field"
                        inputMode="numeric"
                        maxLength={5}
                        autoComplete="off"
                        spellCheck={false}
                      />
                    </div>
                  </div>
                  <div
                    id="batchOvertimeFields"
                    hidden
                    className="field"
                    data-ui="field"
                  >
                    <label
                      htmlFor="batchCalcOvertime"
                      data-i18n-text='{"0":"batch.dailyOvertime"}'
                    >
                      每天加班 / 小时
                    </label>
                    <div className="time-entry">
                      <NumberField
                        id="batchCalcOvertime"

                        min={0}
                        max={24}
                        step={0.5}
                        aria-describedby="batchCalcResult"
                        className="hw-field number-input"
                      />
                    </div>
                  </div>
                  <div className="nextday-control" id="batchNextField">
                    <input
                      type="checkbox"
                      id="batchNext"
                      className="hw-check hidden"
                    />
                    <Button
                      id="batchNextToggle"
                      htmlType="button"
                      aria-label="次日下班（跨午夜）"
                      aria-pressed="false"
                      data-hint="detail"
                      data-hint-text="次日下班：跨午夜时开启"
                      data-i18n-hint-text="copy.edc4600260"
                      data-i18n-aria-label="copy.905f84b1cb"
                      className="hw-button ui-button nextday-toggle"
                    >
                      <svg className="ui-icon" aria-hidden="true">
                        <use href="#icon-dark-mode" />
                      </svg>
                    </Button>
                  </div>
                </div>
                <div className="batch-schedule-line">
                  <p id="batchSchedule" className="day-schedule"></p>
                  <p
                    id="batchCalcResult"
                    className="day-schedule"
                    aria-live="polite"
                  ></p>
                </div>
                <section
                  className="time-template-area batch-template-area"
                  aria-label="模板填写"
                  data-i18n-aria-label="copy.a3aafbc510"
                >
                  <div className="time-template-header">
                    <h3
                      className="time-template-title"
                      data-i18n-text='{"0":"copy.a4de4da184"}'
                    >
                      打卡模板
                    </h3>
                    <div className="template-header-actions" data-ui="toolbar">
                      <div
                        className="template-share-buttons"
                        aria-label="分享与导入打卡模板"
                        data-i18n-aria-label="copy.1772e6394b"
                        data-ui="group"
                        role="group"
                      >
                        <Button
                          id="batchShareTemplates"
                          htmlType="button"
                          data-hint-text="分享全部打卡模板"
                          aria-label="分享全部打卡模板"
                          data-i18n-hint-text="copy.421587d4c1"
                          data-i18n-aria-label="copy.421587d4c1"
                          className="hw-button ui-button icon-only"
                        >
                          <span
                            className="template-share-icon-slot"
                            aria-hidden="true"
                          >
                            <svg className="ui-icon">
                              <use href="#icon-template-share" />
                            </svg>
                          </span>
                        </Button>
                        <Button
                          id="batchImportTemplates"
                          htmlType="button"
                          data-hint-text="导入打卡模板"
                          aria-label="导入打卡模板"
                          aria-haspopup="dialog"
                          aria-controls="templateImportDialog"
                          data-i18n-hint-text="copy.67d8959c5f"
                          data-i18n-aria-label="copy.67d8959c5f"
                          className="hw-button ui-button icon-only"
                        >
                          <svg className="ui-icon" aria-hidden="true">
                            <use href="#icon-download" />
                          </svg>
                        </Button>
                      </div>
                      <Button
                        id="batchAddTimeTemplate"
                        htmlType="button"
                        aria-label="添加上下班时间模板"
                        data-hint-text="添加模板"
                        data-i18n-aria-label="copy.5dee818996"
                        data-i18n-hint-text="copy.026d50c271"
                        className="hw-button ui-button icon-only"
                      >
                        <svg className="ui-icon" aria-hidden="true">
                          <use href="#icon-add" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                  <div className="template-toolbar" data-ui="toolbar">
                    <div
                      id="batchTimeTemplateList"
                      className="time-template-list"
                    ></div>
                  </div>
                </section>
              </div>
              <div className="editor-footer batch-footer">
                <div id="batchError" className="warnings" role="alert"></div>
                <div className="batch-toolbar" data-ui="toolbar">
                  <div
                    className="batch-selection-group batch-button-group"
                    aria-label="选择日期"
                    data-i18n-aria-label="batch.chooseDates"
                    data-ui="group"
                    role="group"
                  >
                    <Button
                      id="batchAutoSelect"
                      htmlType="button"
                      data-i18n-hint-text="batch.autoSelectHint"
                      data-hint-text="选择本月所有可批量填写且信息不全的日期"
                      className="hw-button ui-button subtle"
                    >
                      <span
                        className="button-label"
                        data-i18n-text='{"0":"batch.selectMissing"}'
                      >
                        选本月未填
                      </span>
                    </Button>
                    <Button
                      id="batchClearSelection"
                      htmlType="button"
                      aria-label="清空选择"
                      data-hint-text="清空选择"
                      data-i18n-aria-label="batch.clearSelection"
                      data-i18n-hint-text="batch.clearSelection"
                      className="hw-button ui-button subtle icon-only"
                    >
                      <svg className="ui-icon" aria-hidden="true">
                        <use href="#icon-close" />
                      </svg>
                    </Button>
                  </div>
                  <Button
                    id="batchModeToggle"
                    htmlType="button"
                    aria-controls="batchInputSection"
                    className="hw-button ui-button subtle batch-mode-toggle"
                  >
                    <svg className="ui-icon batch-mode-icon" aria-hidden="true">
                      <use href="#icon-arrows-left-right" />
                    </svg>
                    <span className="button-label">按加班时长</span>
                  </Button>
                </div>
                <div
                  className="editor-actions day-action-row batch-editor-actions"
                  data-ui="toolbar"
                >
                  <Button
                    id="batchReset"
                    htmlType="button"
                    data-hint-text="删除所选日期的已填数据"
                    aria-label="删除所选日期的已填数据"
                    data-i18n-hint-text="batch.clearSelectedAction"
                    data-i18n-aria-label="batch.clearSelectedAction"
                    className="hw-button ui-button subtle danger"
                  >
                    <svg className="ui-icon" aria-hidden="true">
                      <use href="#icon-delete-outline" />
                    </svg>
                    <span
                      className="button-label"
                      data-i18n-text='{"0":"batch.clearSelectedShort"}'
                    >
                      删除所选
                    </span>
                  </Button>
                  <Button
                    id="batchCancel"
                    htmlType="button"
                    className="hw-button ui-button"
                  >
                    <svg className="ui-icon" aria-hidden="true">
                      <use href="#icon-close" />
                    </svg>
                    <span
                      className="button-label"
                      data-i18n-text='{"0":"batch.cancelShort"}'
                    >
                      取消
                    </span>
                  </Button>
                  <Button
                    id="batchSave"
                    htmlType="submit"
                    className="hw-button ui-button primary"
                  >
                    <svg className="ui-icon" aria-hidden="true">
                      <use href="#icon-check" />
                    </svg>
                    <span
                      className="button-label"
                      data-i18n-text='{"0":"batch.saveShort"}'
                    >
                      确认
                    </span>
                  </Button>
                </div>
                <section className="calc-preview editor-preview batch-preview-card">
                  <strong
                    id="batchSelectionCount"
                    className="batch-selection-count"
                    aria-live="polite"
                    data-ui="status"
                    role="status"
                  >
                    已选 0 天
                  </strong>
                  <div
                    id="batchPreviewStatus"
                    className="batch-preview-status"
                    aria-live="polite"
                    data-ui="status"
                    role="status"
                  ></div>
                </section>
              </div>
            </form>
          </section>
          <div id="dayEditor" className="editor-mode">
            <SidebarHeader className="editor-day-header editor-mode-header">
              <div id="editorDate" className="editor-date"></div>
            </SidebarHeader>
            <form id="dayForm" className="editor-mode-form">
              <div className="two time-fields editor-time-fields">
                <div className="field" data-ui="field">
                  <label
                    htmlFor="dayStart"
                    data-i18n-text='{"0":"copy.111190d5c0"}'
                  >
                    上班打卡时间
                  </label>
                  <div className="time-entry is-blank">
                    <Input
                      id="dayStart"
                      placeholder="08:00"
                      data-hint-text="例如 08:00"
                      data-i18n-hint-text="copy.3cdcf38b5f"
                      className="clock-input hw-field"
                      inputMode="numeric"
                      maxLength={5}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                </div>
                <div className="field" data-ui="field">
                  <label
                    htmlFor="dayEnd"
                    data-i18n-text='{"0":"copy.c3a416d554"}'
                  >
                    下班打卡时间
                  </label>
                  <div className="time-entry is-blank">
                    <Input
                      id="dayEnd"
                      placeholder="17:30"
                      data-hint-text="例如 17:30"
                      data-i18n-hint-text="copy.b1da808151"
                      className="clock-input hw-field"
                      inputMode="numeric"
                      maxLength={5}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                </div>
                <div className="nextday-control">
                  <input
                    type="checkbox"
                    id="dayNext"
                    className="hw-check hidden"
                  />
                  <Button
                    id="dayNextToggle"
                    htmlType="button"
                    aria-label="次日下班（跨午夜）"
                    aria-pressed="false"
                    data-hint="detail"
                    data-hint-text="次日下班：跨午夜时开启"
                    data-i18n-hint-text="copy.edc4600260"
                    data-i18n-aria-label="copy.905f84b1cb"
                    className="hw-button ui-button nextday-toggle"
                  >
                    <svg className="ui-icon" aria-hidden="true">
                      <use href="#icon-dark-mode" />
                    </svg>
                  </Button>
                </div>
              </div>
              <p
                id="daySchedule"
                className="day-schedule"
                aria-label="当前工时排班"
                data-i18n-aria-label="copy.139ee0e57d"
              ></p>
              <section
                className="time-template-area"
                aria-label="模板填写"
                data-i18n-aria-label="copy.a3aafbc510"
              >
                <div className="time-template-header">
                  <h3
                    className="time-template-title"
                    data-i18n-text='{"0":"copy.a4de4da184"}'
                  >
                    打卡模板
                  </h3>
                  <div className="template-header-actions" data-ui="toolbar">
                    <div
                      className="template-share-buttons"
                      aria-label="分享与导入打卡模板"
                      data-i18n-aria-label="copy.1772e6394b"
                      data-ui="group"
                      role="group"
                    >
                      <Button
                        id="dayShareTemplates"
                        htmlType="button"
                        data-hint-text="分享全部打卡模板"
                        aria-label="分享全部打卡模板"
                        data-i18n-hint-text="copy.421587d4c1"
                        data-i18n-aria-label="copy.421587d4c1"
                        className="hw-button ui-button icon-only"
                      >
                        <span
                          className="template-share-icon-slot"
                          aria-hidden="true"
                        >
                          <svg className="ui-icon">
                            <use href="#icon-template-share" />
                          </svg>
                        </span>
                      </Button>
                      <Button
                        id="dayImportTemplates"
                        htmlType="button"
                        data-hint-text="导入打卡模板"
                        aria-label="导入打卡模板"
                        aria-haspopup="dialog"
                        aria-controls="templateImportDialog"
                        data-i18n-hint-text="copy.67d8959c5f"
                        data-i18n-aria-label="copy.67d8959c5f"
                        className="hw-button ui-button icon-only"
                      >
                        <svg className="ui-icon" aria-hidden="true">
                          <use href="#icon-download" />
                        </svg>
                      </Button>
                    </div>
                    <Button
                      id="addTimeTemplate"
                      htmlType="button"
                      aria-label="添加上下班时间模板"
                      data-hint-text="添加模板"
                      data-i18n-aria-label="copy.5dee818996"
                      data-i18n-hint-text="copy.026d50c271"
                      className="hw-button ui-button icon-only"
                    >
                      <svg className="ui-icon" aria-hidden="true">
                        <use href="#icon-add" />
                      </svg>
                    </Button>
                  </div>
                </div>
                <div className="template-toolbar" data-ui="toolbar">
                  <div
                    id="timeTemplateList"
                    className="time-template-list"
                  ></div>
                </div>
              </section>

              <div id="dayError" className="warnings" role="alert"></div>
              <div className="editor-footer">
                <div
                  className="editor-actions day-action-row"
                  data-ui="toolbar"
                >
                  <div id="dayLeaveArea" className="leave-control">
                    <Button
                      id="dayLeaveToggle"
                      htmlType="button"
                      aria-label="填写请假时长"
                      aria-expanded="false"
                      aria-pressed="false"
                      aria-controls="dayLeavePanel"
                      data-i18n-aria-label="copy.c8dda684c7"
                      className="hw-button ui-button leave-action-button"
                    >
                      <svg className="ui-icon" aria-hidden="true">
                        <use href="#icon-event-busy" />
                      </svg>
                      <span
                        className="button-label"
                        id="dayLeaveLabel"
                        data-i18n-text='{"0":"copy.b847a1b638"}'
                      >
                        请假
                      </span>
                    </Button>
                    <div
                      id="dayLeavePanel"
                      className="leave-inline hidden"
                      aria-label="请假时长填写"
                      data-i18n-aria-label="copy.91981865eb"
                      data-ui="group"
                      role="group"
                    >
                      <div className="leave-inline-content">
                        <div className="leave-input-wrap">
                          <NumberField
                            id="dayLeave"
                            min={0}
                            step={0.5}
                            aria-label="请假时长 / 小时"
                            aria-describedby="dayLeaveError"
                            data-i18n-aria-label="copy.e4d7defa2e"
                            className="hw-field number-input"
                          />
                          <span
                            className="leave-inline-unit"
                            aria-hidden="true"
                          >
                            h
                          </span>
                        </div>
                        <Button
                          id="dayLeaveFull"
                          htmlType="button"
                          aria-label="全天请假"
                          data-i18n-aria-label="copy.0c09c38655"
                          className="hw-button ui-button"
                        >
                          <svg className="ui-icon" aria-hidden="true">
                            <use href="#icon-event-busy" />
                          </svg>
                          <span
                            className="button-label"
                            data-i18n-text='{"0":"copy.79b62069f5"}'
                          >
                            全天
                          </span>
                        </Button>
                        <Button
                          id="dayLeaveDone"
                          htmlType="button"
                          aria-label="提交请假时长"
                          data-i18n-aria-label="copy.6e985fed7d"
                          className="hw-button ui-button"
                        >
                          <svg className="ui-icon" aria-hidden="true">
                            <use href="#icon-check" />
                          </svg>
                          <span
                            className="button-label"
                            data-i18n-text='{"0":"copy.09cbc97ae2"}'
                          >
                            提交
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div
                    id="plannedOvertimeArea"
                    className="planned-overtime hidden"
                  >
                    <Button
                      id="plannedOvertimeToggle"
                      htmlType="button"
                      aria-pressed="false"
                      className="hw-button ui-button"
                    >
                      <svg className="ui-icon" aria-hidden="true">
                        <use href="#icon-today" />
                      </svg>
                      <span
                        className="button-label"
                        data-i18n-text='{"0":"copy.3cf2307526"}'
                      >
                        计划加班
                      </span>
                    </Button>
                  </div>
                  <Button
                    id="clearManual"
                    htmlType="button"
                    data-hint-text="清除当天手动工时、请假、备注和日期类型；保留 OA 原始记录及时间模板"
                    aria-label="重置当天填写"
                    data-i18n-hint-text="copy.2bb2fc44a7"
                    data-i18n-aria-label="copy.26490f361a"
                    className="hw-button ui-button subtle danger"
                  >
                    <svg className="ui-icon" aria-hidden="true">
                      <use href="#icon-restore" />
                    </svg>
                    <span
                      className="button-label"
                      data-i18n-text='{"0":"copy.3d81345303"}'
                    >
                      重置
                    </span>
                  </Button>
                  <Button
                    id="sourceOpen"
                    htmlType="button"
                    aria-label="查看记录来源"
                    data-hint-text="查看记录来源"
                    data-i18n-aria-label="copy.ebb94ef899"
                    data-i18n-hint-text="copy.ebb94ef899"
                    className="hw-button ui-button subtle"
                  >
                    <svg className="ui-icon" aria-hidden="true">
                      <use href="#icon-info" />
                    </svg>
                    <span
                      className="button-label"
                      data-i18n-text='{"0":"copy.c63f79e636"}'
                    >
                      来源
                    </span>
                  </Button>
                </div>
                <p
                  id="dayLeaveError"
                  className="warnings leave-inline-error"
                  role="alert"
                ></p>
                <Card
                  id="dayPreview"
                  size="small"
                  className="calc-preview editor-preview"
                  aria-live="polite"
                >
                  <div id="dayPreviewBody" />
                </Card>
              </div>
            </form>
          </div>
        </div>
        <SettingsPane />
      </SidebarLayout>
    </>
  );
}
