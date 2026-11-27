import type { ConfigProviderProps } from "antd/es/config-provider";

type ShowWaveEffect = NonNullable<ConfigProviderProps["wave"]>["showEffect"];

const activeWaves = new WeakMap<HTMLElement, () => void>();

export const showInsetWave: ShowWaveEffect = (target, { component, event }) => {
  if (component === "Checkbox" && !target.querySelector("input")?.checked)
    return;
  playInsetWave(target, event);
};

export function playInsetWave(target: HTMLElement, event: MouseEvent) {
  if (!target.isConnected || typeof target.animate !== "function") return;

  activeWaves.get(target)?.();
  const needsAnchor = getComputedStyle(target).position === "static";
  if (needsAnchor) target.classList.add("site-inset-wave-anchor");

  const holder = document.createElement("span");
  holder.className = "site-inset-wave";
  holder.setAttribute("aria-hidden", "true");
  target.prepend(holder);
  const removeHolder = () => {
    holder.remove();
    if (needsAnchor) target.classList.remove("site-inset-wave-anchor");
  };

  const box = holder.getBoundingClientRect();
  const { clientWidth: width, clientHeight: height } = holder;
  if (!box.width || !box.height || !width || !height) {
    removeHolder();
    return;
  }
  const pointerInside =
    (event.detail > 0 || event.type === "pointerdown") &&
    event.clientX >= box.left &&
    event.clientX <= box.right &&
    event.clientY >= box.top &&
    event.clientY <= box.bottom;
  const x = pointerInside
    ? ((event.clientX - box.left) / box.width) * width
    : width / 2;
  const y = pointerInside
    ? ((event.clientY - box.top) / box.height) * height
    : height / 2;
  const diameter =
    2 * Math.hypot(Math.max(x, width - x), Math.max(y, height - y));

  const dot = document.createElement("span");
  dot.className = "site-inset-wave-dot";
  Object.assign(dot.style, {
    left: `${x}px`,
    top: `${y}px`,
    width: `${diameter}px`,
    height: `${diameter}px`,
  });
  holder.append(dot);
  const animation = dot.animate(
    [
      { transform: "translate(-50%, -50%) scale(0)", opacity: 0.26 },
      { transform: "translate(-50%, -50%) scale(1)", opacity: 0 },
    ],
    { duration: 420, easing: "ease-out" },
  );
  const cleanup = () => {
    if (activeWaves.get(target) !== cleanup) return;
    activeWaves.delete(target);
    removeHolder();
    animation.cancel();
  };
  activeWaves.set(target, cleanup);
  void animation.finished.then(cleanup, cleanup);
}
