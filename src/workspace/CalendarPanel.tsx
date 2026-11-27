import Button from "antd/es/button";
import AnalysisMetrics from "../analysis/AnalysisMetrics";
import AnalysisHover from "../analysis/AnalysisHover";
import CalendarGrid from "./CalendarGrid";
import CalendarSourceHint from "./CalendarSourceHint";

export default function CalendarPanel() {
  return (
    <>
      <section className="panel" data-ui="panel">
        <div className="panel-content-viewport">
          <div id="panelContent" className="panel-content">
            <section
              id="analysisPage"
              className="analysis-page"
              data-i18n-aria-label="analysis.title"
              aria-label="本月作息"
              hidden
            >
              <AnalysisMetrics />
              <div id="analysisDetails">
                <div
                  id="analysisChart"
                  className="analysis-chart"
                  tabIndex={0}
                  role="region"
                  data-i18n-aria-label="analysis.chart"
                  aria-label="每日上下班时间"
                >
                  <div
                    id="analysisPlot"
                    className="analysis-plot-viewport"
                  ></div>
                  <AnalysisHover />
                </div>
                <div className="analysis-legends">
                  <span className="analysis-chart-legend">
                    <span>
                      <i className="analysis-legend-dot" aria-hidden="true"></i>
                      <span data-i18n-text='{"0":"analysis.observed"}'>
                        实际记录
                      </span>
                    </span>
                    <span>
                      <i
                        className="analysis-legend-dot analysis-legend-manual"
                        aria-hidden="true"
                      ></i>
                      <span data-i18n-text='{"0":"analysis.manualRecord"}'>
                        含手录数据
                      </span>
                    </span>
                    <span>
                      <i
                        className="analysis-legend-dot analysis-legend-rest-overtime"
                        aria-hidden="true"
                      ></i>
                      <span data-i18n-text='{"0":"analysis.restOvertime"}'>
                        休息日加班
                      </span>
                    </span>
                    <span>
                      <i
                        className="analysis-legend-late"
                        aria-hidden="true"
                      ></i>
                      <span data-i18n-text='{"0":"analysis.lateMark"}'>
                        21:00 后
                      </span>
                    </span>
                  </span>
                  <div
                    id="analysisTimelineLegend"
                    className="analysis-timeline-legend"
                  ></div>
                </div>
              </div>
            </section>
            <div className="weekdays">
              <span data-i18n-text='{"0":"calendar.weekday.mon"}'>一</span>
              <span data-i18n-text='{"0":"calendar.weekday.tue"}'>二</span>
              <span data-i18n-text='{"0":"calendar.weekday.wed"}'>三</span>
              <span data-i18n-text='{"0":"calendar.weekday.thu"}'>四</span>
              <span data-i18n-text='{"0":"calendar.weekday.fri"}'>五</span>
              <span data-i18n-text='{"0":"calendar.weekday.sat"}'>六</span>
              <span data-i18n-text='{"0":"calendar.weekday.sun"}'>日</span>
            </div>
            <CalendarGrid />
            <div
              id="yearWatermark"
              className="year-watermark"
              aria-hidden="true"
            ></div>
          </div>
        </div>
      </section>
      <CalendarSourceHint />
    </>
  );
}
