import { controllerState } from "../controller-state";
interface ImportRow {
  date: string;
  time: string;
  restDay: string;
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
export const { state: records, useSnapshot: useImportRecords } =
  controllerState({
    rows: [] as ImportRow[],
    choices: {} as Record<number, string>,
    history: [] as History[],
  });
