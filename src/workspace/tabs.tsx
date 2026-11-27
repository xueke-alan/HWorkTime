import Tabs from "antd/es/tabs";
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

function FunctionIcon({ tab }: { tab: WorkspaceTab }) {
  return (
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
  );
}

export function FunctionTabs({
  tabs,
  active,
  activate,
}: {
  tabs: WorkspaceTab[];
  active: string;
  activate: (id: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const functionTabs = tabs.filter((tab) => !tab.divider);
  const dateEntry = tabs.find((tab) => tab.divider);
  useLayoutEffect(() => {
    for (const tab of functionTabs) {
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
        size="small"
        activeKey={active === dateEntry?.id ? "" : active}
        tabPlacement="bottom"
        aria-label={WorkTimeApp.i18n.t("copy.b0f0d53b40")}
        tabBarGutter={0}
        onTabClick={activate}
        items={functionTabs.map((tab) => ({
          key: tab.id,
          label: <FunctionIcon tab={tab} />,
        }))}
      />
      {dateEntry && (
        <Button
          id={"date-tab-" + dateEntry.id}
          type="text"
          htmlType="button"
          className="date-info-trigger"
          data-tab={dateEntry.id}
          data-hint-text={dateEntry.label}
          aria-label={dateEntry.label}
          aria-controls={dateEntry.controls}
          aria-pressed={active === dateEntry.id}
          icon={<FunctionIcon tab={dateEntry} />}
          onClick={() => activate(dateEntry.id)}
        />
      )}
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
