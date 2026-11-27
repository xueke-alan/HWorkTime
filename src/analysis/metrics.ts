import { controllerState } from "../controller-state";
import { flushSync } from "react-dom";
export interface Metric {
  key: string;
  label: string;
  title: string;
  context: string;
  numeric: string;
  dates: string[];
  remainingDateCount: string;
}
interface MetricGroup {
  key: string;
  title: string;
  description: string;
  items: Metric[];
}
type Paint = (el: HTMLElement, markup: string, delay: number) => void;
export const metrics = controllerState<{
  value?: { groups: MetricGroup[]; paint: Paint };
}>({});
export function renderAnalysisMetrics(groups: MetricGroup[], paint: Paint) {
  flushSync(() => {
    metrics.state.value = { groups, paint };
  });
}
export function afterAnalysisRender(callback: () => void) {
  queueMicrotask(callback);
}
