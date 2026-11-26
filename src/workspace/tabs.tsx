import Button from "antd/es/button";
import { useLayoutEffect, useRef } from "react";
import { mountView } from "../mount-view";

export interface WorkspaceTab {
  id: string;
  label: string;
  controls: string;
  icon: string;
  divider?: boolean;
}
function GameIcon() {
  const ref = useRef<SVGSVGElement>(null);
  useLayoutEffect(() => {
    const el = ref.current!;
    const icon = WorkTimeApp.games.createIcon("joystick");
    for (const attr of Array.from(icon.attributes))
      el.setAttribute(attr.name, attr.value);
    el.replaceChildren(...Array.from(icon.childNodes));
  }, []);
  return <svg ref={ref} aria-hidden="true" />;
}
function MusicIcon() {
  return (
    <svg
      className="ui-icon music-entry-icon"
      viewBox="0 0 256 256"
      aria-hidden="true"
    >
      <use className="headphones-icon" href="#icon-headphones" />
      <use className="music-equalizer" href="#icon-waveform" />
    </svg>
  );
}
const roots = new WeakMap<HTMLElement, ReturnType<typeof mountView>>();
export function renderWorkspaceTabs(
  host: HTMLElement,
  tabs: WorkspaceTab[] | null,
  activate: (id: string) => void = () => {},
) {
  let view = roots.get(host);
  if (!tabs) {
    view?.dispose();
    roots.delete(host);
    return;
  }
  if (!view) {
    view = mountView(host);
    roots.set(host, view);
  }
  view.render(
    tabs.map((tab) =>
      tab.id === "music" ? (
        <Button
          key={tab.id}
          id="musicOpen"
          data-tab="music"
          data-hint-text={tab.label}
          aria-label={tab.label}
          aria-haspopup="dialog"
          aria-controls="musicDialog"
          aria-expanded={false}
          onClick={() => activate(tab.id)}
          className="hw-button notification-tab"
        >
          <MusicIcon />
        </Button>
      ) : (
        <Button
          key={tab.id}
          id={"date-tab-" + tab.id}
          className={
            "hw-button notification-tab" +
            (tab.divider ? " date-tab-group-start" : "")
          }
          data-tab={tab.id}
          data-hint-text={tab.label}
          aria-label={tab.label}
          aria-controls={tab.controls}
          onClick={() => activate(tab.id)}
          role="tab"
        >
          {tab.id === "games" ? (
            <GameIcon />
          ) : (
            <svg className="ui-icon" aria-hidden="true">
              <use href={"#icon-" + tab.icon} />
            </svg>
          )}
        </Button>
      ),
    ),
  );
}
