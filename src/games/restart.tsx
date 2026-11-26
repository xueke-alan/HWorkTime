import Button from "antd/es/button";
import { ArrowCounterClockwiseIcon } from "../phosphor-icons";
import type { KeyboardEvent } from "react";
import { mountView } from "../mount-view";
import { useLanguage } from "../ApplicationTheme";
export interface RestartOptions {
  host: HTMLElement;
  signal: AbortSignal;
  labels?: () => { title: string; cancel: string; accept: string };
  onOpen?: () => void;
  onConfirm: () => void;
  onCancel?: () => void;
}
export function createRestartPrompt(options: RestartOptions) {
  const cover = document.createElement("div");
  cover.className = "game-restart-panel game-restart-cover";
  cover.hidden = true;
  options.host.classList.add("game-restart-host");
  options.host.append(cover);
  const view = mountView(cover);
  const saved = new Map<HTMLElement, boolean>();
  let source: HTMLElement | undefined;
  function restore() {
    for (const [el, inert] of saved) el.inert = inert;
    saved.clear();
  }
  function close(confirm: boolean) {
    if (cover.hidden) return;
    cover.hidden = true;
    restore();
    view.render(null);
    if (confirm) options.onConfirm();
    else {
      options.onCancel?.();
      source?.focus({ preventScroll: true });
    }
  }
  function focus(action: string) {
    cover
      .querySelector<HTMLElement>('[data-game-restart="' + action + '"]')
      ?.focus({ preventScroll: true });
  }
  function keydown(event: KeyboardEvent) {
    event.stopPropagation();
    if (event.key === "Escape") {
      event.preventDefault();
      close(false);
    } else if (event.key === "Tab") {
      event.preventDefault();
      focus(
        document.activeElement?.getAttribute("data-game-restart") === "cancel"
          ? "new"
          : "cancel",
      );
    }
  }
  function Content() {
    useLanguage();
    const { t } = WorkTimeApp.i18n;
    const labels = options.labels?.() ?? {
      title: t("games.restartNew"),
      cancel: t("games.restartCancel"),
      accept: t("games.restartNew"),
    };
    return (
      <div
        className="game-restart-content"
        role="dialog"
        aria-modal="true"
        aria-label={labels.title}
        onKeyDown={keydown}
      >
        {options.labels ? (
          <h3 className="game-restart-message">{labels.title}</h3>
        ) : (
          <ArrowCounterClockwiseIcon
            className="game-restart-icon"
            aria-hidden="true"
          />
        )}
        <div className="game-restart-actions" data-ui="toolbar">
          <Button
            data-game-restart="cancel"
            onClick={() => close(false)}
            className="hw-button game-button"
          >
            {labels.cancel}
          </Button>
          <Button
            data-game-restart="new"
            onClick={() => close(true)}
            className="hw-button game-button"
          >
            {labels.accept}
          </Button>
        </div>
      </div>
    );
  }
  function open(trigger: HTMLElement) {
    if (!cover.hidden || options.signal.aborted) return;
    source = trigger;
    options.onOpen?.();
    const root = options.host.closest(".game-session");
    for (
      let branch = cover;
      branch.parentElement && branch !== root;
      branch = branch.parentElement as HTMLDivElement
    ) {
      for (const el of Array.from(branch.parentElement.children)) {
        if (el === branch || !(el instanceof HTMLElement)) continue;
        saved.set(el, el.inert);
        el.inert = true;
      }
    }
    cover.hidden = false;
    view.render(<Content />);
    focus("cancel");
  }
  options.signal.addEventListener(
    "abort",
    () => {
      restore();
      view.dispose();
      cover.remove();
    },
    { once: true },
  );
  return { open, isOpen: () => !cover.hidden && !options.signal.aborted };
}
