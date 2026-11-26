import Button from "antd/es/button";
export interface DayCell {
  key: string;
  label: string;
  text: string;
  selected: boolean;
  disabled: boolean;
  today: boolean;
  focused: boolean;
  classes: Record<string, boolean>;
}
export default function PickerGrid({ cells }: { cells: DayCell[] }) {
  return Array.from({ length: 6 }, (_, row) => (
    <div key={row} role="row">
      {cells.slice(row * 7, (row + 1) * 7).map((cell) => (
        <Button
          key={cell.key}
          role="gridcell"
          data-picker-date={cell.key}
          aria-label={cell.label}
          aria-selected={cell.selected}
          aria-current={cell.today ? "date" : undefined}
          tabIndex={cell.focused ? 0 : -1}
          disabled={cell.disabled}
          className={[
            "hw-button agenda-picker-day",
            ...Object.keys(cell.classes).filter((key) => cell.classes[key]),
          ].join(" ")}
        >
          <span>{cell.text}</span>
        </Button>
      ))}
    </div>
  ));
}
