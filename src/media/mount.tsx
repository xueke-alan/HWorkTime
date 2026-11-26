import Button from "antd/es/button";
import Input from "antd/es/input";
import { createPortal } from "react-dom";
import {
  CalendarIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  ShuffleIcon,
  SkipBackIcon,
  SkipForwardIcon,
  RepeatIcon,
  PauseIcon,
  PlayIcon,
} from "../phosphor-icons";
import { mountView } from "../mount-view";
import { useLanguage } from "../ApplicationTheme";

interface ToolbarState {
  busy: boolean;
  reading: boolean;
  needsAccess: boolean;
  statusHost?: HTMLElement;
}
type ToolbarActions = {
  activate: (key: string) => void;
  text: (key: string) => string;
};
function MusicToolbar({
  activate,
  text,
  busy,
  reading,
  needsAccess,
  statusHost,
}: ToolbarActions & ToolbarState) {
  useLanguage();
  const actionClass =
    "hw-button music-button ui-button icon-only workspace-toolbar-action";
  return (
    <>
      <Button
        id="musicExitButton"
        aria-label={text("returnMain")}
        onClick={() => activate("exit")}
        className={actionClass}
      >
        <CalendarIcon className="ui-icon" aria-hidden="true" />
      </Button>
      <h2 id="musicTitle">{text("title")}</h2>
      <div className="music-search-box">
        <span className="music-glyph" aria-hidden="true">
          <MagnifyingGlassIcon />
        </span>
        <Input
          type="search"
          aria-label={text("search")}
          data-hint-text={text("search")}
          placeholder={text("search")}
          className="hw-field music-search"
        />
      </div>
      <details className="music-menu music-management" data-ui="disclosure">
        <summary
          className="music-menu-toggle workspace-toolbar-action"
          data-ui="summary"
          aria-label={text("manage")}
          data-hint-text={text("manage")}
        >
          <FolderIcon aria-hidden="true" />
        </summary>
        <div className="music-menu-panel music-toolbar" data-ui="toolbar">
          {["choose", "importFolder", "rescan"].map((key) => (
            <Button
              key={key}
              disabled={key === "rescan" && busy}
              data-runtime-action={key !== "rescan" ? "import" : undefined}
              onClick={() => activate(key)}
              className="hw-button music-button"
            >
              {text(key)}
            </Button>
          ))}
        </div>
      </details>
      <Button
        id="musicMinimize"
        data-hint-text={text("minimize")}
        aria-label={text("minimize")}
        onClick={() => activate("minimize")}
        className={actionClass}
      >
        <svg className="ui-icon" aria-hidden="true">
          <use href="#icon-horizontal-rule" />
        </svg>
      </Button>
      {statusHost &&
        createPortal(
          <>
            <Button
              id="musicReconnect"
              hidden={!needsAccess}
              onClick={() => activate("access")}
              className="hw-button music-button"
            >
              {text("access")}
            </Button>
            <Button
              hidden={!busy && !reading}
              onClick={() => activate("cancel")}
              className="hw-button music-button"
            >
              {text("cancel")}
            </Button>
          </>,
          statusHost,
        )}
    </>
  );
}
export function mountMusicToolbar(
  host: HTMLElement,
  activate: ToolbarActions["activate"],
  text: ToolbarActions["text"],
) {
  const view = mountView(host);
  const state: ToolbarState = {
    busy: false,
    reading: false,
    needsAccess: false,
  };
  function render() {
    view.render(<MusicToolbar {...state} activate={activate} text={text} />);
  }
  render();
  return {
    setStatusHost(host: HTMLElement) {
      state.statusHost = host;
      render();
    },
    update(busy: boolean, reading: boolean, needsAccess: boolean) {
      Object.assign(state, { busy, reading, needsAccess });
      render();
    },
    dispose: view.dispose,
  };
}
type TransportAction = (action: string, source: HTMLElement) => void;
function MusicTransport({
  activate,
  mode,
  paused,
  empty,
  access,
}: {
  activate: TransportAction;
  mode: string;
  paused: boolean;
  empty: boolean;
  access: boolean;
}) {
  useLanguage();
  const repeat = mode === "one" || mode === "list";
  const buttons = [
    {
      action: "shuffle",
      id: "musicShuffle",
      icon: ShuffleIcon,
      label: "shuffle",
      pressed: mode === "shuffle",
    },
    { action: "previous", icon: SkipBackIcon, label: "previous" },
    {
      action: "toggle",
      id: "musicPlay",
      icon: paused ? PlayIcon : PauseIcon,
      label: paused ? "play" : "pause",
    },
    { action: "next", icon: SkipForwardIcon, label: "next" },
    {
      action: "repeat",
      id: "musicRepeat",
      icon: RepeatIcon,
      label: repeat ? mode : "order",
      pressed: repeat,
    },
  ];
  return buttons.map(({ action, id, icon: Icon, label, pressed }) => {
    const caption = WorkTimeApp.i18n.t("media.music." + label);
    const style =
      action === "toggle"
        ? "music-play"
        : action === "repeat" && mode === "one"
          ? "is-repeat-one"
          : "";
    return (
      <Button
        key={action}
        id={id}
        className={"hw-button music-button " + style}
        aria-label={caption}
        data-hint-text={caption}
        aria-pressed={pressed}
        data-music-glyph={action === "toggle" ? label : action}
        disabled={empty || (pressed === undefined && access)}
        onClick={(event) => activate(action, event.currentTarget)}
      >
        <span className="music-glyph" aria-hidden="true">
          <Icon />
        </span>
      </Button>
    );
  });
}
export function mountMusicTransport(
  host: HTMLElement,
  activate: TransportAction,
) {
  const view = mountView(host);
  function update(
    mode: string,
    paused: boolean,
    empty: boolean,
    access: boolean,
  ) {
    view.render(
      <MusicTransport {...{ activate, mode, paused, empty, access }} />,
    );
  }
  update("order", true, true, false);
  return { update, dispose: view.dispose };
}
