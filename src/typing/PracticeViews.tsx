import type { CSSProperties, ReactNode } from "react";
import { mountView } from "../mount-view";

interface Hint {
  key: string;
  shift: boolean;
  shiftHand: string;
}
function Keyboard({
  rows,
  hint,
  heat,
}: {
  rows: readonly (string | string[])[];
  hint: Hint | null;
  heat?: Record<string, number>;
}) {
  return (
    <>
      {rows.map((row, index) => (
        <div key={index} className="typing-key-row">
          {Array.from(row).map((key) => {
            const count = heat
              ? (heat[key] || 0) + (heat[key.toUpperCase()] || 0)
              : 0;
            return (
              <span
                key={key}
                data-key={key}
                className={
                  "typing-key" +
                  (hint?.key === key ? " is-next" : "") +
                  (count ? " has-errors" : "")
                }
                style={
                  count
                    ? ({
                        "--key-intensity": Math.min(0.8, 0.15 + count / 20),
                      } as CSSProperties)
                    : undefined
                }
                data-hint-text={heat ? key + ": " + count : undefined}
              >
                {key}
              </span>
            );
          })}
        </div>
      ))}
      <div className="typing-key-row">
        {["shift-left", " ", "shift-right"].map((key) => {
          const pressed =
            hint?.key === key ||
            (hint?.shift && key === "shift-" + hint.shiftHand);
          return (
            <span
              key={key}
              className={
                "typing-key " +
                (key === " " ? "typing-space" : "typing-shift") +
                (pressed ? " is-next" : "")
              }
              data-key={key}
            >
              {key === " " ? "␣" : "Shift"}
            </span>
          );
        })}
      </div>
    </>
  );
}
interface TextProps {
  chars: string[];
  input: string[];
  offset: number;
  end: number;
  cards: boolean;
  width: number;
}
function PracticeText({ chars, input, offset, end, cards, width }: TextProps) {
  const visible = Math.max(3, Math.min(7, Math.floor((width || 700) / 92)));
  const start = Math.max(0, Math.min(chars.length - visible, input.length - 1));
  return chars.slice(offset, end).map((char, position) => {
    const index = offset + position;
    const state =
      index < input.length
        ? input[index] === char
          ? "is-correct"
          : "is-error"
        : index === input.length
          ? "is-cursor"
          : "";
    return (
      <span
        key={index}
        className={[state, cards && char === " " && "is-space"]
          .filter(Boolean)
          .join(" ")}
        hidden={cards && (index < start || index >= start + visible)}
      >
        {char}
      </span>
    );
  });
}
export function practiceViews() {
  const roots = new Map<HTMLElement, ReturnType<typeof mountView>>();
  function render(host: HTMLElement, node: ReactNode) {
    let root = roots.get(host);
    if (!root) {
      root = mountView(host);
      roots.set(host, root);
    }
    root.render(node);
  }
  return {
    text(host: HTMLElement, props: TextProps) {
      render(host, <PracticeText {...props} />);
    },
    keyboard(
      host: HTMLElement,
      rows: (string | string[])[],
      hint: Hint | null,
      heat?: Record<string, number>,
    ) {
      render(host, <Keyboard {...{ rows, hint, heat }} />);
    },
    metrics(host: HTMLElement, items: { label: string; value: string }[]) {
      render(
        host,
        items.map(({ label, value }) => (
          <div key={label} className="typing-metric">
            <span className="typing-muted">{label}</span>
            <strong>{value}</strong>
          </div>
        )),
      );
    },
    reset() {
      for (const root of roots.values()) root.dispose();
      roots.clear();
    },
  };
}
