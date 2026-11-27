import InputNumber, { type InputNumberProps } from "antd/es/input-number";
import { useLayoutEffect, useRef, useState, type ComponentRef } from "react";

const bindings = new WeakMap<
  HTMLInputElement,
  (value: number | null) => void
>();

/** Controllers explicitly synchronize a value. Never intercept React's native
 * input setter: the input library also writes it while committing a render. */
export function bindNumberValue(
  input: HTMLInputElement,
  changed: (value: number | null) => void,
) {
  bindings.set(input, changed);
  return () => {
    bindings.delete(input);
  };
}
export function setNumberValue(
  input: HTMLInputElement,
  value: string | number,
) {
  input.value = String(value);
  const text = String(value).trim();
  bindings.get(input)?.(
    text === "" || !Number.isFinite(Number(text)) ? null : Number(text),
  );
}

export function NumberField(props: InputNumberProps<number>) {
  const ref = useRef<ComponentRef<typeof InputNumber>>(null);
  const [value, setValue] = useState<number | null>(props.defaultValue ?? null);
  const [attributes, setAttributes] = useState({
    disabled: !!props.disabled,
    min: props.min,
    max: props.max,
  });
  const current = useRef(value);
  const update = (next: number | null) => {
    if (Object.is(current.current, next)) return;
    current.current = next;
    setValue(next);
  };
  useLayoutEffect(() => {
    const input = ref.current!.nativeElement.querySelector("input")!;
    const unbind = bindNumberValue(input, update);
    const observer = new MutationObserver(() =>
      setAttributes({
        disabled: input.disabled,
        min: input.min === "" ? undefined : Number(input.min),
        max: input.max === "" ? undefined : Number(input.max),
      }),
    );
    observer.observe(input, {
      attributes: true,
      attributeFilter: ["disabled", "min", "max"],
    });
    return () => {
      observer.disconnect();
      unbind();
    };
  }, []);
  return (
    <InputNumber<number>
      {...props}
      {...attributes}
      ref={ref}
      type="number"
      controls={false}
      keyboard={props.id !== "dayLeave"}
      value={value}
      className="sidebar-number-field"
      classNames={{ input: props.className }}
      onChange={update}
      onStep={() =>
        queueMicrotask(() => {
          ref.current?.nativeElement
            .querySelector("input")
            ?.dispatchEvent(new Event("input", { bubbles: true }));
        })
      }
    />
  );
}
