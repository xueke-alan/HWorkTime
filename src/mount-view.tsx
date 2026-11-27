import { type ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { ApplicationTheme } from "./ApplicationTheme";
import { SidebarTheme } from "./sidebar-theme";

/** Existing controllers read or focus the rendered controls immediately after an update. */
export function mountView(host: HTMLElement, scope?: "sidebar") {
  const root = createRoot(host);
  return {
    render(content: ReactNode) {
      const sidebar =
        scope === "sidebar" || !!host.closest('[data-theme-scope="sidebar"]');
      flushSync(() =>
        root.render(
          <ApplicationTheme>
            {sidebar ? <SidebarTheme>{content}</SidebarTheme> : content}
          </ApplicationTheme>,
        ),
      );
    },
    dispose() {
      root.unmount();
    },
  };
}
