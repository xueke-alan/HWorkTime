import Tabs from "antd/es/tabs";
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
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        className="headphones-icon"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 14v-2a9 9 0 0 1 18 0v2M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm18 0h-3a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-5Z"
      />
      <g className="music-equalizer">
        <rect x="3" y="8" width="2" height="8" rx="1" />
        <rect x="7" y="5" width="2" height="14" rx="1" />
        <rect x="11" y="2" width="2" height="20" rx="1" />
        <rect x="15" y="5" width="2" height="14" rx="1" />
        <rect x="19" y="8" width="2" height="8" rx="1" />
      </g>
    </svg>
  );
}

function FunctionTabs({
  tabs,
  active,
  activate,
}: {
  tabs: WorkspaceTab[];
  active: string;
  activate: (id: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    for (const tab of tabs) {
      const node = host.current!.querySelector<HTMLElement>(
        '[data-node-key="' + tab.id + '"] [role="tab"]',
      );
      if (!node) continue;
      // Keep the existing controller hooks on Ant Design's actual accessible tab.
      node.id = tab.id === "music" ? "musicOpen" : "date-tab-" + tab.id;
      node.dataset.tab = tab.id;
      node.dataset.hintText = tab.label;
      node.setAttribute("aria-label", tab.label);
      node.setAttribute("aria-controls", tab.controls);
      node.classList.add("notification-tab");
    }
  });
  return (
    <div ref={host} className="function-tabs-host">
      <Tabs
        className="function-tabs"
        activeKey={active}
        tabPlacement="bottom"
        aria-label={WorkTimeApp.i18n.t("copy.b0f0d53b40")}
        tabBarGutter={0}
        onTabClick={activate}
        items={tabs.map((tab) => ({
          key: tab.id,
          label: (
            <span className="function-tab-icon" aria-hidden="true">
              {tab.id === "music" ? (
                <MusicIcon />
              ) : tab.id === "games" ? (
                <GameIcon />
              ) : (
                <svg className="ui-icon">
                  <use href={"#icon-" + tab.icon} />
                </svg>
              )}
            </span>
          ),
        }))}
      />
    </div>
  );
}
const roots = new WeakMap<
  HTMLElement,
  {
    view: ReturnType<typeof mountView>;
    tabs: WorkspaceTab[];
    activate: (id: string) => void;
    active: string;
  }
>();
export function renderWorkspaceTabs(
  host: HTMLElement,
  tabs: WorkspaceTab[] | null,
  activate: (id: string) => void = () => {},
) {
  let entry = roots.get(host);
  if (!tabs) {
    entry?.view.dispose();
    roots.delete(host);
    return;
  }
  if (!entry) {
    entry = { view: mountView(host), tabs, activate, active: "notifications" };
    roots.set(host, entry);
  }
  entry.tabs = tabs;
  entry.activate = activate;
  const current = entry;
  const render = () =>
    current.view.render(
      <FunctionTabs
        tabs={current.tabs}
        active={current.active}
        activate={current.activate}
      />,
    );
  render();
  return {
    select(id: string) {
      if (current.active === id) return;
      current.active = id;
      render();
    },
  };
}
