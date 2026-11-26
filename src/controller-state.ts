import { useSyncExternalStore } from "react";

/** Controllers replace view fields; React reads a stable snapshot of those fields. */
export function controllerState<T extends object>(initial: T) {
  let snapshot = { ...initial };
  const listeners = new Set<() => void>();
  const state = new Proxy(initial, {
    set(target, key, value) {
      if (Object.is(Reflect.get(target, key), value)) return true;
      Reflect.set(target, key, value);
      snapshot = { ...target };
      for (const listener of listeners) listener();
      return true;
    },
  });
  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
  const read = () => snapshot;
  return { state, useSnapshot: () => useSyncExternalStore(subscribe, read) };
}
