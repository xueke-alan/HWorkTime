import { createWorkspaceSelect } from "../workspace/select";
export function createMediaSelectGroup(feature: "reader" | "music") {
  const controls = new Map<
    HTMLSelectElement,
    {
      host: HTMLElement;
      label: HTMLLabelElement;
      controller: AbortController;
      view?: ReturnType<typeof createWorkspaceSelect>;
    }
  >();
  let serial = 0;
  return {
    add(host: HTMLElement, select: HTMLSelectElement, label: HTMLLabelElement) {
      controls.set(select, { host, label, controller: new AbortController() });
    },
    sync() {
      for (const [select, control] of controls) {
        if (!control.host.isConnected) {
          control.controller.abort();
          controls.delete(select);
          continue;
        }
        if (!control.view) {
          select.id ||= feature + "-select-" + ++serial;
          control.label.id = select.id + "Label";
          select.hidden = true;
          control.view = createWorkspaceSelect({
            host: control.host,
            select,
            label: control.label,
            signal: control.controller.signal,
            prefix: feature + "-select",
          });
        }
        control.view.sync();
      }
    },
    dispose() {
      for (const control of controls.values()) control.controller.abort();
      controls.clear();
    },
  };
}
