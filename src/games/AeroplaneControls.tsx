import Button from "antd/es/button";
import Switch from "antd/es/switch";
import { createPortal } from "react-dom";
import { mountView } from "../mount-view";
interface Seat {
  color: string;
  kind: string;
  current: boolean;
  arrived: number;
}
interface Props {
  seats: Seat[];
  setup: boolean;
  startable: boolean;
  error: string;
  message: string;
  choiceColor: string;
  choices: { index: number; label: string }[];
  choosing: boolean;
  entering: boolean;
  enabled: boolean;
  dialog: HTMLElement | null;
}
export function mountAeroplaneControls(host: HTMLElement, signal: AbortSignal) {
  const view = mountView(host);
  signal.addEventListener("abort", view.dispose, { once: true });
  return (p: Props) => {
    if (signal.aborted) return;
    const t = (key: string) => WorkTimeApp.i18n.t("games.aeroplane." + key);
    function button(id: string, label: string, disabled = false) {
      return (
        <Button
          className="aero-button"
          data-aero-action={id}
          disabled={disabled}
        >
          {label}
        </Button>
      );
    }
    view.render(
      <>
        {p.seats.map((s, i) => (
          <div
            key={s.color}
            className={"aero-player aero-" + s.color}
            aria-current={s.current || undefined}
          >
            <span className="aero-player-dot" aria-hidden="true" />
            <div className="aero-player-details">
              <strong>{t(s.color)}</strong>
              <span className="aero-player-kind">{t(s.kind)}</span>
            </div>
            {p.setup ? (
              <Switch
                className="aero-switch"
                data-aero-action={"seat-" + i}
                aria-label={t(s.color) + " " + t("human")}
                checked={s.kind === "human"}
              />
            ) : (
              <span className="aero-progress">{s.arrived}/4</span>
            )}
          </div>
        ))}
        <div className="aero-feedback">
          {p.message && (
            <p className="aero-status" role="status">
              {p.message}
            </p>
          )}
          {p.choosing && (
            <div
              className={
                "aero-plane-choices aero-" +
                p.choiceColor +
                (p.entering ? " aero-choices-enter" : "")
              }
            >
              {p.choices.map((c) => (
                <Button
                  key={c.index}
                  className="aero-button"
                  data-aero-action={"plane-" + c.index}
                  aria-label={c.label}
                  disabled={!p.enabled}
                >
                  ✈ {c.index + 1}
                </Button>
              ))}
            </div>
          )}
        </div>
        {p.setup
          ? button("start", t("start"), !p.startable)
          : button("restart", t("exit"))}
        {p.error && (
          <div className="aero-warning" role="alert">
            {t(p.error)}
            {button("retry", t("retry"))}
          </div>
        )}
        {p.dialog &&
          createPortal(
            <div
              className="aero-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="aero-dialog-title"
              aria-describedby="aero-dialog-message"
            >
              <h3 id="aero-dialog-title">{t("exit")}</h3>
              <p id="aero-dialog-message">{t("confirm")}</p>
              <div className="aero-dialog-actions">
                {button("close", t("cancel"))}
                {button("confirm", t("exit"))}
              </div>
            </div>,
            p.dialog,
          )}
      </>,
    );
  };
}
