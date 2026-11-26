import { version } from "../package.json";
import WorkspaceMenubar from "./workspace/WorkspaceMenubar";
import CalendarPanel from "./workspace/CalendarPanel";
import CalendarMascot from "./workspace/CalendarMascot";
import SummarySidebar from "./workspace/SummarySidebar";
import WorkEditor from "./workspace/WorkEditor";
import WorkspaceDialogs from "./workspace/WorkspaceDialogs";
import "./styles/workspace.css";
const menubar = <WorkspaceMenubar />;
const sidebar = <SummarySidebar />;
const calendar = <CalendarPanel />;
const editor = <WorkEditor />;
const dialogs = <WorkspaceDialogs />;

export default function WorkWorkspace({ stage }: { stage: number }) {
  return (
    <>
      <main className="wrap work-layout">
        <div className="workspace" data-ui="workspace">
          {stage >= 2 && <CalendarMascot />}
          <section className="work-main panel">
            <div className="work-body">
              {menubar}
              {stage >= 1 && sidebar}
              {stage >= 2 && calendar}
            </div>
            <footer className="calendar-footer">
              <div id="calendarFoot" className="calendar-foot"></div>
              <span className="site-meta">
                <span>HWorkTime</span> <span id="siteVersion">{version}</span>
                <span className="site-copyright">
                  <svg
                    className="copyright-mark"
                    viewBox="0 0 16 16"
                    role="img"
                    aria-label="版权"
                    data-i18n-aria-label="copy.b72ca18819"
                  >
                    <circle cx="8" cy="8" r="6.25" />
                    <path
                      transform="translate(0.7 0)"
                      d="M10 5.5C9.4 4.9 8.7 4.6 8 4.6C3.5 4.6 3.5 11.4 8 11.4C8.7 11.4 9.4 11.1 10 10.5"
                    />
                  </svg>
                  <a
                    href="https://github.com/xueke-alan/HWorkTime"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    2026 xueke-alan
                  </a>
                </span>
              </span>
              <div
                id="yearLegend"
                className="legend year-legend hidden"
                aria-label="热力图图例"
                data-i18n-aria-label="copy.16d4ac0d6d"
              ></div>
            </footer>
          </section>
          {stage >= 3 && editor}
        </div>
      </main>
      {stage >= 4 && dialogs}
    </>
  );
}
