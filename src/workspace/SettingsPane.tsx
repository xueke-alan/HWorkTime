import Input from "antd/es/input";
import { NumberField } from "./number-field";
import SettingsTabs from "./SettingsTabs";
import { SidebarHeader } from "./SidebarLayout";
import Button from "antd/es/button";
import PreferenceFields, { CalendarMascotSetting } from "./PreferenceFields";
import useDevelopmentEnabled from "../useDevelopmentEnabled";
export default function SettingsPane() {
  const development = useDevelopmentEnabled();
  return (
    <>
      <section
        id="settingsPane"
        className="page-settings-pane"
        hidden
        aria-labelledby="pageSettingsTitle"
      >
        <SidebarHeader className="editor-mode-header page-settings-header">
          <h2 id="pageSettingsTitle" data-i18n-text='{"0":"copy.165118b1d4"}'>
            我的设置
          </h2>
        </SidebarHeader>
        <div
          className="settings-tabs settings-tab-commands"
          hidden
          aria-label="我的设置"
          data-i18n-aria-label="copy.165118b1d4"
          data-ui="tablist"
          role="tablist"
        >
          <Button
            id="settingsGeneralTab"
            htmlType="button"
            aria-controls="pageSettingsPane"
            aria-selected="false"
            tabIndex={-1}
            data-i18n-text='{"0":"settings.general"}'
            className="hw-button settings-tab"
            data-settings-command=""
          >
            常规
          </Button>
          <Button
            id="settingsWorkTab"
            htmlType="button"
            aria-controls="settingsDialog"
            aria-selected="false"
            tabIndex={-1}
            data-i18n-text='{"0":"settings.work"}'
            className="hw-button settings-tab"
            data-settings-command=""
          >
            工作时间
          </Button>
          <Button
            id="settingsPersonalTab"
            htmlType="button"
            aria-controls="personalSettingsPane"
            aria-selected="false"
            tabIndex={-1}
            data-i18n-text='{"0":"copy.c241ef1b93"}'
            className="hw-button settings-tab"
            data-settings-command=""
          >
            个人信息
          </Button>
        </div>
        <SettingsTabs />
        <section
          id="pageSettingsPane"
          className="settings-tab-panel"
          role="tabpanel"
          tabIndex={0}
          hidden
          aria-labelledby="settingsGeneralTab"
        >
          <div className="page-settings-body">
            <PreferenceFields />
            <hr className="settings-content-divider" />
            <div className="auto-backup-settings">
              <div className="field auto-backup-folder" id="autoBackupFolder">
                <label id="autoBackupFolderLabel" />
                <div
                  className="auto-backup-folder-control"
                  role="group"
                  aria-labelledby="autoBackupFolderLabel"
                >
                  <Button
                    id="autoBackupFolderChoose"
                    htmlType="button"
                    className="auto-backup-folder-action"
                    aria-describedby="autoBackupFolderStatus"
                  >
                    <span className="auto-backup-folder-name" />
                  </Button>
                </div>
                <p id="autoBackupFolderStatus" className="help" role="status" />
                <div className="row">
                  <Button
                    id="autoBackupFolderRetry"
                    htmlType="button"
                    aria-describedby="autoBackupFolderStatus"
                  />
                </div>
              </div>
              <label
                id="appInstallLabel"
                className="label"
                htmlFor="appInstallButton"
              />
              <Button
                id="appInstallButton"
                htmlType="button"
                icon={
                  <svg className="ui-icon" aria-hidden="true">
                    <use href="#icon-install-desktop" />
                  </svg>
                }
              />
            </div>
          </div>
        </section>
        <section
          id="settingsDialog"
          className="settings-tab-panel"
          role="tabpanel"
          tabIndex={0}
          hidden
          aria-labelledby="settingsWorkTab"
        >
          <form id="settingsForm">
            <div className="dialog-body">
              <div className="settings-layout">
                <section
                  className="settings-schedule"
                  aria-label="标准工时设置"
                  data-i18n-aria-label="copy.e638050747"
                >
                  <div className="two settings-work-time">
                    <div className="field" data-ui="field">
                      <label
                        htmlFor="standardStart"
                        data-i18n-text='{"0":"copy.ab9e21f1dc"}'
                      >
                        标准上班时间
                      </label>
                      <Input
                        id="standardStart"
                        pattern="(?:[01][0-9]|2[0-3]):[0-5][0-9]"
                        required
                        defaultValue="08:00"
                        className="clock-input hw-field"
                        inputMode="numeric"
                        maxLength={5}
                        autoComplete="off"
                        spellCheck={false}
                      />
                    </div>
                    <div className="field" data-ui="field">
                      <label
                        htmlFor="standardEnd"
                        data-i18n-text='{"0":"copy.7af358a422"}'
                      >
                        标准下班时间
                      </label>
                      <Input
                        id="standardEnd"
                        pattern="(?:[01][0-9]|2[0-3]):[0-5][0-9]"
                        required
                        defaultValue="17:30"
                        className="clock-input hw-field"
                        inputMode="numeric"
                        maxLength={5}
                        autoComplete="off"
                        spellCheck={false}
                      />
                    </div>
                    <Button
                      id="scheduleApplyOpen"
                      htmlType="button"
                      data-hint-text="应用作息"
                      aria-label="应用作息，选择日期范围"
                      aria-haspopup="dialog"
                      aria-controls="scheduleRangeDialog"
                      data-i18n-hint-text="copy.073381b8eb"
                      data-i18n-aria-label="copy.3bd2694e07"
                      className="hw-button ui-button icon-only schedule-apply-button"
                    >
                      <svg className="ui-icon" aria-hidden="true">
                        <use href="#icon-event-note" />
                      </svg>
                    </Button>
                  </div>
                  <div className="field settings-breaks">
                    <span
                      className="label"
                      data-i18n-text='{"0":"copy.b3802fd5fa"}'
                    >
                      每天扣除的休息时段
                    </span>
                    <div id="breaksList"></div>
                  </div>
                  <p
                    id="scheduleEditingDate"
                    className="schedule-editing-date"
                  ></p>
                </section>
                <section
                  className="settings-goal"
                  aria-label="加班目标"
                  data-i18n-aria-label="copy.f9e1e13ee0"
                >
                  <p
                    className="requirements-unit"
                    data-i18n-text='{"0":"copy.aa0a705310"}'
                  >
                    动态加班要求
                  </p>
                  <div className="field settings-requirement">
                    <label
                      htmlFor="overtimeRequirement0"
                      data-i18n-text='{"0":"copy.2c342e954b"}'
                    >
                      0天
                    </label>
                    <NumberField
                      id="overtimeRequirement0"

                      min={0}
                      max={24}
                      step={0.1}
                      precision={1}
                      required
                      className="hw-field number-input"
                    />
                  </div>
                  <div className="field settings-requirement">
                    <label
                      htmlFor="overtimeRequirement1"
                      data-i18n-text='{"0":"copy.5afaef2c3f"}'
                    >
                      1天
                    </label>
                    <NumberField
                      id="overtimeRequirement1"

                      min={0}
                      max={24}
                      step={0.1}
                      precision={1}
                      className="hw-field number-input"
                    />
                  </div>
                  <div className="field settings-requirement">
                    <label
                      htmlFor="overtimeRequirement2"
                      data-i18n-text='{"0":"copy.f9683b03e7"}'
                    >
                      2天
                    </label>
                    <NumberField
                      id="overtimeRequirement2"

                      min={0}
                      max={24}
                      step={0.1}
                      precision={1}
                      className="hw-field number-input"
                    />
                  </div>
                  <div className="field settings-requirement">
                    <label
                      htmlFor="overtimeRequirement3"
                      data-i18n-text='{"0":"copy.b30a92c957"}'
                    >
                      3天
                    </label>
                    <NumberField
                      id="overtimeRequirement3"

                      min={0}
                      max={24}
                      step={0.1}
                      precision={1}
                      className="hw-field number-input"
                    />
                  </div>
                  <div className="field settings-requirement">
                    <label
                      htmlFor="overtimeRequirement4"
                      data-i18n-text='{"0":"copy.6c966a6bf6"}'
                    >
                      ≥4天
                    </label>
                    <NumberField
                      id="overtimeRequirement4"

                      min={0}
                      max={24}
                      step={0.1}
                      precision={1}
                      className="hw-field number-input"
                    />
                  </div>
                </section>
              </div>
              <div id="settingsError" className="warnings" role="alert"></div>
            </div>
          </form>
        </section>
        <section
          id="personalSettingsPane"
          className="settings-tab-panel"
          role="tabpanel"
          tabIndex={0}
          hidden
          aria-labelledby="settingsPersonalTab"
        >
          <div className="page-settings-body">
            <form
              id="personalSettingsForm"
              aria-label="个人信息"
              data-i18n-aria-label="copy.c241ef1b93"
            >
              <div className="settings-employment">
                <div className="field" data-ui="field">
                  <label
                    htmlFor="employmentDate"
                    data-i18n-text='{"0":"copy.9bf4a979d8"}'
                  >
                    入职日期
                  </label>
                  <Input
                    id="employmentDate"
                    data-hint-text="分段填写年月日，支持自动补零和跳段，也可粘贴 2000-9-9 或 20000909"
                    data-i18n-hint-text="copy.3e413a048b"
                    className="clock-input date-entry hw-field"
                    inputMode="numeric"
                    maxLength={10}
                    autoComplete="off"
                    spellCheck={false}
                    type="text"
                    placeholder="YYYY-MM-DD"
                    pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
                  />
                </div>
                <div className="field" data-ui="field">
                  <label
                    id="workCityLabel"
                    htmlFor="workCityTrigger"
                    data-i18n-text='{"0":"copy.acb666728b"}'
                  >
                    工作城市
                  </label>
                  <input id="workCity" type="hidden" />
                  <div id="workCityField" />
                </div>
              </div>
              <p
                id="personalSettingsError"
                className="warnings"
                role="alert"
              ></p>
            </form>
            {development && (
              <>
                <hr className="settings-content-divider" />
                <CalendarMascotSetting />
              </>
            )}
          </div>
        </section>
      </section>
    </>
  );
}
