<script setup lang="ts">
import {
  UiDialogSurface,
  UiCheckbox,
  UiNativeSelect,
  UiFileInput,
} from "@hworktime/ui";
import GameArchiveDialog from "../games/GameArchiveDialog.vue";
import ImportConfirmations from "../imports/ImportConfirmations.vue";
import {
  UiButton as Button,
  UiTextarea as Textarea,
  UiInputText as InputText,
} from "@hworktime/ui";
</script>
<template>
  <UiDialogSurface
    id="templateImportDialog"
    aria-labelledby="templateImportTitle"
  >
    <div class="dialog-head">
      <h2 id="templateImportTitle" data-i18n-text='{"0":"copy.67d8959c5f"}'>
        导入打卡模板
      </h2>
      <Button
        class="ui-button"
        data-close="templateImportDialog"
        aria-label="关闭"
        data-i18n-aria-label="copy.6c14bd7f6f"
        ><span class="button-label">×</span></Button
      >
    </div>
    <div class="dialog-body">
      <section
        class="template-import-input"
        aria-labelledby="templateImportInputTitle"
      >
        <label
          id="templateImportInputTitle"
          for="templateImportText"
          data-i18n-text='{"0":"copy.b1515c0f17"}'
          >模板分享字符串</label
        ><Textarea
          id="templateImportText"
          rows="4"
          placeholder="在此粘贴模板分享字符串"
          spellcheck="false"
          aria-describedby="templateImportError"
          data-i18n-placeholder="copy.18016bbf38"
        ></Textarea>
      </section>
      <section
        class="template-import-preview-pane"
        aria-labelledby="templateImportPreviewTitle"
      >
        <h3
          id="templateImportPreviewTitle"
          data-i18n-text='{"0":"copy.582848430f"}'
        >
          模板预览
        </h3>
        <div class="template-import-preview-scroll">
          <p
            class="template-import-empty"
            data-i18n-text='{"0":"copy.9081c55e12"}'
          >
            粘贴分享字符串后，将自动解析并显示模板。
          </p>
          <div id="templateImportPreview" aria-live="polite" hidden></div>
        </div>
      </section>
    </div>
    <div class="dialog-foot">
      <p id="templateImportError" class="warnings" role="alert"></p>
      <Button class="ui-button" data-close="templateImportDialog" type="button"
        ><span class="button-label" data-i18n-text='{"0":"copy.4d0b4688c7"}'
          >取消</span
        ></Button
      ><Button id="parseTemplateImport" class="ui-button" type="button"
        ><span class="button-label" data-i18n-text='{"0":"copy.8652f5287b"}'
          >解析预览</span
        ></Button
      ><Button
        id="confirmTemplateImport"
        class="ui-button primary"
        type="button"
        disabled
        ><span class="button-label" data-i18n-text='{"0":"copy.c67472f3dc"}'
          >确认替换全部模板</span
        ></Button
      >
    </div>
  </UiDialogSurface>
  <UiDialogSurface
    id="templateShareDialog"
    aria-labelledby="templateShareTitle"
  >
    <div class="dialog-head">
      <h2 id="templateShareTitle" data-i18n-text='{"0":"copy.46f1184935"}'>
        分享打卡模板
      </h2>
      <Button
        class="ui-button"
        data-close="templateShareDialog"
        aria-label="关闭"
        data-i18n-aria-label="copy.6c14bd7f6f"
        ><span class="button-label">×</span></Button
      >
    </div>
    <div class="dialog-body">
      <p class="help" data-i18n-text='{"0":"copy.7f47fbd967"}'>
        自动复制失败，请选择下面的字符串后手动复制。
      </p>
      <label for="templateShareText" data-i18n-text='{"0":"copy.b1515c0f17"}'
        >模板分享字符串</label
      ><Textarea
        id="templateShareText"
        rows="4"
        readonly
        spellcheck="false"
      ></Textarea>
      <p id="templateShareError" class="warnings" role="alert"></p>
    </div>
    <div class="dialog-foot">
      <Button class="ui-button" data-close="templateShareDialog" type="button"
        ><span class="button-label" data-i18n-text='{"0":"copy.6c14bd7f6f"}'
          >关闭</span
        ></Button
      ><Button id="selectTemplateShare" class="ui-button" type="button"
        ><span class="button-label" data-i18n-text='{"0":"copy.195c162630"}'
          >全选字符串</span
        ></Button
      ><Button id="copyTemplateShare" class="ui-button primary" type="button"
        ><span class="button-label" data-i18n-text='{"0":"copy.985e338473"}'
          >复制字符串</span
        ></Button
      >
    </div>
  </UiDialogSurface>
  <UiDialogSurface id="timeTemplateDialog">
    <div class="dialog-head">
      <h2 id="timeTemplateTitle" data-i18n-text='{"0":"copy.b464e3690d"}'>
        新增时间模板
      </h2>
      <Button
        class="ui-button"
        data-close="timeTemplateDialog"
        aria-label="关闭"
        data-i18n-aria-label="copy.6c14bd7f6f"
        ><span class="button-label">×</span></Button
      >
    </div>
    <form id="timeTemplateForm">
      <div class="dialog-body">
        <div class="field">
          <label for="timeTemplateName" data-i18n-text='{"0":"copy.bbc511d06d"}'
            >模板名称</label
          ><InputText
            id="timeTemplateName"
            type="text"
            maxlength="30"
            required
            placeholder="例如：常规班、晚班"
            data-i18n-placeholder="copy.e777a0f094"
          />
        </div>
        <div class="two template-time-fields">
          <div class="field">
            <label
              for="timeTemplateStart"
              data-i18n-text='{"0":"copy.e5c8b63c01"}'
              >上班时间</label
            ><InputText
              id="timeTemplateStart"
              type="text"
              class="clock-input"
              inputmode="numeric"
              maxlength="5"
              autocomplete="off"
              spellcheck="false"
              pattern="(?:[01][0-9]|2[0-3]):[0-5][0-9]"
            />
          </div>
          <div class="field">
            <label
              for="timeTemplateEnd"
              data-i18n-text='{"0":"copy.1242101486"}'
              >下班时间</label
            ><InputText
              id="timeTemplateEnd"
              type="text"
              class="clock-input"
              inputmode="numeric"
              maxlength="5"
              autocomplete="off"
              spellcheck="false"
              pattern="(?:[01][0-9]|2[0-3]):[0-5][0-9]"
            />
          </div>
          <div class="nextday-control">
            <UiCheckbox
              id="timeTemplateNext"
              class="hidden"
              type="checkbox"
            /><Button
              id="timeTemplateNextToggle"
              class="ui-button nextday-toggle"
              type="button"
              aria-label="次日下班（跨午夜）"
              title="次日下班"
              aria-pressed="false"
              data-i18n-aria-label="copy.905f84b1cb"
              data-i18n-title="copy.889d4d1a2c"
              ><svg class="ui-icon" aria-hidden="true">
                <use href="#ms-dark-mode" /></svg
            ></Button>
          </div>
        </div>
        <div id="timeTemplateError" class="warnings" role="alert"></div>
      </div>
      <div class="dialog-foot">
        <Button
          id="deleteTimeTemplate"
          class="ui-button danger hidden"
          type="button"
          ><span class="button-label" data-i18n-text='{"0":"copy.b31745bdff"}'
            >删除模板</span
          ></Button
        ><Button type="submit" class="ui-button primary"
          ><span class="button-label" data-i18n-text='{"0":"copy.fbfc58b501"}'
            >保存模板</span
          ></Button
        >
      </div>
    </form>
  </UiDialogSurface>

  <UiDialogSurface
    id="scheduleRangeDialog"
    aria-labelledby="scheduleRangeTitle"
  >
    <div class="dialog-head">
      <h2 id="scheduleRangeTitle" data-i18n-text='{"0":"copy.073381b8eb"}'>
        应用作息
      </h2>
      <Button
        class="ui-button"
        type="button"
        data-close="scheduleRangeDialog"
        aria-label="关闭"
        data-i18n-aria-label="copy.6c14bd7f6f"
        ><span class="button-label">×</span></Button
      >
    </div>
    <form id="scheduleRangeForm">
      <div class="dialog-body">
        <div class="schedule-range-fields">
          <div
            id="scheduleDraftSummary"
            class="schedule-draft-summary"
            aria-label="待应用的作息"
            data-i18n-aria-label="copy.61800cf5a4"
          ></div>
          <div class="field schedule-range-field">
            <label
              id="scheduleRangeLabel"
              for="scheduleRangeTrigger"
              data-i18n-text='{"0":"copy.4aa9b5b102"}'
              >应用范围</label
            >
            <div id="scheduleRangePicker" class="schedule-range-picker">
              <UiNativeSelect
                id="scheduleRangeChoice"
                class="schedule-range-native"
                tabindex="-1"
                aria-hidden="true"
              >
                <option value="all" data-i18n-text='{"0":"copy.bf76c37d03"}'>
                  全部日期
                </option>
                <option
                  value="future"
                  selected
                  data-i18n-text='{"0":"copy.15b829106b"}'
                >
                  从今天起
                </option>
                <option value="week" data-i18n-text='{"0":"copy.9266e6b528"}'>
                  今天起7个自然日
                </option>
                <option value="month" data-i18n-text='{"0":"copy.516037a809"}'>
                  今天至本月末
                </option>
                <option value="custom" data-i18n-text='{"0":"copy.32981249bd"}'>
                  自定义日期范围
                </option>
              </UiNativeSelect>
              <Button
                class="ui-button"
                id="scheduleRangeTrigger"
                type="button"
                role="combobox"
                aria-labelledby="scheduleRangeLabel scheduleRangeValue"
                aria-haspopup="listbox"
                aria-expanded="false"
                aria-controls="scheduleRangeOptions"
                ><span
                  class="button-label"
                  id="scheduleRangeValue"
                  data-i18n-text='{"0":"copy.15b829106b"}'
                  >从今天起</span
                ><svg
                  class="ui-icon schedule-range-chevron"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="m7 10 5 5 5-5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  /></svg
              ></Button>
              <div
                id="scheduleRangeOptions"
                role="listbox"
                aria-labelledby="scheduleRangeLabel"
                hidden
              ></div>
            </div>
          </div>
          <div id="scheduleCustomDates" class="two" hidden>
            <div class="field">
              <label
                for="scheduleRangeStart"
                data-i18n-text='{"0":"copy.1f29196891"}'
                >开始日期</label
              ><InputText
                id="scheduleRangeStart"
                type="date"
                min="1900-01-01"
                max="9999-12-31"
              />
            </div>
            <div class="field">
              <label
                for="scheduleRangeEnd"
                data-i18n-text='{"0":"copy.f4b9b2b5de"}'
                >结束日期</label
              ><InputText
                id="scheduleRangeEnd"
                type="date"
                min="1900-01-01"
                max="9999-12-31"
              />
            </div>
          </div>
          <label
            id="scheduleNoEndLabel"
            hidden
            data-i18n-text='{"0":"copy.f5cf573859"}'
            ><UiCheckbox
              id="scheduleNoEnd"
              type="checkbox"
            />持续生效，不设结束日期</label
          >
          <div class="schedule-range-note">
            <p id="scheduleRangeDescription" aria-live="polite"></p>
            <p class="help" data-i18n-text='{"0":"copy.c93512f2d8"}'>
              范围内覆盖已有作息，范围外保留原安排。不会修改实际打卡及请假时长。
            </p>
          </div>
          <div id="scheduleRangeError" class="warnings" role="alert"></div>
        </div>
        <section
          class="schedule-arrangements"
          aria-labelledby="scheduleListTitle"
        >
          <h3 id="scheduleListTitle" data-i18n-text='{"0":"copy.0c9744ed6a"}'>
            作息安排
          </h3>
          <p class="help" data-i18n-text='{"0":"copy.6c8aa183ec"}'>
            选择卡片载入作息，再选择应用范围。基础作息用于未被日期区间覆盖的日期。
          </p>
          <div id="scheduleList"></div>
        </section>
      </div>
      <div class="dialog-foot">
        <Button class="ui-button" type="button" data-close="scheduleRangeDialog"
          ><span class="button-label" data-i18n-text='{"0":"copy.4d0b4688c7"}'
            >取消</span
          ></Button
        ><Button class="ui-button primary" type="submit"
          ><span class="button-label" data-i18n-text='{"0":"copy.073381b8eb"}'
            >应用作息</span
          ></Button
        >
      </div>
    </form>
  </UiDialogSurface>
  <UiDialogSurface
    id="scheduleDraftDialog"
    aria-labelledby="scheduleDraftTitle"
  >
    <div class="dialog-head">
      <h2 id="scheduleDraftTitle" data-i18n-text='{"0":"copy.c8c0111f42"}'>
        作息尚未应用
      </h2>
    </div>
    <div class="dialog-body">
      <p data-i18n-text='{"0":"copy.6b8331cd87"}'>是否先应用当前作息草稿？</p>
    </div>
    <div class="dialog-foot">
      <Button class="ui-button" id="scheduleDraftContinue" type="button"
        ><span class="button-label" data-i18n-text='{"0":"copy.3a481bc764"}'
          >继续编辑</span
        ></Button
      ><Button class="ui-button" id="scheduleDraftDiscard" type="button"
        ><span class="button-label" data-i18n-text='{"0":"copy.b8a81b7a9c"}'
          >放弃</span
        ></Button
      ><Button id="scheduleDraftApply" class="ui-button primary" type="button"
        ><span class="button-label" data-i18n-text='{"0":"copy.4562024dde"}'
          >应用</span
        ></Button
      >
    </div>
  </UiDialogSurface>
  <GameArchiveDialog /><ImportConfirmations />
  <UiDialogSurface id="oaLinkDialog">
    <div class="dialog-head">
      <h2 data-i18n-text='{"0":"copy.150aff1e54"}'>OA系统链接</h2>
      <Button
        class="ui-button"
        data-close="oaLinkDialog"
        aria-label="关闭"
        data-i18n-aria-label="copy.6c14bd7f6f"
        ><span class="button-label">×</span></Button
      >
    </div>
    <form id="oaLinkForm">
      <div class="dialog-body">
        <div class="field">
          <label for="oaLinkInput" data-i18n-text='{"0":"copy.08678f1c4e"}'
            >OA 网页地址</label
          ><InputText
            id="oaLinkInput"
            type="url"
            required
            autocomplete="url"
            placeholder="https://oa.example.com"
          />
        </div>
        <p id="oaLinkError" class="warnings" role="alert"></p>
      </div>
      <div class="dialog-foot">
        <Button class="ui-button" data-close="oaLinkDialog" type="button"
          ><span class="button-label" data-i18n-text='{"0":"copy.4d0b4688c7"}'
            >取消</span
          ></Button
        ><Button class="ui-button primary" type="submit"
          ><span class="button-label" data-i18n-text='{"0":"copy.4c61b4be42"}'
            >保存链接</span
          ></Button
        >
      </div>
    </form>
  </UiDialogSurface>
  <UiDialogSurface id="initializeDialog">
    <div class="dialog-head">
      <h2 data-i18n-text='{"0":"copy.4e07c587e5"}'>初始化存档</h2>
      <Button
        class="ui-button"
        data-close="initializeDialog"
        aria-label="关闭"
        data-i18n-aria-label="copy.6c14bd7f6f"
        ><span class="button-label">×</span></Button
      >
    </div>
    <div class="dialog-body">
      <p data-i18n-text='{"0":"copy.84340d29f7"}'>
        初始化将放弃损坏的旧存档及当前页面临时修改，清空全部工作记录、导入历史、时间模板、作息安排和个人工作设置，恢复默认工作设置。保留当前页面主题。
      </p>
      <p class="help" data-i18n-text='{"0":"copy.5006e352ed"}'>
        此操作无法撤销。建议先导出原始数据，供后续排查或修复。
      </p>
      <Button class="ui-button" id="exportBeforeInitialize" type="button"
        ><span class="button-label" data-i18n-text='{"0":"copy.8118ac63b6"}'
          >导出原始数据</span
        ></Button
      >
      <p id="initializeError" class="warnings" role="alert"></p>
    </div>
    <div class="dialog-foot">
      <Button class="ui-button" data-close="initializeDialog"
        ><span class="button-label" data-i18n-text='{"0":"copy.4d0b4688c7"}'
          >取消</span
        ></Button
      ><Button class="ui-button danger" id="confirmInitialize" type="button"
        ><span class="button-label" data-i18n-text='{"0":"copy.3007b15e73"}'
          >放弃旧存档并初始化</span
        ></Button
      >
    </div>
  </UiDialogSurface>
  <UiFileInput
    id="backupFile"
    type="file"
    accept=".json,.txt,application/json,text/plain"
  />

  <div
    id="workCityOptions"
    role="listbox"
    aria-label="工作城市选项"
    hidden
    data-i18n-aria-label="copy.87a138fbd1"
  ></div>
</template>
