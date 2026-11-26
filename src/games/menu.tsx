import Button from "antd/es/button";
import { CalendarIcon } from "../phosphor-icons";
import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { mountView } from "../mount-view";
import { useLanguage } from "../ApplicationTheme";
import { bindScroll } from "./menu-scroll";
export interface MenuEntry {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
}
export interface GameMenuOptions {
  selectedId: string;
  onSelect: (id: string) => void;
  onLaunch: (id: string) => void;
  storageNotice?: () => string | null;
}
function Artwork({ icon }: { icon: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(
    () => ref.current!.replaceChildren(WorkTimeApp.games.createIcon(icon)),
    [icon],
  );
  return <span ref={ref} className="game-menu-artwork" aria-hidden="true" />;
}
function GameMenu({
  entries,
  selected,
  options,
  choose,
}: {
  entries: MenuEntry[];
  selected: string;
  options: GameMenuOptions;
  choose: (id: string) => void;
}) {
  useLanguage();
  const { t } = WorkTimeApp.i18n;
  const active = entries.find((entry) => entry.id === selected);
  const [stop, setStop] = useState(selected);
  const list = useRef<HTMLDivElement>(null),
    area = useRef<HTMLDivElement>(null),
    track = useRef<HTMLDivElement>(null),
    thumb = useRef<HTMLDivElement>(null),
    detail = useRef<HTMLElement>(null),
    description = useRef<HTMLParagraphElement>(null);
  useLayoutEffect(() => {
    if (list.current)
      return bindScroll(
        list.current,
        area.current!,
        track.current!,
        thumb.current!,
      );
  }, []);
  useLayoutEffect(() => {
    setStop(selected);
    if (description.current) description.current.scrollTop = 0;
    if (detail.current) detail.current.scrollTop = 0;
  }, [selected]);
  function keydown(event: KeyboardEvent) {
    const buttons = Array.from(list.current!.querySelectorAll("button"));
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;
    const target = (
      {
        ArrowDown: Math.min(index + 1, buttons.length - 1),
        ArrowUp: Math.max(index - 1, 0),
        Home: 0,
        End: buttons.length - 1,
      } as Record<string, number>
    )[event.key];
    if (target !== undefined) {
      event.preventDefault();
      buttons[target].focus();
    }
  }
  const progress =
    active && WorkTimeApp.services.gameArchive.progressSummary(active.id);
  const notice = options.storageNotice?.();
  return (
    <>
      <header className="game-menu-header">
        <h2>{t("games.menu")}</h2>
        <p className="game-menu-storage-notice" role="status">
          {notice && t(notice)}
        </p>
      </header>
      <div className="game-library">
        {active ? (
          <>
            <div ref={area} className="game-menu-scroll">
              <div
                ref={list}
                className="game-menu-list"
                role="group"
                data-ui="group"
                aria-label={t("games.menu")}
                onKeyDown={keydown}
              >
                {entries.map((entry) => (
                  <Button
                    key={entry.id}
                    data-game={entry.id}
                    aria-pressed={selected === entry.id}
                    tabIndex={stop === entry.id ? 0 : -1}
                    onFocus={() => setStop(entry.id)}
                    onClick={() => {
                      choose(entry.id);
                      options.onSelect(entry.id);
                    }}
                    onDoubleClick={() => options.onLaunch(entry.id)}
                    className="hw-button ui-button game-menu-entry"
                  >
                    <Artwork icon={entry.icon} />
                    <span className="game-menu-name">{t(entry.nameKey)}</span>
                  </Button>
                ))}
              </div>
              <div
                ref={track}
                className="game-menu-scroll-track"
                aria-hidden="true"
              >
                <div ref={thumb} className="game-menu-scroll-thumb" />
              </div>
            </div>
            <section
              ref={detail}
              className="game-menu-detail"
              aria-label={t(active.nameKey)}
            >
              <header className="game-menu-detail-header">
                <Artwork icon={active.icon} />
                <h3>{t(active.nameKey)}</h3>
              </header>
              <p
                ref={description}
                className="game-menu-description"
                tabIndex={-1}
              >
                {t(active.descriptionKey)}
              </p>
              <Button
                aria-label={t("games.play") + " · " + t(active.nameKey)}
                onClick={() => options.onLaunch(active.id)}
                className="hw-button ui-button primary game-menu-play"
              >
                {t("games.play")}
              </Button>
              <div className="game-menu-progress">
                <h4>{t("games.progress.title")}</h4>
                <p>
                  {progress &&
                    t(
                      "games.progress." + progress.kind,
                      progress.value === undefined
                        ? {}
                        : { n: WorkTimeApp.i18n.number(progress.value) },
                    )}
                </p>
              </div>
            </section>
          </>
        ) : (
          t("games.empty")
        )}
      </div>
    </>
  );
}
export function renderGameMenu(
  container: HTMLElement,
  options: GameMenuOptions,
) {
  const view = mountView(container);
  const entries = WorkTimeApp.games.list();
  let selected =
    entries.find((entry) => entry.id === options.selectedId)?.id ??
    entries[0]?.id ??
    "";
  function render() {
    view.render(
      <GameMenu {...{ options, entries, selected }} choose={select} />,
    );
  }
  function select(id: string) {
    if (selected === id || !entries.some((entry) => entry.id === id)) return;
    selected = id;
    render();
  }
  render();
  return { select, refreshProgress: render, dispose: view.dispose };
}
function SessionToolbar({ title, exit }: { title: string; exit: () => void }) {
  useLanguage();
  const { t } = WorkTimeApp.i18n;
  return (
    <>
      <Button
        id="gameExitButton"
        aria-label={t("workspace.returnCalendar")}
        onClick={exit}
        className="hw-button ui-button icon-only workspace-toolbar-action"
      >
        <CalendarIcon className="ui-icon" aria-hidden="true" />
      </Button>
      <h2 id="gameTitle">{t(title)}</h2>
    </>
  );
}
export function mountGameToolbar(host: HTMLElement, exit: () => void) {
  const view = mountView(host);
  function show(title: string) {
    view.render(<SessionToolbar title={title} exit={exit} />);
  }
  show("games.menu");
  return { show, dispose: view.dispose };
}
