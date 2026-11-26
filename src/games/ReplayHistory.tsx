import Button from "antd/es/button";
import { mountView } from "../mount-view";

interface ReplayRow {
  id: string;
  label: string;
  open: (button: HTMLButtonElement) => void;
}
interface Transport {
  index: number;
  length: number;
  playing: boolean;
  play: () => void;
  previous: () => void;
  next: () => void;
  exit: () => void;
}
const t = (key: string) => WorkTimeApp.i18n.t("games.history." + key);
export function mountReplayHistory(list: HTMLElement, controls: HTMLElement) {
  const history = mountView(list),
    transport = mountView(controls);
  return {
    list(title: string, empty: string, rows: ReplayRow[], active: boolean) {
      history.render(
        <>
          <h3>{title}</h3>
          <div inert={active}>
            {rows.length
              ? rows.map((row) => (
                  <div className="game-completion-row" key={row.id}>
                    <span>{row.label}</span>
                    <Button
                      className="game-button"
                      data-replay-record={row.id}
                      aria-label={t("replay") + " · " + row.label}
                      onClick={(e) =>
                        row.open(e.currentTarget as HTMLButtonElement)
                      }
                    >
                      {t("replay")}
                    </Button>
                  </div>
                ))
              : empty}
          </div>
        </>,
      );
    },
    controls(state: Transport | null) {
      controls.hidden = !state;
      transport.render(
        state ? (
          <>
            <span className="game-replay-progress" role="status">
              {state.index} / {state.length}
            </span>
            {(["play", "previous", "next", "exit"] as const).map((name) => (
              <Button
                key={name}
                className="game-button"
                data-replay-action={name}
                disabled={
                  (name === "previous" && state.index === 0) ||
                  (name === "next" && state.index === state.length)
                }
                onClick={state[name]}
              >
                {t(name === "play" && state.playing ? "pause" : name)}
              </Button>
            ))}
          </>
        ) : null,
      );
    },
    dispose() {
      history.dispose();
      transport.dispose();
    },
  };
}
