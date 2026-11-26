import { useLanguage } from "../../ApplicationTheme";
import { CalendarIcon, FireIcon } from "../../phosphor-icons";
import ToolbarSegmented from "../ToolbarSegmented";

type YearMode = "heatmap" | "calendar";

export default function YearDisplay(props: {
  value: YearMode;
  disabled: boolean;
  onChange: (mode: YearMode) => void;
}) {
  useLanguage();
  const { t } = WorkTimeApp.i18n;
  return (
    <ToolbarSegmented<YearMode>
      {...props}
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
