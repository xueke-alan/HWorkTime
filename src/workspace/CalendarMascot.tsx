import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLanguage } from "../ApplicationTheme";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const artwork = (
  <span className="calendar-mascot-art" aria-hidden="true">
    <img
      src="assets/images/calendar-cat.png"
      width={344}
      height={432}
      alt=""
      draggable={false}
    />
  </span>
);

export const showCalendarMascot = () =>
  WorkTimeApp.services.preferences.page.state.showCalendarMascot === true;

function observePreferences(notify: () => void) {
  return WorkTimeApp.services.preferences.page.subscribe(notify);
}

function readReducedMotion() {
  return (
    reducedMotion.matches ||
    document.documentElement.dataset.reducedMotion === "true"
  );
}

function observeReducedMotion(notify: () => void) {
  reducedMotion.addEventListener("change", notify);
  document.addEventListener("worktime:motionchange", notify);
  return () => {
    reducedMotion.removeEventListener("change", notify);
    document.removeEventListener("worktime:motionchange", notify);
  };
}

function InteractiveCat() {
  useLanguage();
  const [raised, setRaised] = useState(false);
  const restTimer = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(restTimer.current), []);

  function lookUp() {
    window.clearTimeout(restTimer.current);
    setRaised(true);
    restTimer.current = window.setTimeout(() => setRaised(false), 1250);
  }

  return (
    <button
      className="calendar-mascot"
      type="button"
      aria-label={WorkTimeApp.i18n.t("calendarMascot.lookUp")}
      data-raised={raised ? "" : undefined}
      onClick={lookUp}
    >
      {artwork}
    </button>
  );
}

export default function CalendarMascot() {
  const visible = useSyncExternalStore(observePreferences, showCalendarMascot);
  const reduce = useSyncExternalStore(observeReducedMotion, readReducedMotion);
  if (!visible) return null;
  return (
    <div className="calendar-mascot-perch">
      {reduce ? (
        <span className="calendar-mascot" aria-hidden="true">
          {artwork}
        </span>
      ) : (
        <InteractiveCat />
      )}
    </div>
  );
}
