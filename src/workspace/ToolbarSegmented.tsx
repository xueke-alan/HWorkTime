import Segmented, { type SegmentedProps } from "antd/es/segmented";
import { useLayoutEffect, useRef, type RefObject } from "react";
import "../styles/toolbar-segmented.css";

export default function ToolbarSegmented<T extends string | number>({
  controlRef,
  value,
  className = "",
  compactOnNarrow = false,
  ...props
}: SegmentedProps<T> & {
  controlRef?: RefObject<HTMLDivElement | null>;
  compactOnNarrow?: boolean;
  value: T;
}) {
  const localRef = useRef<HTMLDivElement>(null);
  const ref = controlRef ?? localRef;
  useLayoutEffect(() => {
    const item = ref.current?.querySelector("input:checked")?.closest("label");
    const group = ref.current?.querySelector<HTMLElement>(
      ".ant-segmented-group",
    );
    if (!group) return;
    if (!item) {
      delete group.dataset.positioned;
      return;
    }
    const positionIndicator = () => {
      const track = group.getBoundingClientRect();
      const target = item.getBoundingClientRect();
      group.style.setProperty("--view-left", `${target.left - track.left}px`);
      group.style.setProperty(
        "--view-right",
        `${track.right - target.right}px`,
      );
      group.dataset.positioned = "";
    };
    positionIndicator();
    const observer = new ResizeObserver(positionIndicator);
    observer.observe(group);
    group.querySelectorAll("label").forEach((label) => observer.observe(label));
    return () => observer.disconnect();
  }, [ref, value]);
  const classes = [
    "toolbar-segmented",
    compactOnNarrow && "toolbar-segmented--compact-on-narrow",
    className,
  ];
  return (
    <Segmented<T>
      {...props}
      ref={ref}
      value={value}
      size="large"
      className={classes.filter(Boolean).join(" ")}
    />
  );
}
