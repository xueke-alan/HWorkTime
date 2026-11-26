export function moveTabFocus(
  event: Pick<
    KeyboardEvent,
    "defaultPrevented" | "key" | "currentTarget" | "target" | "preventDefault"
  >,
) {
  if (
    event.defaultPrevented ||
    !["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)
  )
    return;
  const bar = event.currentTarget as HTMLElement;
  const items = Array.from(
    bar.querySelectorAll<HTMLButtonElement>(
      ":scope > button:not([disabled]):not([hidden])",
    ),
  ).filter((el) => el.getClientRects().length);
  const current = items.indexOf(event.target as HTMLButtonElement);
  if (current < 0) return;
  event.preventDefault();
  const index =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? items.length - 1
        : (current + (event.key === "ArrowRight" ? 1 : -1) + items.length) %
          items.length;
  if (items[current].getAttribute("role") === "tab") items[index].click();
  items[index].focus();
}
