/** DOM entry for imperative renderers. The caller owns events and lifetime. */
export { playInsetWave } from "./inset-wave";

const controls: ReadonlySet<string> = new Set([
  "button",
  "input",
  "select",
  "textarea",
  "dialog",
  "progress",
  "meter",
  "summary",
  "fieldset",
  "nav",
]);
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
): HTMLElementTagNameMap[K];
export function createElement(tag: string): HTMLElement;
export function createElement(tag: string) {
  const element = document.createElement(tag);
  if (tag === "details") element.dataset.ui = "disclosure";
  else if (controls.has(tag)) element.dataset.ui = tag;
  return element;
}
export function createMetricCard(label: string, hasFooter = false) {
  const card = document.createElement("article");
  card.dataset.ui = "card";
  card.className = "card";
  const heading = document.createElement("div"),
    value = document.createElement("div");
  heading.className = "card-label";
  heading.textContent = label;
  value.className = "metric";
  card.append(heading, value);
  if (hasFooter) {
    const footer = document.createElement("div");
    footer.className = "card-foot";
    card.append(footer);
  }
  return card;
}

export function updateSlider(input: HTMLInputElement) {
  const minimum = Number(input.min || 0),
    maximum = Number(input.max || 100);
  const progress =
    maximum > minimum
      ? ((input.valueAsNumber - minimum) / (maximum - minimum)) * 100
      : 0;
  const percent = Math.max(0, Math.min(100, progress));
  input.style.setProperty("--range-fill", percent + "%");
  return percent;
}

export function setGroup(element: Element) {
  element.setAttribute("role", "group");
  element.setAttribute("data-ui", "group");
}
export function createBadge(
  options: {
    text?: string;
    className?: string;
    title?: string;
    hiddenLabel?: boolean;
    textClass?: string;
  } = {},
) {
  const badge = document.createElement("span");
  badge.dataset.ui = "badge";
  if (options.className) badge.className = options.className;
  if (options.title) badge.dataset.hintText = options.title;
  if (options.hiddenLabel) badge.setAttribute("aria-hidden", "true");
  if (options.textClass) {
    const label = document.createElement("span");
    label.className = options.textClass;
    label.textContent = options.text ?? "";
    badge.append(label);
  } else if (options.text != null) badge.textContent = options.text;
  return badge;
}
