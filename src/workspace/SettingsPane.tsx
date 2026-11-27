import SettingsTabs from "./SettingsTabs";
import { SidebarHeader } from "./SidebarLayout";
import Button from "antd/es/button";
import { lazy, Suspense, useLayoutEffect, useRef, useState } from "react";
const PreferenceFields = lazy(() => import("./PreferenceFields"));
const CalendarMascotSetting = lazy(() =>
  import("./PreferenceFields").then(({ CalendarMascotSetting }) => ({
    default: CalendarMascotSetting,
  })),
);
export default function SettingsPane() {
  const pane = useRef<HTMLElement>(null);
  const [opened, setOpened] = useState(false);
  useLayoutEffect(() => {
    const host = pane.current!;
    const open = () => setOpened(true);
    host.addEventListener("settings-open", open);
    return () => host.removeEventListener("settings-open", open);
  }, []);
  return (
    <>
      <section
        ref={pane}
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
            <Suspense fallback={null}>
              {opened && <PreferenceFields />}
            </Suspense>
            <hr className="settings-content-divider" />
            <div className="auto-backup-settings"></div>
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
                      <input
                        id="standardStart"
                        pattern="(?:[01][0-9]|2[0-3]):[0-5][0-9]"
                        required
                        value="08:00"
                        className="clock-input hw-field"
                        inputMode="numeric"
                        maxLength={5}
                        autoComplete="off"
                        spellCheck="false"
                      />
                    </div>
                    <div className="field" data-ui="field">
                      <label
                        htmlFor="standardEnd"
                        data-i18n-text='{"0":"copy.7af358a422"}'
                      >
                        标准下班时间
                      </label>
                      <input
                        id="standardEnd"
                        pattern="(?:[01][0-9]|2[0-3]):[0-5][0-9]"
                        required
                        value="17:30"
                        className="clock-input hw-field"
                        inputMode="numeric"
                        maxLength={5}
                        autoComplete="off"
                        spellCheck="false"
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
                    <input
                      id="overtimeRequirement0"
                      type="number"
                      min="0"
                      max="24"
                      step="0.1"
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
                    <input
                      id="overtimeRequirement1"
                      type="number"
                      min="0"
                      max="24"
                      step="0.1"
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
                    <input
                      id="overtimeRequirement2"
                      type="number"
                      min="0"
                      max="24"
                      step="0.1"
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
                    <input
                      id="overtimeRequirement3"
                      type="number"
                      min="0"
                      max="24"
                      step="0.1"
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
                    <input
                      id="overtimeRequirement4"
                      type="number"
                      min="0"
                      max="24"
                      step="0.1"
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
                  <input
                    id="employmentDate"
                    data-hint-text="分段填写年月日，支持自动补零和跳段，也可粘贴 2000-9-9 或 20000909"
                    data-i18n-hint-text="copy.3e413a048b"
                    className="clock-input date-entry hw-field"
                    inputMode="numeric"
                    maxLength={10}
                    autoComplete="off"
                    spellCheck="false"
                    type="text"
                    placeholder="YYYY-MM-DD"
                    pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
                  />
                </div>
                <div className="field" data-ui="field">
                  <label
                    htmlFor="workCity"
                    data-i18n-text='{"0":"copy.acb666728b"}'
                  >
                    工作城市
                  </label>
                  <input
                    id="workCity"
                    type="text"
                    readOnly
                    autoComplete="off"
                    role="combobox"
                    aria-autocomplete="none"
                    aria-haspopup="listbox"
                    aria-expanded="false"
                    aria-controls="workCityOptions"
                    className="hw-field"
                  />
                </div>
              </div>
              <p
                id="personalSettingsError"
                className="warnings"
                role="alert"
              ></p>
            </form>
            <hr className="settings-content-divider" />
            <Suspense fallback={null}>
              {opened && <CalendarMascotSetting />}
            </Suspense>
          </div>
        </section>
        <div className="settings-pane-actions" data-ui="toolbar">
          <Button
            id="personalSettingsCancel"
            htmlType="button"
            className="hw-button ui-button"
          >
            <svg className="ui-icon" aria-hidden="true">
              <use href="#icon-chevron-left" />
            </svg>
            <span
              className="button-label"
              data-i18n-text='{"0":"copy.11d0241540"}'
            >
              返回
            </span>
          </Button>
        </div>
      </section>
    </>
  );
}
