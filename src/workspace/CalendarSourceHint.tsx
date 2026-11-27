import ConfigProvider from "antd/es/config-provider";
import Tooltip from "antd/es/tooltip";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import "../styles/calendar-source-hint.css";

interface Hint {
  text: string;
  source?: {
    priority: "oa" | "manual";
    filledStart: boolean;
    filledEnd: boolean;
    switchable: boolean;
  };
  left: number;
  top: number;
  width: number;
  height: number;
}

const selector = ".source-toggle,.record-source-dot[data-hint-text]";
const theme = { token: { borderRadiusXS: 2, borderRadiusOuter: 2 } };

export function SourceHintContent({ hint }: { hint: Hint }) {
  const source = hint.source;
  if (!source) return <>{hint.text}</>;
  const t = (key: string) => WorkTimeApp.i18n.t("source." + key);
  return (
    <div className="calendar-source-hint-content">
      <div className="calendar-source-hint-heading">
        <i
          className={"calendar-source-hint-dot " + source.priority}
          aria-hidden="true"
        />
        <strong>{t(source.priority + "Title")}</strong>
      </div>
      {source.switchable && (
        <div className="calendar-source-hint-action">
          {t(source.priority === "oa" ? "switchManual" : "switchOA")}
        </div>
      )}
    </div>
  );
}

/** The renderer retains source controls; delegate their hints to one Ant tooltip. */
export default function CalendarSourceHint() {
  const [hint, setHint] = useState<Hint | null>(null);
  const id = useId();
  useEffect(() => {
    let target: HTMLElement | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let visible = false;
    const observer = new MutationObserver(() => {
      if (visible) refresh();
    });
    function close() {
      clearTimeout(timer);
      observer.disconnect();
      if (target) {
        const description = (target.getAttribute("aria-describedby") || "")
          .split(/\s+/)
          .filter((value) => value && value !== id)
          .join(" ");
        if (description) target.setAttribute("aria-describedby", description);
        else target.removeAttribute("aria-describedby");
      }
      target = null;
      visible = false;
      setHint(null);
    }
    function refresh() {
      if (!target?.isConnected || target.matches(":disabled")) return close();
      const text = target.dataset.hintText;
      const { left, top, width, height } = target.getBoundingClientRect();
      if (!text || !width || !height) return close();
      const descriptions = new Set(
        (target.getAttribute("aria-describedby") || "")
          .split(/\s+/)
          .filter(Boolean),
      );
      descriptions.add(id);
      target.setAttribute("aria-describedby", [...descriptions].join(" "));
      setHint({
        text,
        source: target.dataset.sourceHint
          ? JSON.parse(target.dataset.sourceHint)
          : undefined,
        left,
        top,
        width,
        height,
      });
    }
    function open(event: Event) {
      if (!(event.target instanceof Element)) return;
      if (event instanceof PointerEvent && event.pointerType === "touch")
        return;
      const next = event.target.closest<HTMLElement>(selector);
      if (
        !next?.closest("#calendar") ||
        next.closest(
          ".calendar-day-content-outgoing,.calendar-navigation-copy",
        ) ||
        next.matches(":disabled")
      )
        return;
      if (next === target) return;
      close();
      target = next;
      const calendar = next.closest("#calendar")!;
      observer.observe(calendar, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["data-hint-text", "data-source-hint", "disabled"],
      });
      timer = setTimeout(
        () => {
          visible = true;
          refresh();
        },
        event.type === "focusin" ? 0 : 240,
      );
    }
    function leave(event: PointerEvent | FocusEvent) {
      if (
        target &&
        event.target instanceof Node &&
        target.contains(event.target) &&
        (!(event.relatedTarget instanceof Node) ||
          !target.contains(event.relatedTarget))
      )
        close();
    }
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("pointerover", open);
    document.addEventListener("pointerout", leave);
    document.addEventListener("focusin", open);
    document.addEventListener("focusout", leave);
    document.addEventListener("keydown", keydown);
    document.addEventListener("scroll", close, true);
    document.addEventListener("visibilitychange", close);
    document.addEventListener("worktime:languagechange", close);
    window.addEventListener("resize", close);
    return () => {
      close();
      document.removeEventListener("pointerover", open);
      document.removeEventListener("pointerout", leave);
      document.removeEventListener("focusin", open);
      document.removeEventListener("focusout", leave);
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("scroll", close, true);
      document.removeEventListener("visibilitychange", close);
      document.removeEventListener("worktime:languagechange", close);
      window.removeEventListener("resize", close);
    };
  }, [id]);
  return createPortal(
    <ConfigProvider theme={theme}>
      <Tooltip
        id={id}
        open={Boolean(hint)}
        trigger={[]}
        title={hint && <SourceHintContent hint={hint} />}
        placement="top"
        arrow={{ pointAtCenter: true }}
        autoAdjustOverflow
        destroyOnHidden
        color="var(--theme-surface-paper, var(--paper))"
        classNames={{ root: "calendar-source-tooltip" }}
        styles={{ container: { color: "var(--ink)", padding: "8px 10px" } }}
      >
        <span
          className="calendar-source-hint-anchor"
          aria-hidden="true"
          style={
            hint
              ? {
                  left: hint.left,
                  top: hint.top,
                  width: hint.width,
                  height: hint.height,
                }
              : undefined
          }
        />
      </Tooltip>
    </ConfigProvider>,
    document.body,
  );
}
