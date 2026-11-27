import Button from "antd/es/button";
import {
  SkipBackIcon,
  SkipForwardIcon,
  PauseIcon,
  PlayIcon,
} from "../phosphor-icons";
import { useLayoutEffect, useRef } from "react";
import { mountView } from "../mount-view";
import { useLanguage } from "../ApplicationTheme";
export type PlaybackAction = "previous" | "toggle" | "next";
export interface PlaybackSnapshot {
  current?: { title?: string; name?: string };
  tracks: unknown[];
  paused: boolean;
  needsAccess: boolean;
}

function ScrollingName({
  title,
  visible,
}: {
  title: string;
  visible: boolean;
}) {
  const name = useRef<HTMLSpanElement>(null);
  const track = useRef<HTMLSpanElement>(null);
  const original = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const container = name.current!;
    let animation: Animation | undefined;
    let frame: number | undefined;
    let last = "";
    function measure() {
      frame = undefined;
      const width = original.current!.getBoundingClientRect().width;
      const scrolling =
        visible &&
        container.clientWidth > 0 &&
        width > container.clientWidth + 1;
      const signature = [width, container.clientWidth, scrolling].join("/");
      if (signature === last) return;
      last = signature;
      animation?.cancel();
      container.classList.toggle("is-scrolling", scrolling);
      if (!scrolling) return;
      const distance = width + 24;
      const duration = 1 + distance / 24;
      try {
        animation = track.current!.animate(
          [
            { transform: "translateX(0)", offset: 0 },
            { transform: "translateX(0)", offset: 1 / duration },
            { transform: "translateX(-" + distance + "px)", offset: 1 },
          ],
          { duration: duration * 1000, iterations: Infinity, easing: "linear" },
        );
      } catch {
        container.classList.remove("is-scrolling");
      }
    }
    function schedule() {
      frame ??= requestAnimationFrame(measure);
    }
    const observer = new ResizeObserver(schedule);
    observer.observe(container);
    observer.observe(original.current!);
    schedule();
    document.addEventListener("worktime:motionchange", schedule);
    return () => {
      observer.disconnect();
      if (frame !== undefined) cancelAnimationFrame(frame);
      animation?.cancel();
      document.removeEventListener("worktime:motionchange", schedule);
    };
  }, [title, visible]);
  return (
    <span ref={name} className="site-music-name" data-hint-text={title}>
      <span ref={track} className="site-music-name-track">
        <span ref={original}>{title}</span>
        <span aria-hidden="true">{title}</span>
      </span>
    </span>
  );
}
function FooterPlayback({
  state,
  started,
  action,
}: {
  state?: PlaybackSnapshot;
  started: boolean;
  action: (value: PlaybackAction) => void;
}) {
  useLanguage();
  const { t } = WorkTimeApp.i18n;
  const visible = started && !!state?.current;
  const title = state?.current?.title || state?.current?.name || "";
  const buttons = [
    { action: "previous", glyph: "previous", icon: SkipBackIcon },
    {
      action: "toggle",
      glyph: state?.paused ? "play" : "pause",
      icon: state?.paused ? PlayIcon : PauseIcon,
    },
    { action: "next", glyph: "next", icon: SkipForwardIcon },
  ] as const;
  return (
    <span
      className="site-music-controls"
      hidden={!visible}
      role="group"
      data-ui="group"
      aria-label={t("media.music.title")}
    >
      <ScrollingName title={title} visible={visible} />
      {buttons.map(({ action: id, glyph, icon: Icon }) => (
        <Button
          key={id}
          data-music-action={id}
          data-glyph={glyph}
          disabled={!state?.tracks.length || state.needsAccess}
          data-hint-text={t("media.music." + glyph)}
          aria-label={t("media.music." + glyph)}
          onClick={() => action(id)}
          className="hw-button site-music-button"
        >
          <Icon className="ui-icon" aria-hidden="true" />
        </Button>
      ))}
      <svg
        className="site-audio-divider"
        viewBox="0 0 16 16"
        aria-hidden="true"
      >
        <path d="M8 4v8" />
      </svg>
    </span>
  );
}
export function mountPlayback(
  host: HTMLElement,
  action: (value: PlaybackAction) => void,
) {
  const mount = document.createElement("span");
  mount.style.display = "contents";
  host.prepend(mount);
  const view = mountView(mount);
  function refresh(state: PlaybackSnapshot | undefined, started: boolean) {
    view.render(<FooterPlayback {...{ state, started, action }} />);
  }
  refresh(undefined, false);
  return {
    refresh,
    dispose() {
      view.dispose();
      mount.remove();
    },
  };
}
