import { useLanguage } from "../../ApplicationTheme";
import {
  CalendarDotsIcon,
  CalendarGridIcon,
  ColumnsIcon,
} from "../../phosphor-icons";
import ToolbarSegmented from "../ToolbarSegmented";

const modes = [
  { weeks: 1, label: "agenda.oneWeek", Icon: ColumnsIcon },
  { weeks: 2, label: "agenda.twoWeeks", Icon: CalendarGridIcon },
  { weeks: 3, label: "agenda.threeWeeks", Icon: CalendarGridIcon },
  { weeks: 0, label: "agenda.monthView", Icon: CalendarDotsIcon },
] as const;

export default function AgendaDisplay(props: {
  value: number;
  disabled: boolean;
  onChange: (weeks: number) => void;
}) {
  useLanguage();
  const { t } = WorkTimeApp.i18n;
  return (
    <ToolbarSegmented<number>
      {...props}
      compactOnNarrow
      aria-label={t("agenda.view")}
      aria-controls="calendar"
      options={modes.map(({ weeks, label, Icon }) => ({
        value: weeks,
        label: <span data-agenda-weeks={weeks}>{t(label)}</span>,
        icon: <Icon size="1em" />,
      }))}
    />
  );
}
