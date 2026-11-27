import Switch from "antd/es/switch";
import { useLayoutEffect, useRef, useState } from "react";

const bindings = new WeakMap<HTMLInputElement, (value: boolean) => void>();
export function setCheckedValue(input: HTMLInputElement, checked: boolean) {
  input.checked = checked;
  bindings.get(input)?.(checked);
}

/** A hidden checkbox keeps the scheduling controller's existing checked API. */
export function SwitchField({
  id,
  labelId,
  defaultChecked = false,
}: {
  id: string;
  labelId: string;
  defaultChecked?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [checked, setChecked] = useState(defaultChecked);
  useLayoutEffect(() => {
    const input = ref.current!;
    bindings.set(input, setChecked);
    return () => {
      bindings.delete(input);
    };
  }, []);
  return (
    <>
      <input
        ref={ref}
        id={id}
        type="checkbox"
        hidden
        defaultChecked={defaultChecked}
      />
      <Switch
        id={id + "Switch"}
        aria-labelledby={labelId}
        checked={checked}
        onChange={(value) => {
          setCheckedValue(ref.current!, value);
          ref.current!.dispatchEvent(new Event("change", { bubbles: true }));
        }}
      />
    </>
  );
}
