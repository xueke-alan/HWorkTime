import Button from "antd/es/button";
import { mountView } from "../mount-view";

interface Action {
  id: string;
  label: string;
  run: () => void;
}
interface Dialog {
  title: string;
  kind: "pause" | "confirm" | "exit";
  actions: Action[];
  emblem: string;
}
export function mountUnoDialog(signal: AbortSignal) {
  const host = document.createElement("div");
  const view = mountView(host);
  signal.addEventListener("abort", view.dispose, { once: true });
  return {
    host,
    show({ title, kind, actions, emblem }: Dialog) {
      host.className =
        "uno-overlay" + (kind === "exit" ? " uno-ranked-exit-overlay" : "");
      const buttons = actions.map((a) => (
        <Button
          key={a.id}
          className={
            "game-button" + (kind === "exit" ? " uno-hand-action" : "")
          }
          data-uno-action={a.id}
          aria-label={a.label}
          onClick={a.run}
        >
          {kind === "exit" && (
            <svg
              className="uno-action-frame"
              viewBox="0 0 160 64"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M8 7Q80 4 152 8L153 55Q83 60 7 55L6 9Z" />
              <path
                className="uno-action-sketch"
                d="M13 5L150 7M155 12L154 50M12 58L145 59"
              />
            </svg>
          )}
          <span
            className={kind === "exit" ? "uno-hand-action-label" : undefined}
          >
            {a.label}
          </span>
        </Button>
      ));
      view.render(
        <section
          className={
            (kind === "pause" ? "uno-pause" : "uno-confirm") +
            " uno-dialog" +
            (kind === "exit" ? " uno-ranked-exit" : "")
          }
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <h3>{title}</h3>
          {kind === "exit" ? (
            <>
              <div
                className="uno-exit-emblem"
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: emblem }}
              />
              <div className="uno-exit-actions">{buttons}</div>
            </>
          ) : (
            buttons
          )}
        </section>,
      );
    },
  };
}
