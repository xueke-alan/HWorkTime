import { type ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { ApplicationTheme } from "./ApplicationTheme";

/** Existing controllers read or focus the rendered controls immediately after an update. */
export function mountView(host: HTMLElement) {
  const root = createRoot(host);
  return {
    render(content: ReactNode) {
      flushSync(() =>
        root.render(<ApplicationTheme>{content}</ApplicationTheme>),
      );
    },
    dispose() {
      root.unmount();
    },
  };
}
