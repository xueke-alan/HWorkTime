import { nextTick, shallowRef } from "vue";
export interface Metric {
  key: string;
  label: string;
  title: string;
  context: string;
  numeric: string;
  dates: string[];
  dateCount: string;
  dateHint: string;
}
interface MetricGroup {
  key: string;
  title: string;
  description: string;
  items: Metric[];
}
type Paint = (el: HTMLElement, markup: string, delay: number) => void;
export const metrics = shallowRef<{ groups: MetricGroup[]; paint: Paint }>();
export function renderAnalysisMetrics(groups: MetricGroup[], paint: Paint) {
  metrics.value = { groups, paint };
}
export function afterAnalysisRender(callback: () => void) {
  void nextTick(callback);
}
