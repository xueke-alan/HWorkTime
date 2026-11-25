/** DOM entry for imperative renderers. The caller owns events and lifetime. */
const controls: ReadonlySet<string> = new Set([
  "button",
  "input",
  "select",
  "textarea",
  "dialog",
  "progress",
  "meter",
]);
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
): HTMLElementTagNameMap[K];
export function createElement(tag: string): HTMLElement;
export function createElement(tag: string) {
  const element = document.createElement(tag);
  if (controls.has(tag)) element.dataset.ui = tag;
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
