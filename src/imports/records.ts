import { reactive } from "vue";
interface ImportRow {
  date: string;
  time: string;
  anomaly: string;
  conflict: string;
  manual: boolean;
}
interface History {
  id: string;
  when: string;
  range: string;
  count: number;
}
export const records = reactive({
  rows: [] as ImportRow[],
  choices: {} as Record<number, string>,
  history: [] as History[],
});
