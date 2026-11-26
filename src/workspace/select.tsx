import Select from "antd/es/select";
import { CaretDownIcon } from "../phosphor-icons";
import { mountView } from "../mount-view";
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
  const view = mountView(mount);
  select.tabIndex = -1;
  select.setAttribute("aria-hidden", "true");
  select.classList.add("shared-native-select");
  label.htmlFor = select.id + "Trigger";
  let opened = false;
  let disposed = false;
  function sync() {
    if (disposed) return;
    view.render(
      <Select<string>
        id={label.htmlFor}
        aria-labelledby={label.id}
        className={[
          buttonClass,
          "shared-select-trigger",
          prefix + "-trigger",
        ].join(" ")}
        open={opened && !select.disabled}
        value={select.value}
        disabled={select.disabled}
        virtual={false}
        options={Array.from(select.options, (opt) => ({
          value: opt.value,
          label: opt.text,
          title: "",
          disabled: opt.disabled,
        }))}
        suffixIcon={<CaretDownIcon aria-hidden="true" />}
        getPopupContainer={(node: HTMLElement) =>
          node.closest<HTMLElement>("dialog, [popover]") || document.body
        }
        onOpenChange={(next) => {
          opened = next;
          sync();
        }}
        onChange={(value) => {
          select.value = value;
          opened = false;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          sync();
        }}
      />,
    );
  }
  sync();
  const trigger = mount.querySelector<HTMLElement>("[role=combobox]")!;
  function dispose() {
    disposed = true;
    view.dispose();
    mount.remove();
  }
  if (signal.aborted) dispose();
  else signal.addEventListener("abort", dispose, { once: true });
  return {
    trigger,
    sync,
    close(focus = false) {
      opened = false;
      sync();
      if (focus && !disposed) trigger.focus();
    },
  };
}
