import Button from "antd/es/button";
import { Fragment } from "react";
import { useLanguage } from "../ApplicationTheme";
import { sidebar, type SidebarView } from "./sidebar";
function Rows({ rows }: { rows: SidebarView["scope"] }) {
  return rows.map((row) => (
    <div key={row.label} className="analysis-sidebar-row">
      <span>{row.label}</span>
      <strong>{row.value}</strong>
    </div>
  ));
}
export default function AnalysisSidebar() {
  useLanguage();
  const { t } = WorkTimeApp.i18n;
  const { value: view } = sidebar.useSnapshot();
  const focus = view?.focus;
  return (
    <section
      id="analysisSidebar"
      className="analysis-sidebar"
      hidden
      aria-labelledby="analysisSidebarTitle"
    >
      <header className="analysis-sidebar-header">
        <p id="analysisSidebarMonth" className="calendar-today-number">
          {view?.month}
        </p>
        <h2 id="analysisSidebarTitle" className="calendar-today-weekday">
          {t("analysis.sidebarShortTitle")}
        </h2>
      </header>
      <section className="analysis-sidebar-section" data-ui="panel">
        <h3>{t("analysis.sidebarObservation")}</h3>
        <p id="analysisObservation" className="analysis-observation">
          {view?.observation}
        </p>
        <p id="analysisObservationContext" className="analysis-sidebar-muted">
          {view?.context}
        </p>
      </section>
      <section className="analysis-sidebar-section" data-ui="panel">
        <h3>{t("analysis.sidebarFocus")}</h3>
        <div
          id="analysisFocusDates"
          className="analysis-focus-dates"
          aria-label={t("analysis.sidebarFocus")}
          data-ui="group"
          role="group"
        >
          {view?.choices.map((choice) => (
            <Button
              key={choice.date}
              data-analysis-focus={choice.date}
              aria-pressed={choice.date === view.pinned}
              className="hw-button ui-button"
            >
              {choice.label}
            </Button>
          ))}
        </div>
        <div
          id="analysisFocusDetail"
          className="analysis-focus-detail"
          aria-live={view?.live ?? "polite"}
          aria-atomic="true"
        >
          {focus ? (
            <>
              <div className="analysis-focus-heading">
                <strong>{focus.title}</strong>
                <span>{focus.kind}</span>
              </div>
              <div className="analysis-focus-times">
                {focus.times.map((time, index) => (
                  <Fragment key={index}>
                    {index > 0 && (
                      <svg className="ui-icon" aria-hidden="true">
                        <use href="#icon-arrow-forward" />
                      </svg>
                    )}
                    <strong>
                      {time.next && <small>{t("analysis.nextDay")}</small>}
                      {time.clock}
                    </strong>
                  </Fragment>
                ))}
              </div>
              <Rows rows={focus.rows} />
              <p className="analysis-sidebar-muted analysis-focus-source">
                {focus.source}
              </p>
            </>
          ) : (
            t("analysis.sidebarNoFocus")
          )}
        </div>
      </section>
      <section className="analysis-sidebar-section" data-ui="panel">
        <h3>{t("analysis.sidebarScope")}</h3>
        <div id="analysisSidebarScope" className="analysis-sidebar-scope">
          {view && <Rows rows={view.scope} />}
          <p className="analysis-sidebar-muted">{view?.comparison}</p>
        </div>
      </section>
    </section>
  );
}
