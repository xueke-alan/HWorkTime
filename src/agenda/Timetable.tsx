import type { CSSProperties } from "react";
import { mountView } from "../mount-view";

interface AxisMark {
  key: string;
  className: string;
  start: number;
  end: number;
  minute?: number;
  top: number;
  height?: number;
  label?: string;
}
interface EventSegment {
  key: string;
  id: string;
  title: string;
  note: string;
  status: string;
  statusLabel: string;
  tooltip: string;
  time: string;
  start: number;
  end: number | null;
  selected: boolean;
  draft: boolean;
  continuesBefore: boolean;
  continuesAfter: boolean;
  style: CSSProperties;
}
interface Column {
  date: string;
  label: string;
  selected: boolean;
  rest: boolean;
  surface: string;
  edge: string;
  style: CSSProperties;
  marks: AxisMark[];
  events: EventSegment[];
}
interface TimetableProps {
  columns: Column[];
  height: number;
  hidden: boolean;
  divider: CSSProperties;
}
function TimedEvent({ event, date }: { event: EventSegment; date: string }) {
  const classes = ["agenda-chip", "timetable-event"];
  if (event.status === "completed") classes.push("is-complete");
  if (event.selected) classes.push("is-selected");
  if (event.draft) classes.push("timetable-draft");
  if (event.end === null) classes.push("is-point");
  if (event.continuesBefore) classes.push("continues-before");
  if (event.continuesAfter) classes.push("continues-after");
  return (
    <button
      type="button"
      data-ui="button"
      className={classes.join(" ")}
      aria-current={event.selected}
      data-timetable-date={date}
      data-timetable-item={event.id}
      data-agenda-edit={event.draft ? undefined : event.id}
      data-status={event.status}
      data-axis-key={"event:" + event.id}
      data-axis-start={event.start}
      data-axis-end={event.end ?? event.start}
      tabIndex={event.draft ? -1 : undefined}
      data-hint-text={event.tooltip}
      style={event.style}
    >
      <span className="agenda-chip-title">
        <span className="agenda-chip-title-text">{event.title}</span>
        <span
          className="agenda-chip-status"
          data-status={event.status}
          role="img"
          aria-label={event.statusLabel}
        />
      </span>
      <span className="agenda-chip-time">{event.time}</span>
      {event.note.trim() && (
        <span className="agenda-chip-note">{event.note}</span>
      )}
      {!event.draft && event.end !== null && !event.continuesBefore && (
        <span
          className="timetable-resize timetable-resize-start"
          data-timetable-resize="start"
          aria-hidden="true"
        />
      )}
      {!event.draft && event.end !== null && !event.continuesAfter && (
        <span
          className="timetable-resize timetable-resize-end"
          data-timetable-resize="end"
          aria-hidden="true"
        />
      )}
    </button>
  );
}
function Timetable({ columns, height, divider, hidden }: TimetableProps) {
  return (
    <>
      <div
        className={"timetable-divider" + (hidden ? " is-content-hidden" : "")}
        style={divider}
        aria-hidden="true"
      />
      {columns.map((column) => (
        <div
          key={column.date}
          role="group"
          data-ui="group"
          aria-label={column.label}
          data-timetable-date={column.date}
          className={[
            "timetable-bottom-card",
            column.selected && "is-selected",
            column.rest && "is-rest",
            column.surface && "has-day-surface",
          ]
            .filter(Boolean)
            .join(" ")}
          style={
            {
              ...column.style,
              "--day-surface": column.surface || undefined,
              "--day-edge": column.edge || undefined,
            } as CSSProperties
          }
        >
          <div
            className="timetable-scroll"
            tabIndex={0}
            aria-label={column.label}
            style={{ opacity: hidden ? 0 : 1 }}
          >
            <div
              className="timetable-grid timetable-column"
              data-timetable-date={column.date}
              style={{ height }}
            >
              {column.marks.map((mark) => (
                <div
                  key={mark.key}
                  className={mark.className}
                  data-axis-key={mark.key}
                  data-axis-start={mark.start}
                  data-axis-end={mark.end}
                  data-minute={mark.minute}
                  style={{ top: mark.top, height: mark.height }}
                  data-hint-text={mark.label}
                  aria-label={mark.label}
                />
              ))}
              {column.events.map((event) => (
                <TimedEvent key={event.key} event={event} date={column.date} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
export function mountTimetable(host: HTMLElement) {
  const view = mountView(host);
  return {
    render(props: TimetableProps) {
      view.render(<Timetable {...props} />);
    },
    empty(label: string) {
      view.render(
        <div className="timetable-empty" role="status">
          {label}
        </div>,
      );
    },
    dispose: view.dispose,
  };
}
