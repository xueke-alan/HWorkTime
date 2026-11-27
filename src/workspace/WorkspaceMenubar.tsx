import Button from "antd/es/button";
import ToolbarSegmented from "./ToolbarSegmented";
import { useLayoutEffect, useRef, useReducer, useState } from "react";
import {
  CalendarTimeIcon,
  ChartLineUpIcon,
  CalendarDotsIcon,
  GearSixIcon,
  CaretLeftIcon,
  CaretRightIcon,
  MapPinSimpleAreaIcon,
  FloppyDiskIcon,
  StackIcon,
} from "../tabler-icons";
import { useLanguage } from "../ApplicationTheme";
import "../styles/menubar.css";
export type WorkspaceView = "calendar" | "analysis" | "agenda";

export default function WorkspaceMenubar() {
  useLanguage();
  const { t } = WorkTimeApp.i18n;
  const header = useRef<HTMLElement>(null);
  const viewControl = useRef<HTMLDivElement>(null);
  const actions = useRef<HTMLDivElement>(null);
  const batchToggle = useRef<HTMLButtonElement | HTMLAnchorElement>(null);
  const settingsToggle = useRef<HTMLButtonElement | HTMLAnchorElement>(null);
  const [, refresh] = useReducer((n: number) => n + 1, 0);
  const [pending, setPending] = useState<{ view: WorkspaceView } | null>(null);
  useLayoutEffect(() => {
    const bar = header.current!;
    const months = bar.querySelector<HTMLElement>(".month-controls")!;
    const views = viewControl.current!;
    const size = new ResizeObserver((entries) => {
      const entry = entries.find((entry) => entry.target === bar);
      if (entry)
        bar
          .closest<HTMLElement>(".workspace")
          ?.style.setProperty(
            "--workspace-toolbar-height",
            entry.borderBoxSize[0].blockSize + "px",
          );
      bar.toggleAttribute(
        "data-views-inline",
        views.getBoundingClientRect().top <
          months.getBoundingClientRect().bottom,
      );
    });
    for (const element of [bar, months, views, views.parentElement!])
      size.observe(element);
    const observer = new MutationObserver(refresh);
    observer.observe(actions.current!, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [
        "hidden",
        "inert",
        "disabled",
        "aria-label",
        "aria-pressed",
      ],
    });
    for (const button of [
      batchToggle.current!,
      settingsToggle.current!,
      document.getElementById("monthTitle")!,
    ])
      observer.observe(button, { attributeFilter: ["aria-pressed"] });
    window.addEventListener("hashchange", refresh);
    refresh();
    return () => {
      size.disconnect();
      observer.disconnect();
      window.removeEventListener("hashchange", refresh);
    };
  }, []);
  const analysis = document.getElementById(
    "analysisToggle",
  ) as HTMLButtonElement | null;
  const agenda = document.getElementById(
    "agendaMode",
  ) as HTMLButtonElement | null;
  const development = WorkTimeApp.isDevelopmentEnabled();
  const yearMode =
    document.getElementById("monthTitle")?.getAttribute("aria-pressed") ===
    "true";
  const current =
    analysis?.getAttribute("aria-pressed") === "true"
      ? "analysis"
      : development && agenda?.getAttribute("aria-pressed") === "true"
        ? "agenda"
        : yearMode
          ? ""
          : "calendar";
  const selectedView =
    pending?.view === "agenda" && !development
      ? current
      : (pending?.view ?? current);
  const batchPressed =
    batchToggle.current?.getAttribute("aria-pressed") === "true";
  const settingsPressed =
    settingsToggle.current?.getAttribute("aria-pressed") === "true";
  const options = (
    [
      {
        value: "calendar",
        icon: CalendarTimeIcon,
        label: t("agenda.attendance"),
        target: current === "agenda" ? agenda : analysis,
      },
      {
        value: "analysis",
        icon: ChartLineUpIcon,
        label: t("analysis.toggle"),
        target: analysis,
      },
      {
        value: "agenda",
        icon: CalendarDotsIcon,
        label: t("agenda.agenda"),
        target: agenda,
      },
    ] as const
  )
    .filter((option) => development || option.value !== "agenda")
    .map((option) => ({
      ...option,
      disabled:
        !WorkTimeApp.ui.selectWorkspaceView ||
        !option.target ||
        option.target.disabled ||
        !!option.target.closest("[inert],[hidden]"),
    }));
  return (
    <>
      <header className="sidebar-brand">
        <h1>
          <img
            className="sidebar-brand-logo"
            src="assets/icons/hworktime-wordmark.svg"
            alt="HWorkTime"
            width={385}
            height={50}
            draggable={false}
          />
        </h1>
      </header>
      <header ref={header} className="workspace-header panel-head">
        <div className="workspace-header-controls">
          <div className="row month-controls" data-ui="toolbar">
            <Button
              size="large"
              id="prevMonth"
              data-action-hint=""
              aria-label="上个月"
              data-i18n-aria-label="copy.69bb1687b5"
              className="hw-button ui-button iconbtn icon-only"
              htmlType="button"
              icon={<CaretLeftIcon size="1em" />}
            />
            <Button
              size="large"
              htmlType="button"
              id="monthTitle"
              type="text"
              data-action-hint="calendarHint.yearView"
              tabIndex={0}
              aria-label="切换到年视图"
              aria-pressed="false"
              data-i18n-aria-label="copy.d298e51191"
              className="hw-button month-title year-month-label"
            >
              <span
                id="monthTitleYear"
                className="month-title-year year-month-year"
                data-number-motion=""
              ></span>
              <span
                className="calendar-date-divider month-title-divider"
                aria-hidden="true"
              >
                /
              </span>
              <span
                id="monthTitleMonth"
                className="month-title-month year-month-month"
                data-number-motion=""
              ></span>
            </Button>
            <Button
              size="large"
              id="nextMonth"
              data-action-hint=""
              aria-label="下个月"
              data-i18n-aria-label="copy.8c9b38e26d"
              className="hw-button ui-button iconbtn icon-only"
              htmlType="button"
              icon={<CaretRightIcon size="1em" />}
            />
            <Button
              size="large"
              id="todayButton"
              data-action-hint=""
              htmlType="button"
              aria-label="当月"
              data-i18n-aria-label="calendarHint.thisMonth"
              className="hw-button ui-button icon-only"
              icon={<MapPinSimpleAreaIcon size="1em" />}
            />
            <span className="workspace-view-divider" aria-hidden="true" />
          </div>
          <ToolbarSegmented<WorkspaceView | "">
            controlRef={viewControl}
            className="workspace-views"
            aria-label={t("workspace.views")}
            value={selectedView}
            options={options.map(({ value, label, icon: Icon, disabled }) => ({
              value,
              icon: <Icon size="1em" aria-hidden="true" />,
              label: <span data-view={value}>{label}</span>,
              disabled,
            }))}
            onChange={async (view) => {
              if (!view) return;
              const request = { view };
              setPending(request);
              try {
                await WorkTimeApp.ui.selectWorkspaceView?.(view);
              } finally {
                setPending((latest) => (latest === request ? null : latest));
              }
            }}
          />
          <div
            className="workspace-tool-buttons"
            role="group"
            aria-label={t("workspace.tools")}
          >
            <div className="workspace-context-actions agenda-toolbar-region">
              <div className="agenda-toolbar-slot">
                <Button
                  ref={batchToggle}
                  size="large"
                  color={batchPressed ? "primary" : "default"}
                  variant={batchPressed ? "solid" : "outlined"}
                  id="batchToggle"
                  data-action-hint=""
                  htmlType="button"
                  aria-label="批量填写"
                  aria-pressed="false"
                  data-hint-text="批量填写"
                  data-i18n-aria-label="copy.3f712eac83"
                  data-i18n-hint-text="copy.3f712eac83"
                  className="hw-button ui-button icon-only"
                  icon={<StackIcon size="1em" />}
                />
              </div>
              <span className="workspace-action-divider" aria-hidden="true" />
            </div>
            <div className="workspace-permanent-actions">
              <Button
                size="large"
                id="restore"
                data-action-hint="calendarHint.importBackup"
                htmlType="button"
                aria-label="导入备份文件"
                data-hint-text="导入备份文件"
                data-i18n-aria-label="backup.importFile"
                data-i18n-hint-text="backup.importFile"
                className="hw-button ui-button icon-only"
                icon={<FloppyDiskIcon size="1em" />}
              />
              <Button
                ref={settingsToggle}
                size="large"
                color={settingsPressed ? "primary" : "default"}
                variant={settingsPressed ? "solid" : "outlined"}
                id="pageSettingsOpen"
                data-action-hint="calendarHint.settings"
                htmlType="button"
                aria-label="我的设置"
                data-hint-text="我的设置"
                aria-controls="settingsPane"
                aria-expanded="false"
                aria-pressed="false"
                data-i18n-aria-label="copy.165118b1d4"
                data-i18n-hint-text="copy.165118b1d4"
                className="hw-button ui-button icon-only"
                icon={<GearSixIcon size="1em" />}
              />
            </div>
          </div>
        </div>
        <div
          ref={actions}
          className="workspace-command-host"
          aria-hidden="true"
        >
          <Button
            id="analysisToggle"
            data-action-hint=""
            htmlType="button"
            aria-label="分析"
            data-hint-text="分析"
            aria-controls="analysisPage"
            aria-pressed="false"
            data-i18n-aria-label="analysis.toggle"
            data-i18n-hint-text="analysis.toggle"
            className="hw-button ui-button icon-only"
            icon={<ChartLineUpIcon size="1em" />}
          />
        </div>
      </header>
    </>
  );
}
