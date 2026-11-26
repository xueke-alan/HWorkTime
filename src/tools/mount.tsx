import Button from "antd/es/button";
import { useLanguage } from "../ApplicationTheme";
import { mountView } from "../mount-view";

export interface ToolEntry {
  id: string;
  trigger: string;
  label: string;
  description: string;
  development: boolean;
}
const toolIcons: Record<string, string> = {
  reader: "menu-book",
  typing: "keyboard",
  vocabulary: "translate",
  games: "sports-esports",
  music: "music-notes",
};
type ToolDirectoryProps = {
  entries: ToolEntry[];
  active: string;
  development: boolean;
  open: (id: string) => void;
  back: () => void;
};
function ToolDirectory({
  entries,
  active,
  development,
  open,
  back,
}: ToolDirectoryProps) {
  useLanguage();
  const { t } = WorkTimeApp.i18n;
  return (
    <>
      <Button
        hidden={active === "tools" || active === "vocabulary"}
        onClick={back}
        className="hw-button ui-text-action tools-back"
      >
        {t("tools.back")}
      </Button>
      <div className="tools-cards" hidden={active !== "tools"}>
        {entries.map((entry) => (
          <Button
            key={entry.id}
            id={entry.trigger}
            hidden={entry.development && !development}
            data-hint-text={t(entry.description)}
            onClick={() => open(entry.id)}
            className="hw-button tool-card"
          >
            <svg
              className="tool-logo"
              viewBox="0 0 256 256"
              fill="currentColor"
              aria-hidden="true"
            >
              <use href={"#icon-" + toolIcons[entry.id]} />
            </svg>
            <strong>{t(entry.label)}</strong>
            <span data-ui="status" role="status" />
          </Button>
        ))}
      </div>
    </>
  );
}
export function mountToolDirectory(
  host: HTMLElement,
  entries: ToolEntry[],
  open: (id: string) => void,
  back: () => void,
) {
  const view = mountView(host);
  function refresh(active: string, development: boolean) {
    view.render(
      <ToolDirectory
        entries={entries}
        open={open}
        back={back}
        active={active}
        development={development}
      />,
    );
  }
  refresh("tools", false);
  return {
    refresh,
    focus(id: string) {
      document.getElementById(id)?.focus({ preventScroll: true });
    },
    dispose: view.dispose,
  };
}
