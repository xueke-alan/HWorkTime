import Card from "antd/es/card";
import { useLanguage } from "../ApplicationTheme";

const groups = [
  [
    ["average", "yearView.annualAverage", "yearView.averageHint"],
    ["totalOvertime", "yearView.totalOvertime", "yearView.netHint"],
    ["workOvertime", "short.workOT"],
    ["dailyHours", "yearView.dailyHours", "yearView.dailyHoursHint"],
  ],
  [
    ["total", "copy.016315b388"],
    ["attendance", "copy.7a26926ed7"],
    ["leaveDays", "yearView.leaveDays", "yearView.leaveDaysHint"],
    ["leaveHours", "summary.leaveHours"],
  ],
  [
    ["restOvertimeDays", "short.restOT", "yearView.restDaysHint"],
    ["weekendOvertimeDays", "yearView.weekendOvertime"],
    ["holidayOvertimeDays", "yearView.holidayOvertime"],
  ],
];

export default function YearReport() {
  useLanguage();
  const { t } = WorkTimeApp.i18n;
  return (
    <>
      <div id="yearAnalysisCards" className="year-analysis-cards">
        {groups.map((metrics) => (
          <Card
            key={metrics[0][0]}
            className="year-report-card overview-metric-card"
            data-summary-card={metrics[0][0] === "total" ? "totals" : undefined}
            data-ui="card"
          >
            <dl className="overview-totals">
              {metrics.map(([key, label, hint], index) => (
                <div
                  key={key}
                  data-year-metric={key}
                  className={
                    index === 0
                      ? "overview-metric-heading"
                      : "overview-detail-row"
                  }
                >
                  <dt data-hint-text={hint ? t(hint) : undefined}>
                    {t(label)}
                  </dt>
                  <dd className="year-report-value" />
                </div>
              ))}
            </dl>
          </Card>
        ))}
      </div>
    </>
  );
}
