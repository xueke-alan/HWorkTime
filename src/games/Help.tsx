import Button from "antd/es/button";
import { QuestionIcon } from "../tabler-icons";
import { createPortal } from "react-dom";
import { useLanguage } from "../ApplicationTheme";
import { mountView } from "../mount-view";

interface Options {
  root: HTMLElement;
  controls: HTMLElement;
  signal: AbortSignal;
  text: () => string;
  onChange?: (open: boolean) => void;
}
function Help({
  panel,
  opened,
  description,
  toggle,
}: {
  panel: HTMLElement;
  opened: boolean;
  description: string;
  toggle: (open: boolean) => void;
}) {
  useLanguage();
  const t = (key: string) => WorkTimeApp.i18n.t("games." + key);
  return (
    <>
      <Button
        className="game-button game-icon-button"
        data-hint-text={t("help")}
        aria-label={t("help")}
        data-game-help=""
        aria-expanded={opened}
        onClick={() => toggle(true)}
        icon={<QuestionIcon />}
      />
      {createPortal(
        <>
          <h3>{t("help")}</h3>
          <p>{description}</p>
          <Button
            className="game-button"
            data-game-help-close=""
            onClick={() => toggle(false)}
          >
            {t("backToGame")}
          </Button>
        </>,
        panel,
      )}
    </>
  );
}
export function createGameHelp({
  root,
  controls,
  signal,
  text,
  onChange,
}: Options) {
  const host = document.createElement("span");
  host.style.display = "contents";
  controls.append(host);
  const view = mountView(host);
  const panel = document.createElement("section");
  panel.className = "game-help-screen";
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  root.append(panel);
  let opened = false;
  let inert: [HTMLElement, boolean][] = [];
  function refresh() {
    if (signal.aborted) return;
    panel.setAttribute("aria-label", WorkTimeApp.i18n.t("games.help"));
    view.render(<Help {...{ panel, opened, toggle }} description={text()} />);
  }
  function restore() {
    for (const [child, wasInert] of inert) child.inert = wasInert;
    inert = [];
  }
  function toggle(value: boolean) {
    if (opened === value || signal.aborted) return;
    opened = value;
    panel.hidden = !value;
    if (value) {
      inert = Array.from(root.children)
        .filter(
          (child): child is HTMLElement =>
            child instanceof HTMLElement && child !== panel,
        )
        .map((child) => [child, child.inert]);
      for (const [child] of inert) child.inert = true;
    } else restore();
    onChange?.(value);
    refresh();
    (value ? panel : host)
      .querySelector("button")
      ?.focus({ preventScroll: true });
  }
  panel.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Tab" && e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") toggle(false);
      else panel.querySelector("button")?.focus({ preventScroll: true });
    },
    { signal },
  );
  signal.addEventListener(
    "abort",
    () => {
      restore();
      view.dispose();
      panel.remove();
      host.remove();
    },
    { once: true },
  );
  refresh();
  return { refresh, isOpen: () => opened };
}
