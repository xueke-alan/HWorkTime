import Button from "antd/es/button";
export default function AgendaScheduleFields({ prefix }: { prefix: string }) {
  return (
    <>
      <label
        htmlFor={prefix + "ScheduleOpen"}
        data-schedule-label="dateTime"
      ></label>
      <Button
        data-ui="button"
        id={prefix + "ScheduleOpen"}
        htmlType="button"
        className="hw-button agenda-schedule-input"
      >
        <svg className="ui-icon" aria-hidden="true">
          <use href="#icon-calendar" />
        </svg>
        <span id={prefix + "ScheduleSummary"}></span>
        <svg className="ui-icon" aria-hidden="true">
          <use href="#icon-chevron-right" />
        </svg>
      </Button>
      <div
        id={prefix + "SchedulePopup"}
        className="agenda-date-picker agenda-schedule agenda-schedule-popup is-range"
        popover="auto"
        role="dialog"
      >
        <div className="agenda-schedule-heading">
          <strong id={prefix + "ScheduleLabel"}>
            <svg className="ui-icon" aria-hidden="true">
              <use href="#icon-calendar" />
            </svg>
            <span data-schedule-label="dateTime"></span>
          </strong>
        </div>
        <div className="agenda-schedule-options">
          <label className="agenda-schedule-toggle">
            <input
              data-ui="input"
              id={prefix + "AllDay"}
              type="checkbox"
              role="switch"
              defaultChecked
              className="hw-check"
            />
            <span
              className="agenda-schedule-toggle-track"
              aria-hidden="true"
            ></span>
            <span data-schedule-label="allDay"></span>
          </label>
        </div>
        <div className="agenda-schedule-range" role="group">
          <div className="agenda-field" data-schedule-endpoint="start">
            <label
              htmlFor={prefix + "DateInput"}
              data-schedule-label="startDate"
            ></label>
            <div className="agenda-date-input">
              <input
                data-ui="input"
                id={prefix + "DateInput"}
                type="date"
                min="1900-01-01"
                max="9999-12-31"
                className="hw-field"
              />
              <Button
                data-ui="button"
                id={prefix + "DateOpen"}
                className="hw-button agenda-date-open"
                htmlType="button"
              >
                <svg className="ui-icon" aria-hidden="true">
                  <use href="#icon-calendar" />
                </svg>
              </Button>
            </div>
          </div>
          <span className="agenda-range-separator" aria-hidden="true">
            <svg className="ui-icon" aria-hidden="true">
              <use href="#icon-arrow-forward" />
            </svg>
          </span>
          <div className="agenda-field" data-schedule-endpoint="end">
            <label
              htmlFor={prefix + "EndDateInput"}
              data-schedule-label="endDate"
            ></label>
            <div className="agenda-date-input">
              <input
                data-ui="input"
                id={prefix + "EndDateInput"}
                type="date"
                min="1900-01-01"
                max="9999-12-31"
                className="hw-field"
              />
              <Button
                data-ui="button"
                id={prefix + "EndDateOpen"}
                className="hw-button agenda-date-open"
                htmlType="button"
              >
                <svg className="ui-icon" aria-hidden="true">
                  <use href="#icon-calendar" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
        <div
          id={prefix + "RangeStatus"}
          className="agenda-schedule-status"
          role="status"
          aria-live="polite"
        ></div>
        <div className="agenda-schedule-calendars">
          <div id={prefix + "StartCalendar"}></div>
          <div id={prefix + "EndCalendar"}></div>
        </div>
        <div className="agenda-schedule-row agenda-schedule-times">
          <div className="agenda-field agenda-schedule-time" hidden>
            <label
              htmlFor={prefix + "Start"}
              data-schedule-label="start"
            ></label>
            <input
              data-ui="input"
              id={prefix + "Start"}
              type="time"
              className="hw-field"
            />
          </div>
          <div className="agenda-field agenda-schedule-time" hidden>
            <label htmlFor={prefix + "End"}></label>
            <input
              data-ui="input"
              id={prefix + "End"}
              type="time"
              className="hw-field"
            />
          </div>
        </div>
        <div className="agenda-picker-footer">
          <Button
            data-ui="button"
            htmlType="button"
            data-schedule-today=""
            data-schedule-label="pickerToday"
            className="hw-button ui-button"
          ></Button>
          <Button
            data-ui="button"
            htmlType="button"
            data-schedule-close=""
            data-schedule-label="pickerDone"
            className="hw-button ui-button primary"
          ></Button>
        </div>
      </div>
    </>
  );
}
