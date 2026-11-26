import Button from "antd/es/button";
import { lazy, Suspense, useEffect, useState } from "react";
import { useReload, useRestore, useRemoval } from "../imports/confirmations";

const Confirmations = lazy(() => import("../imports/ImportConfirmations"));
function DeferredDialogs() {
  const backup = useRestore();
  const deletion = useRemoval();
  const reload = useReload();
  const visible = backup.visible || deletion.visible || !!reload.confirm;
  const [usedConfirmations, keepConfirmations] = useState(false);
  useEffect(() => {
    if (visible) keepConfirmations(true);
  }, [visible]);
  return (
    <Suspense fallback={null}>
      {(usedConfirmations || visible) && <Confirmations />}
    </Suspense>
  );
}

export default function WorkspaceDialogs() {
  return (
    <>
      <dialog
        id="templateImportDialog"
        aria-labelledby="templateImportTitle"
        data-ui="dialog"
      >
        <div className="dialog-head">
          <h2 id="templateImportTitle" data-i18n-text='{"0":"copy.67d8959c5f"}'>
            导入打卡模板
          </h2>
          <Button
            data-close="templateImportDialog"
            aria-label="关闭"
            data-i18n-aria-label="copy.6c14bd7f6f"
            className="hw-button ui-button"
            htmlType="button"
          >
            <svg className="ui-icon" aria-hidden="true">
              <use href="#icon-close" />
            </svg>
          </Button>
        </div>
        <div className="dialog-body">
          <section
            className="template-import-input"
            aria-labelledby="templateImportInputTitle"
          >
            <label
              id="templateImportInputTitle"
              htmlFor="templateImportText"
              data-i18n-text='{"0":"copy.b1515c0f17"}'
            >
              模板分享字符串
            </label>
            <textarea
              id="templateImportText"
              rows={4}
              placeholder="在此粘贴模板分享字符串"
              spellCheck="false"
              aria-describedby="templateImportError"
              data-i18n-placeholder="copy.18016bbf38"
              className="hw-field"
            ></textarea>
          </section>
          <section
            className="template-import-preview-pane"
            aria-labelledby="templateImportPreviewTitle"
          >
            <h3
              id="templateImportPreviewTitle"
              data-i18n-text='{"0":"copy.582848430f"}'
            >
              模板预览
            </h3>
            <div className="template-import-preview-scroll">
              <p
                className="template-import-empty"
                data-i18n-text='{"0":"copy.9081c55e12"}'
              >
                粘贴分享字符串后，将自动解析并显示模板。
              </p>
              <div id="templateImportPreview" aria-live="polite" hidden></div>
            </div>
          </section>
        </div>
        <div className="dialog-foot" data-ui="toolbar">
          <p id="templateImportError" className="warnings" role="alert"></p>
          <Button
            data-close="templateImportDialog"
            htmlType="button"
            className="hw-button ui-button"
          >
            <span
              className="button-label"
              data-i18n-text='{"0":"copy.4d0b4688c7"}'
            >
              取消
            </span>
          </Button>
          <Button
            id="parseTemplateImport"
            htmlType="button"
            className="hw-button ui-button"
          >
            <span
              className="button-label"
              data-i18n-text='{"0":"copy.8652f5287b"}'
            >
              解析预览
            </span>
          </Button>
          <Button
            id="confirmTemplateImport"
            htmlType="button"
            disabled
            className="hw-button ui-button primary"
          >
            <span
              className="button-label"
              data-i18n-text='{"0":"copy.c67472f3dc"}'
            >
              确认替换全部模板
            </span>
          </Button>
        </div>
      </dialog>
      <dialog
        id="templateShareDialog"
        aria-labelledby="templateShareTitle"
        data-ui="dialog"
      >
        <div className="dialog-head">
          <h2 id="templateShareTitle" data-i18n-text='{"0":"copy.46f1184935"}'>
            分享打卡模板
          </h2>
          <Button
            data-close="templateShareDialog"
            aria-label="关闭"
            data-i18n-aria-label="copy.6c14bd7f6f"
            className="hw-button ui-button"
            htmlType="button"
          >
            <svg className="ui-icon" aria-hidden="true">
              <use href="#icon-close" />
            </svg>
          </Button>
        </div>
        <div className="dialog-body">
          <p className="help" data-i18n-text='{"0":"copy.7f47fbd967"}'>
            自动复制失败，请选择下面的字符串后手动复制。
          </p>
          <label
            htmlFor="templateShareText"
            data-i18n-text='{"0":"copy.b1515c0f17"}'
          >
            模板分享字符串
          </label>
          <textarea
            id="templateShareText"
            rows={4}
            readOnly
            spellCheck="false"
            className="hw-field"
          ></textarea>
          <p id="templateShareError" className="warnings" role="alert"></p>
        </div>
        <div className="dialog-foot" data-ui="toolbar">
          <Button
            data-close="templateShareDialog"
            htmlType="button"
            className="hw-button ui-button"
          >
            <span
              className="button-label"
              data-i18n-text='{"0":"copy.6c14bd7f6f"}'
            >
              关闭
            </span>
          </Button>
          <Button
            id="selectTemplateShare"
            htmlType="button"
            className="hw-button ui-button"
          >
            <span
              className="button-label"
              data-i18n-text='{"0":"copy.195c162630"}'
            >
              全选字符串
            </span>
          </Button>
          <Button
            id="copyTemplateShare"
            htmlType="button"
            className="hw-button ui-button primary"
          >
            <span
              className="button-label"
              data-i18n-text='{"0":"copy.985e338473"}'
            >
              复制字符串
            </span>
          </Button>
        </div>
      </dialog>
      <dialog id="timeTemplateDialog" data-ui="dialog">
        <div className="dialog-head">
          <h2 id="timeTemplateTitle" data-i18n-text='{"0":"copy.b464e3690d"}'>
            新增时间模板
          </h2>
          <Button
            data-close="timeTemplateDialog"
            aria-label="关闭"
            data-i18n-aria-label="copy.6c14bd7f6f"
            className="hw-button ui-button"
            htmlType="button"
          >
            <svg className="ui-icon" aria-hidden="true">
              <use href="#icon-close" />
            </svg>
          </Button>
        </div>
        <form id="timeTemplateForm">
          <div className="dialog-body">
            <div className="field" data-ui="field">
              <label
                htmlFor="timeTemplateName"
                data-i18n-text='{"0":"copy.bbc511d06d"}'
              >
                模板名称
              </label>
              <input
                id="timeTemplateName"
                type="text"
                maxLength={30}
                required
                placeholder="例如：常规班、晚班"
                data-i18n-placeholder="copy.e777a0f094"
                className="hw-field"
              />
            </div>
            <div className="two template-time-fields">
              <div className="field" data-ui="field">
                <label
                  htmlFor="timeTemplateStart"
                  data-i18n-text='{"0":"copy.e5c8b63c01"}'
                >
                  上班时间
                </label>
                <input
                  id="timeTemplateStart"
                  pattern="(?:[01][0-9]|2[0-3]):[0-5][0-9]"
                  className="clock-input hw-field"
                  inputMode="numeric"
                  maxLength={5}
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
              <div className="field" data-ui="field">
                <label
                  htmlFor="timeTemplateEnd"
                  data-i18n-text='{"0":"copy.1242101486"}'
                >
                  下班时间
                </label>
                <input
                  id="timeTemplateEnd"
                  pattern="(?:[01][0-9]|2[0-3]):[0-5][0-9]"
                  className="clock-input hw-field"
                  inputMode="numeric"
                  maxLength={5}
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
              <div className="nextday-control">
                <input
                  id="timeTemplateNext"
                  type="checkbox"
                  className="hw-check hidden"
                />
                <Button
                  id="timeTemplateNextToggle"
                  htmlType="button"
                  aria-label="次日下班（跨午夜）"
                  data-hint-text="次日下班"
                  aria-pressed="false"
                  data-i18n-aria-label="copy.905f84b1cb"
                  data-i18n-hint-text="copy.889d4d1a2c"
                  className="hw-button ui-button nextday-toggle"
                >
                  <svg className="ui-icon" aria-hidden="true">
                    <use href="#icon-dark-mode" />
                  </svg>
                </Button>
              </div>
            </div>
            <div id="timeTemplateError" className="warnings" role="alert"></div>
          </div>
          <div className="dialog-foot" data-ui="toolbar">
            <Button
              id="deleteTimeTemplate"
              htmlType="button"
              className="hw-button ui-button danger hidden"
            >
              <span
                className="button-label"
                data-i18n-text='{"0":"copy.b31745bdff"}'
              >
                删除模板
              </span>
            </Button>
            <Button htmlType="submit" className="hw-button ui-button primary">
              <span
                className="button-label"
                data-i18n-text='{"0":"copy.fbfc58b501"}'
              >
                保存模板
              </span>
            </Button>
          </div>
        </form>
      </dialog>

      <dialog
        id="scheduleRangeDialog"
        aria-labelledby="scheduleRangeTitle"
        data-ui="dialog"
      >
        <div className="dialog-head">
          <h2 id="scheduleRangeTitle" data-i18n-text='{"0":"copy.073381b8eb"}'>
            应用作息
          </h2>
          <Button
            htmlType="button"
            data-close="scheduleRangeDialog"
            aria-label="关闭"
            data-i18n-aria-label="copy.6c14bd7f6f"
            className="hw-button ui-button"
          >
            <svg className="ui-icon" aria-hidden="true">
              <use href="#icon-close" />
            </svg>
          </Button>
        </div>
        <form id="scheduleRangeForm">
          <div className="dialog-body">
            <div className="schedule-range-fields">
              <div
                id="scheduleDraftSummary"
                className="schedule-draft-summary"
                aria-label="待应用的作息"
                data-i18n-aria-label="copy.61800cf5a4"
              ></div>
              <div className="field schedule-range-field">
                <label
                  id="scheduleRangeLabel"
                  htmlFor="scheduleRangeTrigger"
                  data-i18n-text='{"0":"copy.4aa9b5b102"}'
                >
                  应用范围
                </label>
                <div id="scheduleRangePicker" className="schedule-range-picker">
                  <select
                    defaultValue="future"
                    id="scheduleRangeChoice"
                    className="schedule-range-native"
                    tabIndex={-1}
                    aria-hidden="true"
                    data-ui="select"
                  >
                    <option
                      value="all"
                      data-i18n-text='{"0":"copy.bf76c37d03"}'
                    >
                      全部日期
                    </option>
                    <option
                      value="future"
                      data-i18n-text='{"0":"copy.15b829106b"}'
                    >
                      从今天起
                    </option>
                    <option
                      value="week"
                      data-i18n-text='{"0":"copy.9266e6b528"}'
                    >
                      今天起7个自然日
                    </option>
                    <option
                      value="month"
                      data-i18n-text='{"0":"copy.516037a809"}'
                    >
                      今天至本月末
                    </option>
                    <option
                      value="custom"
                      data-i18n-text='{"0":"copy.32981249bd"}'
                    >
                      自定义日期范围
                    </option>
                  </select>
                  <Button
                    id="scheduleRangeTrigger"
                    htmlType="button"
                    role="combobox"
                    aria-labelledby="scheduleRangeLabel scheduleRangeValue"
                    aria-haspopup="listbox"
                    aria-expanded="false"
                    aria-controls="scheduleRangeOptions"
                    className="hw-button ui-button"
                  >
                    <span
                      className="button-label"
                      id="scheduleRangeValue"
                      data-i18n-text='{"0":"copy.15b829106b"}'
                    >
                      从今天起
                    </span>
                    <svg
                      className="ui-icon schedule-range-chevron"
                      aria-hidden="true"
                    >
                      <use href="#icon-caret-down" />
                    </svg>
                  </Button>
                  <div
                    id="scheduleRangeOptions"
                    role="listbox"
                    aria-labelledby="scheduleRangeLabel"
                    hidden
                  ></div>
                </div>
              </div>
              <div id="scheduleCustomDates" className="two" hidden>
                <div className="field" data-ui="field">
                  <label
                    htmlFor="scheduleRangeStart"
                    data-i18n-text='{"0":"copy.1f29196891"}'
                  >
                    开始日期
                  </label>
                  <input
                    id="scheduleRangeStart"
                    min="1900-01-01"
                    max="9999-12-31"
                    className="hw-field"
                    type="date"
                  />
                </div>
                <div className="field" data-ui="field">
                  <label
                    htmlFor="scheduleRangeEnd"
                    data-i18n-text='{"0":"copy.f4b9b2b5de"}'
                  >
                    结束日期
                  </label>
                  <input
                    id="scheduleRangeEnd"
                    min="1900-01-01"
                    max="9999-12-31"
                    className="hw-field"
                    type="date"
                  />
                </div>
              </div>
              <label
                id="scheduleNoEndLabel"
                hidden
                data-i18n-text='{"0":"copy.f5cf573859"}'
              >
                <input
                  id="scheduleNoEnd"
                  type="checkbox"
                  className="hw-check"
                />
                持续生效，不设结束日期
              </label>
              <div className="schedule-range-note">
                <p id="scheduleRangeDescription" aria-live="polite"></p>
                <p className="help" data-i18n-text='{"0":"copy.c93512f2d8"}'>
                  范围内覆盖已有作息，范围外保留原安排。不会修改实际打卡及请假时长。
                </p>
              </div>
              <div
                id="scheduleRangeError"
                className="warnings"
                role="alert"
              ></div>
            </div>
            <section
              className="schedule-arrangements"
              aria-labelledby="scheduleListTitle"
            >
              <h3
                id="scheduleListTitle"
                data-i18n-text='{"0":"copy.0c9744ed6a"}'
              >
                作息安排
              </h3>
              <p className="help" data-i18n-text='{"0":"copy.6c8aa183ec"}'>
                选择卡片载入作息，再选择应用范围。基础作息用于未被日期区间覆盖的日期。
              </p>
              <div id="scheduleList"></div>
            </section>
          </div>
          <div className="dialog-foot" data-ui="toolbar">
            <Button
              htmlType="button"
              data-close="scheduleRangeDialog"
              className="hw-button ui-button"
            >
              <span
                className="button-label"
                data-i18n-text='{"0":"copy.4d0b4688c7"}'
              >
                取消
              </span>
            </Button>
            <Button htmlType="submit" className="hw-button ui-button primary">
              <span
                className="button-label"
                data-i18n-text='{"0":"copy.073381b8eb"}'
              >
                应用作息
              </span>
            </Button>
          </div>
        </form>
      </dialog>
      <dialog
        id="scheduleDraftDialog"
        aria-labelledby="scheduleDraftTitle"
        data-ui="dialog"
      >
        <div className="dialog-head">
          <h2 id="scheduleDraftTitle" data-i18n-text='{"0":"copy.c8c0111f42"}'>
            作息尚未应用
          </h2>
        </div>
        <div className="dialog-body">
          <p data-i18n-text='{"0":"copy.6b8331cd87"}'>
            是否先应用当前作息草稿？
          </p>
        </div>
        <div className="dialog-foot" data-ui="toolbar">
          <Button
            id="scheduleDraftContinue"
            htmlType="button"
            className="hw-button ui-button"
          >
            <span
              className="button-label"
              data-i18n-text='{"0":"copy.3a481bc764"}'
            >
              继续编辑
            </span>
          </Button>
          <Button
            id="scheduleDraftDiscard"
            htmlType="button"
            className="hw-button ui-button"
          >
            <span
              className="button-label"
              data-i18n-text='{"0":"copy.b8a81b7a9c"}'
            >
              放弃
            </span>
          </Button>
          <Button
            id="scheduleDraftApply"
            htmlType="button"
            className="hw-button ui-button primary"
          >
            <span
              className="button-label"
              data-i18n-text='{"0":"copy.4562024dde"}'
            >
              应用
            </span>
          </Button>
        </div>
      </dialog>
      <DeferredDialogs />
      <dialog id="oaLinkDialog" data-ui="dialog">
        <div className="dialog-head">
          <h2 data-i18n-text='{"0":"copy.150aff1e54"}'>OA系统链接</h2>
          <Button
            data-close="oaLinkDialog"
            aria-label="关闭"
            data-i18n-aria-label="copy.6c14bd7f6f"
            className="hw-button ui-button"
            htmlType="button"
          >
            <svg className="ui-icon" aria-hidden="true">
              <use href="#icon-close" />
            </svg>
          </Button>
        </div>
        <form id="oaLinkForm">
          <div className="dialog-body">
            <div className="field" data-ui="field">
              <label
                htmlFor="oaLinkInput"
                data-i18n-text='{"0":"copy.08678f1c4e"}'
              >
                OA 网页地址
              </label>
              <input
                id="oaLinkInput"
                type="url"
                required
                autoComplete="url"
                placeholder="https://oa.example.com"
                className="hw-field"
              />
            </div>
            <p id="oaLinkError" className="warnings" role="alert"></p>
          </div>
          <div className="dialog-foot" data-ui="toolbar">
            <Button
              data-close="oaLinkDialog"
              htmlType="button"
              className="hw-button ui-button"
            >
              <span
                className="button-label"
                data-i18n-text='{"0":"copy.4d0b4688c7"}'
              >
                取消
              </span>
            </Button>
            <Button htmlType="submit" className="hw-button ui-button primary">
              <span
                className="button-label"
                data-i18n-text='{"0":"copy.4c61b4be42"}'
              >
                保存链接
              </span>
            </Button>
          </div>
        </form>
      </dialog>
      <dialog id="initializeDialog" data-ui="dialog">
        <div className="dialog-head">
          <h2 data-i18n-text='{"0":"copy.4e07c587e5"}'>初始化存档</h2>
          <Button
            data-close="initializeDialog"
            aria-label="关闭"
            data-i18n-aria-label="copy.6c14bd7f6f"
            className="hw-button ui-button"
            htmlType="button"
          >
            <svg className="ui-icon" aria-hidden="true">
              <use href="#icon-close" />
            </svg>
          </Button>
        </div>
        <div className="dialog-body">
          <p data-i18n-text='{"0":"copy.84340d29f7"}'>
            初始化将放弃损坏的旧存档及当前页面临时修改，清空全部工作记录、导入历史、时间模板、作息安排和个人工作设置，恢复默认工作设置。保留当前页面主题。
          </p>
          <p className="help" data-i18n-text='{"0":"copy.5006e352ed"}'>
            此操作无法撤销。建议先导出原始数据，供后续排查或修复。
          </p>
          <Button
            id="exportBeforeInitialize"
            htmlType="button"
            className="hw-button ui-button"
          >
            <span
              className="button-label"
              data-i18n-text='{"0":"copy.8118ac63b6"}'
            >
              导出原始数据
            </span>
          </Button>
          <p id="initializeError" className="warnings" role="alert"></p>
        </div>
        <div className="dialog-foot" data-ui="toolbar">
          <Button
            data-close="initializeDialog"
            className="hw-button ui-button"
            htmlType="button"
          >
            <span
              className="button-label"
              data-i18n-text='{"0":"copy.4d0b4688c7"}'
            >
              取消
            </span>
          </Button>
          <Button
            id="confirmInitialize"
            htmlType="button"
            className="hw-button ui-button danger"
          >
            <span
              className="button-label"
              data-i18n-text='{"0":"copy.3007b15e73"}'
            >
              放弃旧存档并初始化
            </span>
          </Button>
        </div>
      </dialog>
      <input
        id="backupFile"
        type="file"
        accept=".json,.txt,application/json,text/plain"
        data-ui="input"
      />

      <div
        id="workCityOptions"
        role="listbox"
        aria-label="工作城市选项"
        hidden
        data-i18n-aria-label="copy.87a138fbd1"
      ></div>
    </>
  );
}
