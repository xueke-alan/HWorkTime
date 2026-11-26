import Button from "antd/es/button";
import Input from "antd/es/input";
import { TrashIcon } from "../../phosphor-icons";
import type { MouseEvent } from "react";
export interface BreakRow {
  start: string;
  end: string;
}
function clear(event: MouseEvent<HTMLButtonElement>) {
  const inputs = event.currentTarget
    .closest(".breakrow")
    ?.querySelectorAll("input");
  if (!inputs?.length) return;
  for (const input of Array.from(inputs)) input.value = "";
  inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
}
export default function BreakFields({
  rows,
  startLabel,
  endLabel,
  clearLabel,
}: {
  rows: BreakRow[];
  startLabel: string;
  endLabel: string;
  clearLabel: string;
}) {
  return rows.map((row, index) => (
    <div key={index} className="breakrow">
      <Input
        key={"start-" + row.start}
        aria-label={startLabel}
        placeholder="12:00"
        defaultValue={row.start}
        className="clock-input hw-field breakstart"
        inputMode="numeric"
        maxLength={5}
        autoComplete="off"
        spellCheck={false}
      />
      <Input
        key={"end-" + row.end}
        aria-label={endLabel}
        placeholder="13:00"
        defaultValue={row.end}
        className="clock-input hw-field breakend"
        inputMode="numeric"
        maxLength={5}
        autoComplete="off"
        spellCheck={false}
      />
      <Button
        aria-label={clearLabel}
        data-hint-text={clearLabel}
        onClick={clear}
        className="hw-button ui-button icon-only"
        icon={<TrashIcon aria-hidden="true" />}
      />
    </div>
  ));
}
