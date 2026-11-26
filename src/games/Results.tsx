import {
  HourglassMediumIcon,
  ArrowCounterClockwiseIcon,
  PlayIcon,
} from "../phosphor-icons";
import { useLanguage } from "../ApplicationTheme";
import Button from "antd/es/button";
import { createRef } from "react";
import { mountView } from "../mount-view";

type Game =
  | "klotski"
  | "jungle"
  | "uttt"
  | "sliding"
  | "lights"
  | "puzzle"
  | "mine"
  | "tank";
interface Action {
  id: string;
  label: string;
  run: () => void;
}
interface Result {
  game: Game;
  title: string;
  detail?: string;
  lines?: string[];
  won?: boolean;
  stats?: { label: string; value: string }[];
  mark?: string;
  artwork?: string;
  actions: Action[];
}
function Mark({ mark }: { mark: string }) {
  if (mark !== "X" && mark !== "O") return mark;
  return (
    <svg
      className="uttt-symbol"
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      {mark === "X" ? (
        <path d="M20 20 80 80M80 20 20 80" />
      ) : (
        <circle cx="50" cy="50" r="35" />
      )}
    </svg>
  );
}
function ResultCard({
  game,
  title,
  detail,
  stats,
  mark,
  artwork,
  actions,
  lines,
  won,
}: Result) {
  if (game === "mine")
    return (
      <>
        <span className="mine-result-icon" aria-hidden="true">
          <svg className="ui-icon">
            <use href={won ? "#icon-check" : "#icon-bomb"} />
          </svg>
        </span>
        <div className="mine-result-copy">
          <strong>{title}</strong>
          <span>{detail}</span>
        </div>
        <Button
          className="game-button"
          data-mine-action="again"
          onClick={actions[0].run}
        >
          {actions[0].label}
        </Button>
      </>
    );
  if (game === "tank")
    return (
      <>
        <span className="tank-eyebrow">BATTLE CITY</span>
        <h3>{title}</h3>
        <p hidden={detail === undefined}>{detail}</p>
        <div className="tank-results">
          {lines?.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
        <Button
          className="game-button"
          data-tank-action="start"
          onClick={actions[0].run}
        >
          {actions[0].label}
        </Button>
      </>
    );
  const body = (
    <>
      {artwork && (
        <div
          className="jungle-result-art"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: artwork }}
        />
      )}
      {game === "uttt" ? (
        <>
          <span className="uttt-result-symbol" aria-hidden="true">
            <Mark mark={mark || ""} />
          </span>
          <strong id="uttt-result-label">{title}</strong>
        </>
      ) : (
        <h3
          hidden={!title}
          className={game === "jungle" ? "jungle-result-title" : undefined}
        >
          {title}
        </h3>
      )}
      {detail !== undefined && (
        <p className={game === "jungle" ? "jungle-result-note" : undefined}>
          {detail}
        </p>
      )}
      {stats && (
        <div className="lights-result-stats">
          {stats.map((item) => (
            <div key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      )}
      <div
        className={
          game === "puzzle"
            ? "puzzle-actions"
            : game === "sliding"
              ? "sliding-actions"
              : game === "lights"
                ? "lights-cover-actions"
                : game + "-result-actions"
        }
      >
        {actions.map((action) => (
          <Button
            key={action.id}
            className="game-button"
            {...{ ["data-" + game + "-action"]: action.id }}
            icon={
              game === "puzzle" ? (
                action.id === "retry" ? (
                  <ArrowCounterClockwiseIcon />
                ) : (
                  <PlayIcon />
                )
              ) : undefined
            }
            onClick={action.run}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </>
  );
  return game !== "uttt" && game !== "jungle" ? (
    body
  ) : (
    <div
      className={game + "-result-card"}
      role={game === "uttt" ? "group" : undefined}
      aria-labelledby={game === "uttt" ? "uttt-result-label" : undefined}
    >
      {body}
    </div>
  );
}
export function mountGameResult(host: HTMLElement, signal: AbortSignal) {
  const view = mountView(host);
  signal.addEventListener("abort", view.dispose, { once: true });
  return {
    update(props: Result) {
      if (!signal.aborted) view.render(<ResultCard {...props} />);
    },
    focus(game: Game, id: string) {
      host
        .querySelector<HTMLButtonElement>(`[data-${game}-action="${id}"]`)
        ?.focus({ preventScroll: true });
    },
  };
}
export function mountBrushResult(
  host: HTMLElement,
  game: "gomoku" | "xiangqi",
  signal: AbortSignal,
) {
  const frame = createRef<HTMLDivElement>(),
    wash = createRef<HTMLDivElement>(),
    splash = createRef<HTMLDivElement>(),
    image = createRef<HTMLImageElement>();
  const view = mountView(host);
  function paint(src?: string, animated = false) {
    view.render(
      <div ref={frame} className={game + "-result-frame"}>
        <div ref={wash} className={game + "-result-wash"} hidden={!animated} />
        <div
          ref={splash}
          className={game + "-result-splash"}
          hidden={!animated}
        />
        <img
          ref={image}
          className={game + "-result-art"}
          alt=""
          draggable={false}
          src={src}
        />
      </div>,
    );
  }
  paint();
  signal.addEventListener("abort", view.dispose, { once: true });
  return {
    paint,
    frame: frame.current!,
    wash: wash.current!,
    splash: splash.current!,
    image: image.current!,
  };
}

function PauseContent() {
  useLanguage();
  return (
    <>
      <HourglassMediumIcon className="game-pause-icon" aria-hidden="true" />
      <span className="game-pause-caption">
        {WorkTimeApp.i18n.t("games.pauseOverlay")}
      </span>
    </>
  );
}
export function mountPauseContent(host: HTMLElement, signal: AbortSignal) {
  const view = mountView(host);
  view.render(<PauseContent />);
  signal.addEventListener("abort", view.dispose, { once: true });
}
export function mountRestartContent(
  host: HTMLElement,
  signal: AbortSignal,
  custom: boolean,
  description?: HTMLElement,
) {
  const view = mountView(host);
  const slot = createRef<HTMLDivElement>();
  let currentTitle = "";
  function display(title: string) {
    view.render(
      <>
        {custom ? (
          <h3 className="game-restart-message">{title}</h3>
        ) : (
          <ArrowCounterClockwiseIcon
            className="game-restart-icon"
            aria-hidden="true"
          />
        )}
        <div className="game-restart-actions" ref={slot} />
      </>,
    );
  }
  display(currentTitle);
  if (description) slot.current!.before(description);
  signal.addEventListener("abort", view.dispose, { once: true });
  return {
    actions: slot.current!,
    setTitle(title: string) {
      if (custom && currentTitle !== title) {
        currentTitle = title;
        display(title);
      }
    },
  };
}
