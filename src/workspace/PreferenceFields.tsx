import Select from "antd/es/select";
import Switch from "antd/es/switch";
import Radio from "antd/es/radio";
import { useState, useLayoutEffect, useRef, type CSSProperties } from "react";
import { useLanguage } from "../ApplicationTheme";
import { showCalendarMascot } from "./CalendarMascot";

type PreferenceKey =
  "language" | "weatherDays" | "pageTheme" | "showCalendarMascot";
type PreferenceValue = string | number | boolean;
function usePreference<T extends PreferenceValue>(
  key: PreferenceKey,
  read: () => T,
  write: (value: T) => Promise<{ persisted: boolean; pending?: boolean }>,
) {
  const [value, setValue] = useState(read);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const mounted = useRef(false);
  const sequence = useRef(0);
  useLayoutEffect(() => {
    mounted.current = true;
    setValue(read());
    const unsubscribe = WorkTimeApp.services.preferences.page.subscribe(
      (_, result) => {
        setValue(read());
        if (result.preferenceNames?.includes(key))
          setFailed(!result.persisted && !result.pending);
      },
    );
    return () => {
      mounted.current = false;
      unsubscribe();
    };
  }, [key, read]);
  async function save(next: T) {
    const request = ++sequence.current;
    setBusy(true);
    try {
      const result = await write(next);
      if (mounted.current && sequence.current === request)
        setFailed(!result.persisted && !result.pending);
    } catch {
      if (mounted.current && sequence.current === request) setFailed(true);
    } finally {
      if (mounted.current && sequence.current === request) {
        setValue(read());
        setBusy(false);
      }
    }
  }
  return { value, busy, failed, save };
}
const currentTheme = () =>
  WorkTimeApp.services.preferences.page.state.pageTheme || "green";
const currentLanguage = () => WorkTimeApp.i18n.preference;
const currentWeather = () =>
  WorkTimeApp.services.preferences.page.state.weatherDays ?? 5;

export function CalendarMascotSetting() {
  useLanguage();
  const { t } = WorkTimeApp.i18n;
  const { saveCalendarMascot } = WorkTimeApp.services.preferences.page;
  const setting = usePreference(
    "showCalendarMascot",
    showCalendarMascot,
    saveCalendarMascot,
  );
  return (
    <div>
      <div className="calendar-mascot-setting">
        <label id="calendarMascotLabel" htmlFor="calendarMascotSwitch">
          {t("calendarMascot.show")}
        </label>
        <Switch
          id="calendarMascotSwitch"
          aria-labelledby="calendarMascotLabel"
          checked={setting.value}
          disabled={setting.busy}
          onChange={setting.save}
        />
      </div>
      <p className="theme-save-notice" role="status">
        {setting.failed && t("calendarMascot.saveFailed")}
      </p>
    </div>
  );
}

export function ThemeSetting() {
  useLanguage();
  const service = WorkTimeApp.services.preferences.page;
  const setting = usePreference("pageTheme", currentTheme, service.saveTheme);
  const { t, message } = WorkTimeApp.i18n;
  const themes = WorkTimeApp.domain.preferences.themes;
  return (
    <fieldset className="theme-settings" data-ui="fieldset">
      <legend>{t("copy.808b0205aa")}</legend>
      <Radio.Group
        disabled={setting.busy}
        value={setting.value}
        onChange={(event) => void setting.save(event.target.value)}
        className="theme-grid"
        style={{ "--theme-count": themes.length } as CSSProperties}
      >
        {themes.map((theme) => (
          <Radio.Button
            value={theme.id}
            aria-label={message(theme.name)}
            key={theme.id}
            className="theme-card"
            data-ui="swatch-choice"
            data-hint-text={message(theme.name)}
            style={{ "--theme-option-color": theme.color } as CSSProperties}
          >
            <span className="theme-swatch" aria-hidden="true" />
            <span className="theme-name">{message(theme.name)}</span>
          </Radio.Button>
        ))}
      </Radio.Group>
      <p className="theme-save-notice" data-ui="status" role="status">
        {setting.failed && t("copy.121c73541e")}
      </p>
    </fieldset>
  );
}
function PreferenceSelect<T extends string | number>({
  id,
  labelId,
  label,
  error,
  setting,
  options,
}: {
  id: string;
  labelId?: string;
  label: string;
  error: string;
  setting: ReturnType<typeof usePreference<T>>;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="field language-settings">
      <label id={labelId} htmlFor={id}>
        {label}
      </label>
      <Select
        id={id}
        size="large"
        virtual={false}
        classNames={{ popup: { root: "preference-select-popup" } }}
        aria-labelledby={labelId}
        aria-label={label}
        value={setting.value}
        options={options.map((option) => ({ ...option, title: "" }))}
        disabled={setting.busy}
        onChange={setting.save}
      />
      <p className="theme-save-notice" data-ui="status" role="status">
        {setting.failed && error}
      </p>
    </div>
  );
}
export function WeatherSetting() {
  useLanguage();
  const service = WorkTimeApp.services.preferences.page;
  const language = usePreference(
    "language",
    currentLanguage,
    service.saveLanguage,
  );
  const weather = usePreference(
    "weatherDays",
    currentWeather,
    service.saveWeatherDays,
  );
  const { t } = WorkTimeApp.i18n;
  return (
    <>
      <PreferenceSelect
        id="languageTrigger"
        label={t("language.label")}
        error={t("language.failed")}
        setting={language}
        options={WorkTimeApp.i18n.languages.map(({ id, name }) => ({
          value: id,
          label: name,
        }))}
      />
      <PreferenceSelect
        id="weatherDays"
        labelId="weatherLabel"
        label={t("weather.settings.label")}
        error={t("copy.121c73541e")}
        setting={weather}
        options={[3, 5, 7, 0].map((value) => ({
          value,
          label: value
            ? t("weather.settings.days", { days: String(value) })
            : t("weather.settings.off"),
        }))}
      />
    </>
  );
}

export default function PreferenceFields() {
  return (
    <>
      <div className="theme-settings-host">
        <ThemeSetting />
      </div>
      <div id="weather-settings" className="settings-select-row">
        <WeatherSetting />
      </div>
    </>
  );
}
