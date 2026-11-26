import Button from "antd/es/button";
export interface ScheduleChoice {
  title: string;
  selected: boolean;
  label: string;
  hours: string;
  detail: string;
}
export default function ScheduleChoices({
  items,
}: {
  items: ScheduleChoice[];
}) {
  return items.map((item, index) => (
    <Button
      key={index}
      data-schedule-index={index}
      aria-pressed={item.selected}
      aria-label={item.label}
      className="hw-button ui-button schedule-list-item"
    >
      <span className="schedule-card-heading">
        <strong>{item.title}</strong>
        <span className="schedule-card-hours">{item.hours} h</span>
      </span>
      <small className="schedule-card-details">
        <span>{item.detail}</span>
      </small>
    </Button>
  ));
}
