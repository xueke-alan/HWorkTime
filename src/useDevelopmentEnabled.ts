import { useSyncExternalStore } from "react";

function observeDevelopment(notify: () => void) {
  window.addEventListener("hashchange", notify);
  return () => window.removeEventListener("hashchange", notify);
}

export default function useDevelopmentEnabled() {
  return useSyncExternalStore(
    observeDevelopment,
    WorkTimeApp.isDevelopmentEnabled,
  );
}
