import Select from "antd/es/select";
import { mountView } from "../mount-view";

export interface CityOption {
  value: string;
  label: string;
  detail: string;
}
export function mountCityField(host: HTMLElement, input: HTMLInputElement) {
  const view = mountView(host, "sidebar");
  let options: CityOption[] = [];
  let opened = false;
  function Field() {
    return (
      <Select<string>
        id="workCityTrigger"
        aria-labelledby="workCityLabel"
        value={input.value || undefined}
        options={options}
        showSearch={{ optionFilterProp: "label" }}
        virtual={false}
        open={opened}
        onOpenChange={(next) => {
          opened = next;
          render();
        }}
        optionRender={({ data }) => (
          <div className="sidebar-city-option">
            <span>{data.label}</span>
            <small>{data.detail}</small>
          </div>
        )}
        onChange={(value) => {
          input.value = value;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          opened = false;
          render();
        }}
      />
    );
  }
  function render() {
    view.render(<Field />);
  }
  return {
    sync(next: CityOption[]) {
      options = next;
      render();
    },
    close() {
      opened = false;
      render();
    },
    dispose: view.dispose,
  };
}
