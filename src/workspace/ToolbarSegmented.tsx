import Segmented, { type SegmentedProps } from "antd/es/segmented";
import type { RefObject } from "react";
import "../styles/toolbar-segmented.css";

type ToolbarProps<T extends string | number> = Pick<
  SegmentedProps<T>,
  | "options"
  | "onChange"
  | "disabled"
  | "name"
  | "id"
  | "aria-label"
  | "aria-controls"
  | "aria-labelledby"
> & {
  controlRef?: RefObject<HTMLDivElement | null>;
  className?: string;
  compactOnNarrow?: boolean;
  size?: "small" | "middle";
  "data-hint-text"?: string;
  value: T;
};

export default function ToolbarSegmented<T extends string | number>({
  controlRef,
  value,
  options,
  onChange,
  disabled,
  className = "",
  compactOnNarrow = false,
  size = "middle",
  ...props
}: ToolbarProps<T>) {
  const classes = [
    "toolbar-segmented",
    size === "small" && "toolbar-segmented--small",
    compactOnNarrow && "toolbar-segmented--compact-on-narrow",
    className,
  ];
  return (
    <Segmented<T>
      {...props}
      ref={controlRef}
      value={value}
      options={options}
      disabled={disabled}
      onChange={onChange}
      size={size}
      className={classes.filter(Boolean).join(" ")}
    />
  );
}
