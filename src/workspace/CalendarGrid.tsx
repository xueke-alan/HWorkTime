import { createElement, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { controllerState } from "../controller-state";
import { playInsetWave } from "../inset-wave";

interface Cell {
  key: string;
  tag: string;
}
const layout = controllerState({ cells: [] as Cell[] });
const elements = new Map<string, HTMLElement>();

/** React owns the order and lifetime of day and year cells; their drawing code
 * updates number, weather and motion layers inside the matching surface. */
export function calendarCells(cells: Cell[]) {
  const old = layout.state.cells;
  if (
    old.length !== cells.length ||
    cells.some((cell, i) => cell.key !== old[i].key)
  )
    flushSync(() => {
      layout.state.cells = cells;
    });
  return cells.map((cell) => {
    const element = elements.get(cell.key);
    if (!element) throw Error("Missing mounted calendar cell: " + cell.key);
    return element;
  });
}
export default function CalendarGrid() {
  const { cells } = layout.useSnapshot();
  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>(
      ".day-select:not(:disabled):not([aria-disabled='true'])",
    );
    if (button) playInsetWave(button, event.nativeEvent);
  }
  return (
    <div id="calendar" className="calendar" onClickCapture={handleClick}>
      {cells.map((cell) =>
        createElement(cell.tag, {
          key: cell.key,
          ref: (element: HTMLElement | null) => {
            if (element) elements.set(cell.key, element);
            else elements.delete(cell.key);
          },
        }),
      )}
    </div>
  );
}
