<script setup lang="ts">
import {
  QiChevronLeft,
  QiChevronRight,
  QiCrosshair,
  QiRotateCcw,
} from "qingicon-vue";
import AnalysisMetrics from "../analysis/AnalysisMetrics.vue";
import Button from "primevue/button";
import { version } from "../../package.json";
</script>
<template>
  <section class="panel">
    <div class="panel-head">
      <div class="row between">
        <div class="row month-controls">
          <Button
            id="prevMonth"
            data-action-hint
            class="ui-button iconbtn icon-only"
            aria-label="上个月"
            data-i18n-aria-label="copy.69bb1687b5"
            ><QiChevronLeft class="ui-icon" aria-hidden="true"
          /></Button>
          <Button
            type="button"
            id="monthTitle"
            data-action-hint="calendarHint.yearView"
            class="month-title"
            tabindex="0"
            aria-label="切换到年视图"
            aria-pressed="false"
            data-i18n-aria-label="copy.d298e51191"
            ><span
              id="monthTitleYear"
              class="month-title-year"
              data-number-motion
            ></span
            ><svg
              class="month-title-divider"
              viewBox="0 0 12 24"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M9 4 3 20"
                fill="none"
                stroke="currentColor"
                stroke-width="3.2"
                stroke-linecap="round"
              /></svg
            ><span
              id="monthTitleMonth"
              class="month-title-month"
              data-number-motion
            ></span
          ></Button>
          <Button
            id="nextMonth"
            data-action-hint
            class="ui-button iconbtn icon-only"
            aria-label="下个月"
            data-i18n-aria-label="copy.8c9b38e26d"
            ><QiChevronRight class="ui-icon" aria-hidden="true" /></Button
          ><Button
            id="todayButton"
            data-action-hint
            class="ui-button icon-only"
            type="button"
            aria-label="当月"
            data-i18n-aria-label="calendarHint.thisMonth"
            ><QiCrosshair class="ui-icon" aria-hidden="true" /></Button
          ><Button
            id="analysisToggle"
            data-action-hint
            class="ui-button icon-only"
            type="button"
            aria-label="作息分析"
            title="作息分析"
            aria-controls="analysisPage"
            aria-pressed="false"
            data-i18n-aria-label="analysis.toggle"
            data-i18n-title="analysis.toggle"
            ><svg class="ui-icon" aria-hidden="true">
              <use href="#ui-calendar-analysis" /></svg
          ></Button>
        </div>
        <div class="calendar-toolbar-actions">
          <Button
            id="batchToggle"
            data-action-hint
            class="ui-button icon-only"
            type="button"
            aria-label="批量填写"
            title="批量填写"
            data-i18n-aria-label="copy.3f712eac83"
            data-i18n-title="copy.3f712eac83"
            ><svg class="ui-icon" aria-hidden="true">
              <use href="#ms-stacks" /></svg></Button
          ><Button
            id="restore"
            data-action-hint="calendarHint.importBackup"
            class="ui-button icon-only"
            type="button"
            aria-label="导入备份文件"
            title="导入备份文件"
            data-i18n-aria-label="backup.importFile"
            data-i18n-title="backup.importFile"
            ><QiRotateCcw class="ui-icon" aria-hidden="true" /></Button
          ><Button
            id="pageSettingsOpen"
            data-action-hint="calendarHint.settings"
            class="ui-button icon-only"
            type="button"
            aria-label="我的设置"
            title="我的设置"
            aria-controls="settingsPane"
            aria-expanded="false"
            aria-pressed="false"
            data-i18n-aria-label="copy.165118b1d4"
            data-i18n-title="copy.165118b1d4"
            ><svg class="ui-icon" aria-hidden="true">
              <use href="#ms-settings" /></svg
          ></Button>
        </div>
      </div>
    </div>
    <div class="panel-content-viewport">
      <div id="panelContent" class="panel-content">
        <section
          id="analysisPage"
          class="analysis-page"
          aria-labelledby="analysisHeading"
          hidden
        >
          <div class="analysis-heading">
            <div class="analysis-title">
              <h2 id="analysisHeading" data-i18n-text='{"0":"analysis.title"}'>
                本月作息
              </h2>
            </div>
          </div>
          <AnalysisMetrics />
          <div id="analysisDetails">
            <div class="analysis-chart-heading">
              <div class="analysis-section-title">
                <h2 data-i18n-text='{"0":"analysis.dailyChart"}'>每日上下班</h2>
              </div>
              <span class="analysis-chart-legend"
                ><span
                  ><i class="analysis-legend-dot" aria-hidden="true"></i
                  ><span data-i18n-text='{"0":"analysis.observed"}'
                    >实际记录</span
                  ></span
                ><span
                  ><i
                    class="analysis-legend-dot analysis-legend-manual"
                    aria-hidden="true"
                  ></i
                  ><span data-i18n-text='{"0":"analysis.manualRecord"}'
                    >含手录数据</span
                  ></span
                ><span
                  ><i
                    class="analysis-legend-dot analysis-legend-rest-overtime"
                    aria-hidden="true"
                  ></i
                  ><span data-i18n-text='{"0":"analysis.restOvertime"}'
                    >休息日加班</span
                  ></span
                ><span
                  ><i class="analysis-legend-late" aria-hidden="true"></i
                  ><span data-i18n-text='{"0":"analysis.lateMark"}'
                    >21:00 后</span
                  ></span
                ></span
              >
            </div>
            <div
              id="analysisChart"
              class="analysis-chart"
              tabindex="0"
              role="region"
              data-i18n-aria-label="analysis.chart"
              aria-label="每日上下班时间"
            >
              <div id="analysisPlot" class="analysis-plot-viewport"></div>
              <div
                id="analysisHover"
                class="analysis-hover"
                aria-live="polite"
                aria-atomic="true"
                hidden
              ></div>
            </div>
            <div
              id="analysisTimelineLegend"
              class="analysis-timeline-legend"
            ></div>
          </div>
        </section>
        <div class="weekdays">
          <span data-i18n-text='{"0":"calendar.weekday.mon"}'>一</span
          ><span data-i18n-text='{"0":"calendar.weekday.tue"}'>二</span
          ><span data-i18n-text='{"0":"calendar.weekday.wed"}'>三</span
          ><span data-i18n-text='{"0":"calendar.weekday.thu"}'>四</span
          ><span data-i18n-text='{"0":"calendar.weekday.fri"}'>五</span
          ><span data-i18n-text='{"0":"calendar.weekday.sat"}'>六</span
          ><span data-i18n-text='{"0":"calendar.weekday.sun"}'>日</span>
        </div>
        <div id="calendar" class="calendar"></div>
        <div id="yearWatermark" class="year-watermark" aria-hidden="true"></div>
      </div>
    </div>
    <div class="calendar-footer">
      <div id="calendarFoot" class="calendar-foot"></div>
      <span class="site-meta"
        ><span>HWorkTime</span> <span id="siteVersion">{{ version }}</span>
        <span class="site-copyright"
          ><svg
            class="copyright-mark"
            viewBox="0 0 16 16"
            role="img"
            aria-label="版权"
            data-i18n-aria-label="copy.b72ca18819"
          >
            <circle cx="8" cy="8" r="6.25" />
            <path
              transform="translate(0.7 0)"
              d="M10 5.5C9.4 4.9 8.7 4.6 8 4.6C3.5 4.6 3.5 11.4 8 11.4C8.7 11.4 9.4 11.1 10 10.5"
            /></svg
          ><a
            href="https://github.com/xueke-alan/WorkTime"
            target="_blank"
            rel="noopener noreferrer"
            >2026 xueke-alan</a
          ></span
        ></span
      >
      <div
        id="yearLegend"
        class="legend year-legend hidden"
        aria-label="热力图图例"
        data-i18n-aria-label="copy.16d4ac0d6d"
      ></div>
    </div>
  </section>
</template>
