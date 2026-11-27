import { useSyncExternalStore } from "react";
import { useLanguage } from "../../ApplicationTheme";
import { CalendarIcon, FireIcon } from "../../tabler-icons";
import ToolbarSegmented from "../ToolbarSegmented";

type YearMode = "heatmap" | "calendar";

function subscribe(listener: () => void) {
  document.addEventListener("worktime:yearviewchange", listener);
  return () =>
    document.removeEventListener("worktime:yearviewchange", listener);
}
export default function YearDisplay({
  getValue,
  ...props
}: {
  getValue: () => YearMode;
  disabled: boolean;
  onChange: (mode: YearMode) => void;
}) {
  const value = useSyncExternalStore(subscribe, getValue);
  useLanguage();
  const { t } = WorkTimeApp.i18n;
  return (
    <ToolbarSegmented<YearMode>
      {...props}
      value={value}
      aria-label={t("calendarHint.yearView")}
      aria-controls="calendar"
      options={[
        {
          value: "heatmap",
          icon: <FireIcon size="1em" />,
          label: t("yearView.heatmap"),
        },
        {
          value: "calendar",
          icon: <CalendarIcon size="1em" />,
          label: t("yearView.calendar"),
        },
      ]}
    />
  );
}
