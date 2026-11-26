import Button from "antd/es/button";
export default function AgendaDayFrame() {
  return (
    <>
      <div className="editor-day-header editor-mode-header agenda-heading">
        <div id="agendaDate" className="editor-date"></div>
      </div>
      <div className="agenda-day-toolbar" hidden data-ui="toolbar">
        <Button
          data-ui="button"
          id="agendaBack"
          htmlType="button"
          hidden
          className="hw-button ui-button icon-only"
        >
          <svg className="ui-icon" aria-hidden="true">
            <use href="#icon-chevron-left" />
          </svg>
        </Button>
        <h2 id="agendaFormTitle"></h2>
      </div>
      <div
        id="agendaCritical"
        className="agenda-critical"
        role="alert"
        hidden
      ></div>
      <section id="agendaDayDetails" className="agenda-day-details">
        <div id="agendaList" className="agenda-list" tabIndex={0}></div>
        <div className="agenda-list-actions" data-ui="toolbar">
          <Button
            data-ui="button"
            id="agendaNew"
            htmlType="button"
            data-agenda-text="new"
            className="hw-button ui-button primary"
          ></Button>
        </div>
      </section>
      <div className="agenda-editor-body">
        <form
          id="agendaForm"
          className="agenda-form"
          aria-labelledby="agendaFormTitle"
        >
          <fieldset data-ui="fieldset" id="agendaFields"></fieldset>
        </form>
      </div>
      <div className="agenda-feedback">
        <p id="agendaError" className="warnings" role="alert"></p>
        <p id="agendaStatus" role="status" aria-live="polite"></p>
      </div>
      <div className="agenda-editor-footer" hidden>
        <p
          id="agendaDraft"
          className="muted"
          role="status"
          hidden
          data-agenda-text="unsavedChanges"
        ></p>
        <div className="agenda-actions" data-ui="toolbar"></div>
      </div>
    </>
  );
}
