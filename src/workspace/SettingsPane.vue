<script setup lang="ts">
import { UiTabList } from "@hworktime/ui";
import ThemeSetting from "./ThemeSetting.vue";
import WeatherSetting from "../weather/WeatherSetting.vue";
import { UiButton as Button, UiInputText as InputText } from "@hworktime/ui";
</script>
<template>
  <section
    id="settingsPane"
    class="page-settings-pane"
    hidden
    aria-labelledby="pageSettingsTitle"
  >
    <div class="editor-mode-header page-settings-header">
      <h2 id="pageSettingsTitle" data-i18n-text='{"0":"copy.165118b1d4"}'>
        我的设置
      </h2>
    </div>
    <UiTabList
      as="div"
      class="settings-tabs"
      aria-label="我的设置"
      data-i18n-aria-label="copy.165118b1d4"
    >
      <Button
        id="settingsGeneralTab"
        class="settings-tab"
        type="button"
        role="tab"
        aria-controls="pageSettingsPane"
        aria-selected="false"
        tabindex="-1"
        data-i18n-text='{"0":"settings.general"}'
        >常规</Button
      ><Button
        id="settingsWorkTab"
        class="settings-tab"
        type="button"
        role="tab"
        aria-controls="settingsDialog"
        aria-selected="false"
        tabindex="-1"
        data-i18n-text='{"0":"settings.work"}'
        >工作时间</Button
      ><Button
        id="settingsPersonalTab"
        class="settings-tab"
        type="button"
        role="tab"
        aria-controls="personalSettingsPane"
        aria-selected="false"
        tabindex="-1"
        data-i18n-text='{"0":"copy.c241ef1b93"}'
        >个人信息</Button
      >
    </UiTabList>
    <section
      id="pageSettingsPane"
      class="settings-tab-panel"
      role="tabpanel"
      tabindex="0"
      hidden
      aria-labelledby="settingsGeneralTab"
    >
      <div class="page-settings-body">
        <div class="theme-settings-host"><ThemeSetting /></div>
        <div id="weather-settings" class="settings-select-row">
          <WeatherSetting />
        </div>
        <hr class="settings-content-divider" />
        <div class="auto-backup-settings"></div>
      </div>
    </section>
    <section
      id="settingsDialog"
      class="settings-tab-panel"
      role="tabpanel"
      tabindex="0"
      hidden
      aria-labelledby="settingsWorkTab"
    >
      <form id="settingsForm">
        <div class="dialog-body">
          <div class="settings-layout">
            <section
              class="settings-schedule"
              aria-label="标准工时设置"
              data-i18n-aria-label="copy.e638050747"
            >
              <div class="two settings-work-time">
                <div class="field">
                  <label
                    for="standardStart"
                    data-i18n-text='{"0":"copy.ab9e21f1dc"}'
                    >标准上班时间</label
                  ><InputText
                    id="standardStart"
                    type="text"
                    class="clock-input"
                    inputmode="numeric"
                    maxlength="5"
                    autocomplete="off"
                    spellcheck="false"
                    pattern="(?:[01][0-9]|2[0-3]):[0-5][0-9]"
                    required
                    value="08:00"
                  />
                </div>
                <div class="field">
                  <label
                    for="standardEnd"
                    data-i18n-text='{"0":"copy.7af358a422"}'
                    >标准下班时间</label
                  ><InputText
                    id="standardEnd"
                    type="text"
                    class="clock-input"
                    inputmode="numeric"
                    maxlength="5"
                    autocomplete="off"
                    spellcheck="false"
                    pattern="(?:[01][0-9]|2[0-3]):[0-5][0-9]"
                    required
                    value="17:30"
                  />
                </div>
                <Button
                  id="scheduleApplyOpen"
                  class="ui-button icon-only schedule-apply-button"
                  type="button"
                  title="应用作息"
                  aria-label="应用作息，选择日期范围"
                  aria-haspopup="dialog"
                  aria-controls="scheduleRangeDialog"
                  data-i18n-title="copy.073381b8eb"
                  data-i18n-aria-label="copy.3bd2694e07"
                  ><svg class="ui-icon" aria-hidden="true">
                    <use href="#ms-event-note" /></svg
                ></Button>
              </div>
              <div class="field settings-breaks">
                <span class="label" data-i18n-text='{"0":"copy.b3802fd5fa"}'
                  >每天扣除的休息时段</span
                >
                <div id="breaksList"></div>
              </div>
              <p id="scheduleEditingDate" class="schedule-editing-date"></p>
            </section>
            <section
              class="settings-goal"
              aria-label="加班目标"
              data-i18n-aria-label="copy.f9e1e13ee0"
            >
              <p
                class="requirements-unit"
                data-i18n-text='{"0":"copy.aa0a705310"}'
              >
                动态加班要求
              </p>
              <div class="field settings-requirement">
                <label
                  for="overtimeRequirement0"
                  data-i18n-text='{"0":"copy.2c342e954b"}'
                  >0天</label
                ><InputText
                  id="overtimeRequirement0"
                  type="number"
                  class="number-input"
                  min="0"
                  max="24"
                  step="0.1"
                  required
                />
              </div>
              <div class="field settings-requirement">
                <label
                  for="overtimeRequirement1"
                  data-i18n-text='{"0":"copy.5afaef2c3f"}'
                  >1天</label
                ><InputText
                  id="overtimeRequirement1"
                  type="number"
                  class="number-input"
                  min="0"
                  max="24"
                  step="0.1"
                />
              </div>
              <div class="field settings-requirement">
                <label
                  for="overtimeRequirement2"
                  data-i18n-text='{"0":"copy.f9683b03e7"}'
                  >2天</label
                ><InputText
                  id="overtimeRequirement2"
                  type="number"
                  class="number-input"
                  min="0"
                  max="24"
                  step="0.1"
                />
              </div>
              <div class="field settings-requirement">
                <label
                  for="overtimeRequirement3"
                  data-i18n-text='{"0":"copy.b30a92c957"}'
                  >3天</label
                ><InputText
                  id="overtimeRequirement3"
                  type="number"
                  class="number-input"
                  min="0"
                  max="24"
                  step="0.1"
                />
              </div>
              <div class="field settings-requirement">
                <label
                  for="overtimeRequirement4"
                  data-i18n-text='{"0":"copy.6c966a6bf6"}'
                  >≥4天</label
                ><InputText
                  id="overtimeRequirement4"
                  type="number"
                  class="number-input"
                  min="0"
                  max="24"
                  step="0.1"
                />
              </div>
            </section>
          </div>
          <div id="settingsError" class="warnings" role="alert"></div>
        </div>
      </form>
    </section>
    <section
      id="personalSettingsPane"
      class="settings-tab-panel"
      role="tabpanel"
      tabindex="0"
      hidden
      aria-labelledby="settingsPersonalTab"
    >
      <div class="page-settings-body">
        <form
          id="personalSettingsForm"
          aria-label="个人信息"
          data-i18n-aria-label="copy.c241ef1b93"
        >
          <div class="settings-employment">
            <div class="field">
              <label
                for="employmentDate"
                data-i18n-text='{"0":"copy.9bf4a979d8"}'
                >入职日期</label
              ><InputText
                id="employmentDate"
                type="text"
                class="clock-input date-entry"
                inputmode="numeric"
                maxlength="10"
                autocomplete="off"
                spellcheck="false"
                placeholder="YYYY-MM-DD"
                pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
                title="分段填写年月日，支持自动补零和跳段，也可粘贴 2000-9-9 或 20000909"
                data-i18n-title="copy.3e413a048b"
              />
            </div>
            <div class="field">
              <label for="workCity" data-i18n-text='{"0":"copy.acb666728b"}'
                >工作城市</label
              ><InputText
                id="workCity"
                type="text"
                readonly
                autocomplete="off"
                role="combobox"
                aria-autocomplete="none"
                aria-haspopup="listbox"
                aria-expanded="false"
                aria-controls="workCityOptions"
              />
            </div>
          </div>
          <p id="personalSettingsError" class="warnings" role="alert"></p>
        </form>
      </div>
    </section>
    <div class="settings-pane-actions">
      <Button class="ui-button" id="personalSettingsCancel" type="button"
        ><svg class="ui-icon" aria-hidden="true">
          <use href="#ms-chevron-left" /></svg
        ><span class="button-label" data-i18n-text='{"0":"copy.11d0241540"}'
          >返回</span
        ></Button
      >
    </div>
  </section>
</template>
