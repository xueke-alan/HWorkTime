import { flushSync } from "react-dom";
import { controllerState } from "../controller-state";

export interface HoverView {
  date: string;
  weekday: string;
  rows: {
    key: string;
    label: string;
    value: string;
    tags?: { key: string; label: string }[];
  }[];
}

export const hover = controllerState<{
  value: HoverView | null;
  left: number;
  top: number;
}>({ value: null, left: 0, top: 0 });

export function renderAnalysisHover(value: HoverView | null) {
  flushSync(() => {
    hover.state.value = value;
  });
}

export function positionAnalysisHover(left: number, top: number) {
  if (hover.state.left === left && hover.state.top === top) return;
  flushSync(() => {
    hover.state.left = left;
    hover.state.top = top;
  });
}
