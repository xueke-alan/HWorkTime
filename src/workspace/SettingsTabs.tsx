import Tabs from "antd/es/tabs";
import { useLayoutEffect, useState } from "react";
import { useLanguage } from "../ApplicationTheme";

const items = [
  { key: "settingsGeneralTab", label: "settings.general" },
  { key: "settingsWorkTab", label: "settings.work" },
  { key: "settingsPersonalTab", label: "copy.c241ef1b93" },
];
export default function SettingsTabs() {
  useLanguage();
  const [active, setActive] = useState(items[0].key);
  useLayoutEffect(() => {
    const commands = document.querySelector(".settings-tab-commands")!;
    const sync = () => {
      const selected = commands.querySelector('[aria-selected="true"]');
      if (selected) setActive(selected.id);
    };
    const observer = new MutationObserver(sync);
    observer.observe(commands, {
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-selected"],
    });
    sync();
    return () => observer.disconnect();
  }, []);
  return (
    <Tabs
      className="settings-option-tabs toolbar-tabs"
      activeKey={active}
      tabPlacement="top"
      tabBarGutter={0}
      items={items.map((item) => ({
        key: item.key,
        label: (
          <span data-settings-tab={item.key}>
            {WorkTimeApp.i18n.t(item.label)}
          </span>
        ),
      }))}
      onChange={(id) => document.getElementById(id)?.click()}
    />
  );
}
