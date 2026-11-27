import Button from "antd/es/button";
import { ArrowCounterClockwiseIcon } from "../tabler-icons";
import { createPortal } from "react-dom";
import { mountView } from "../mount-view";

type Game = "snake" | "link" | "sudoku" | "jump" | "garden";
interface Choice {
  id: string;
  label: string;
  disabled?: boolean;
}
interface Cover {
  title: string;
  detail?: string;
  confirming: boolean;
  actions: Choice[];
}
export function mountSessionCover(
  cover: HTMLElement,
  game: Game,
  signal: AbortSignal,
  activate: (id: string, button: HTMLButtonElement) => void,
) {
  const view = mountView(document.createElement("div"));
  let signature = "";
  function button(id: string) {
    return cover.querySelector<HTMLButtonElement>(
      `[data-${game}-action="${id}"]`,
    );
  }
  function display(p: Cover) {
    if (signal.aborted) return;
    const t = WorkTimeApp.i18n.t;
    const title = p.confirming ? t("games.restartNew") : p.title;
    cover.classList.toggle("game-restart-cover", p.confirming);
    if (p.confirming) {
      cover.setAttribute("role", "dialog");
      cover.setAttribute("aria-modal", "true");
      cover.setAttribute("aria-label", title);
    } else if (cover.hasAttribute("aria-modal")) {
      cover.removeAttribute("aria-modal");
      if (!cover.classList.contains("game-pause-cover")) {
        cover.removeAttribute("role");
        cover.removeAttribute("aria-label");
      }
    }
    const choices = p.actions.map((a) => ({
      ...a,
      label: p.confirming
        ? t(a.id === "cancel" ? "games.restartCancel" : "games.restartNew")
        : a.label,
    }));
    const next = JSON.stringify([title, p.detail, p.confirming, choices]);
    if (next === signature) return;
    signature = next;
    const buttons = choices.map((a) => (
      <Button
        key={a.id}
        className="game-button"
        {...{ ["data-" + game + "-action"]: a.id }}
        disabled={a.disabled}
        onClick={(e) => activate(a.id, e.currentTarget as HTMLButtonElement)}
      >
        {a.label}
      </Button>
    ));
    view.render(
      createPortal(
        p.confirming ? (
          <div
            className="game-restart-content"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                button("cancel")?.click();
              } else if (e.key === "Tab") {
                e.preventDefault();
                button(
                  choices[document.activeElement === button("cancel") ? 1 : 0]
                    .id,
                )?.focus();
              }
              e.stopPropagation();
            }}
          >
            <ArrowCounterClockwiseIcon
              className="game-restart-icon"
              aria-hidden="true"
            />
            <div className="game-restart-actions">{buttons}</div>
          </div>
        ) : (
          <>
            <h3>{title}</h3>
            {p.detail !== undefined && <p>{p.detail}</p>}
            {game === "link" || game === "jump" ? (
              buttons
            ) : (
              <div className={game + "-cover-actions"} hidden={!choices.length}>
                {buttons}
              </div>
            )}
          </>
        ),
        cover,
      ),
    );
  }
  signal.addEventListener("abort", view.dispose, { once: true });
  return {
    display,
    reset() {
      signature = "";
      cover.classList.remove("game-restart-cover");
      cover.removeAttribute("aria-modal");
      cover.removeAttribute("role");
      cover.removeAttribute("aria-label");
      cover.hidden = true;
      view.render(null);
    },
    focus: (id: string) => button(id)?.focus({ preventScroll: true }),
  };
}
