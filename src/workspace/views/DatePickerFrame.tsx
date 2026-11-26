import Button from "antd/es/button";
export default function DatePickerFrame() {
  return (
    <>
      <div className="agenda-picker-heading">
        <Button
          data-ui="button"
          htmlType="button"
          data-picker-step="-1"
          className="hw-button ui-button icon-only"
        >
          <svg className="ui-icon" aria-hidden="true">
            <use href="#icon-chevron-left" />
          </svg>
        </Button>
        <strong className="agenda-picker-month" aria-live="polite"></strong>
        <Button
          data-ui="button"
          htmlType="button"
          data-picker-step="1"
          className="hw-button ui-button icon-only"
        >
          <svg className="ui-icon" aria-hidden="true">
            <use href="#icon-chevron-right" />
          </svg>
        </Button>
      </div>
      <div className="agenda-picker-weekdays" aria-hidden="true"></div>
      <div className="agenda-picker-grid" role="grid"></div>
      <div className="agenda-picker-footer">
        <Button
          data-ui="button"
          htmlType="button"
          data-picker-today=""
          className="hw-button ui-button"
        ></Button>
        <Button
          data-ui="button"
          htmlType="button"
          data-picker-close=""
          className="hw-button ui-button"
        ></Button>
      </div>
    </>
  );
}
