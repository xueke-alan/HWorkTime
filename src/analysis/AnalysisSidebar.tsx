import { SidebarHeader } from "../workspace/SidebarLayout";
import Button from "antd/es/button";
import Card from "antd/es/card";
import Descriptions from "antd/es/descriptions";
import Typography from "antd/es/typography";
import { Fragment } from "react";
import { useLanguage } from "../ApplicationTheme";
import { sidebar, type SidebarView } from "./sidebar";
function Rows({ rows }: { rows: SidebarView["scope"] }) {
  return (
    <Descriptions
      className="analysis-sidebar-rows"
      size="small"
      column={1}
      colon={false}
      items={rows.map((row) => ({
        key: row.label,
        label: row.label,
        children: row.value,
      }))}
    />
  );
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
      <SidebarHeader className="analysis-sidebar-header">
        <p id="analysisSidebarMonth" className="calendar-today-number">
          {view?.month}
        </p>
        <h2 id="analysisSidebarTitle" className="calendar-today-weekday">
          {t("analysis.sidebarShortTitle")}
        </h2>
      </SidebarHeader>
      <Card
        className="analysis-sidebar-section"
        size="small"
        role="region"
        aria-labelledby="analysisObservationTitle"
      >
        <Typography.Title level={3} id="analysisObservationTitle">
          {t("analysis.sidebarObservation")}
        </Typography.Title>
        <Typography.Paragraph
          id="analysisObservation"
          className="analysis-observation"
        >
          {view?.observation}
        </Typography.Paragraph>
        <Typography.Paragraph
          id="analysisObservationContext"
          className="analysis-sidebar-muted"
        >
          {view?.context}
        </Typography.Paragraph>
      </Card>
      <Card
        className="analysis-sidebar-section"
        size="small"
        role="region"
        aria-labelledby="analysisFocusTitle"
      >
        <Typography.Title level={3} id="analysisFocusTitle">
          {t("analysis.sidebarFocus")}
        </Typography.Title>
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
              <Typography.Paragraph className="analysis-sidebar-muted analysis-focus-source">
                {focus.source}
              </Typography.Paragraph>
            </>
          ) : (
            t("analysis.sidebarNoFocus")
          )}
        </div>
      </Card>
      <Card
        className="analysis-sidebar-section"
        size="small"
        role="region"
        aria-labelledby="analysisScopeTitle"
      >
        <Typography.Title level={3} id="analysisScopeTitle">
          {t("analysis.sidebarScope")}
        </Typography.Title>
        <div id="analysisSidebarScope" className="analysis-sidebar-scope">
          {view && <Rows rows={view.scope} />}
          <Typography.Paragraph className="analysis-sidebar-muted">
            {view?.comparison}
          </Typography.Paragraph>
        </div>
      </Card>
    </section>
  );
}
