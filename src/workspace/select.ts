import { createApp } from "vue";
import { installUI } from "../ui";
import WorkspaceSelect from "./WorkspaceSelect.vue";
export function createWorkspaceSelect({
  host,
  select,
  label,
  signal,
  buttonClass = "ui-button",
  prefix = "shared-select",
}: {
  host: HTMLElement;
  select: HTMLSelectElement;
  label: HTMLLabelElement;
  signal: AbortSignal;
  buttonClass?: string;
  prefix?: string;
}) {
  const mount = document.createElement("span");
  mount.style.display = "contents";
  host.append(mount);
  select.tabIndex = -1;
  select.setAttribute("aria-hidden", "true");
  select.classList.add("shared-native-select");
  label.htmlFor = select.id + "Trigger";
  const app = createApp(WorkspaceSelect, {
    source: select,
    onChoose(value: string) {
      select.value = value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    },
    labelId: label.id,
    triggerClass: [
      buttonClass,
      "shared-select-trigger",
      prefix + "-trigger",
    ].join(" "),
  });
  installUI(app);
  const view = app.mount(mount) as InstanceType<typeof WorkspaceSelect>;
  const trigger = mount.querySelector<HTMLElement>("[role=combobox]")!;
  signal.addEventListener(
    "abort",
    () => {
      app.unmount();
      mount.remove();
    },
    { once: true },
  );
  return { trigger, sync: view.sync, close: view.close };
}
