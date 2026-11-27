import Button from "antd/es/button";
import { CalendarIcon } from "../tabler-icons";
import { useLanguage } from "../ApplicationTheme";
import { mountView } from "../mount-view";
import { practiceViews } from "./PracticeViews";

const pages = ["courses", "practice", "challenges", "statistics"];
function TypingWorkspace({
  current,
  navigate,
  close,
}: {
  current: string;
  navigate: (page: string) => void;
  close: () => void;
}) {
  useLanguage();
  const { t } = WorkTimeApp.i18n;
  const exitLabel = t("workspace.returnCalendar");
  return (
    <>
      <div className="game-surface" aria-hidden="true" />
      <header className="typing-toolbar workspace-toolbar" data-ui="toolbar">
        <Button
          id="typingExitButton"
          data-hint-text={exitLabel}
          aria-label={exitLabel}
          onClick={close}
          className="hw-button ui-button icon-only workspace-toolbar-action"
          icon={<CalendarIcon aria-hidden="true" />}
        />
        <div className="typing-heading">
          <h2 id="typingTitle">{t("typing.title")}</h2>
        </div>
      </header>
      <div className="typing-main">
        <div className="typing-section-bar">
          <nav
            className="typing-navigation"
            aria-label={t("typing.title")}
            data-ui="nav"
          >
            {pages.map((page) => (
              <Button
                key={page}
                aria-current={current === page ? "page" : false}
                onClick={() => navigate(page)}
                className="hw-button typing-button"
              >
                {t("typing." + page)}
              </Button>
            ))}
          </nav>
        </div>
        <div className="typing-content" />
        <div className="typing-notice" hidden data-ui="status" role="status" />
      </div>
    </>
  );
}
export function mountTyping(
  shell: HTMLElement,
  navigate: (page: string) => void,
  close: () => void,
) {
  const view = mountView(shell);
  function setPage(page: string) {
    view.render(
      <TypingWorkspace current={page} navigate={navigate} close={close} />,
    );
  }
  setPage("courses");
  const practice = practiceViews();
  return {
    setPage,
    practice,
    dispose() {
      practice.reset();
      view.dispose();
    },
  };
}
