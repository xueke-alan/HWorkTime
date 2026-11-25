export function bindScroll(
  list: HTMLElement,
  scrollArea: HTMLElement,
  scrollTrack: HTMLElement,
  scrollThumb: HTMLElement,
) {
  function syncScrollbar() {
    const height = list.clientHeight;
    const range = list.scrollHeight - height;
    scrollTrack.hidden = range <= 1 || height === 0;
    if (scrollTrack.hidden) return;
    const trackHeight = scrollTrack.clientHeight;
    const thumbHeight = Math.min(
      trackHeight,
      Math.max(24, (height / list.scrollHeight) * trackHeight),
    );
    scrollThumb.style.height = thumbHeight + "px";
    scrollThumb.style.transform =
      "translateY(" +
      (list.scrollTop / range) * (trackHeight - thumbHeight) +
      "px)";
  }
  list.addEventListener("scroll", syncScrollbar, { passive: true });
  const scrollObserver = new ResizeObserver(syncScrollbar);
  scrollObserver.observe(list);
  let drag: { y: number; top: number; ratio: number } | null = null;
  scrollTrack.onpointerdown = (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const bounds = scrollThumb.getBoundingClientRect();
    const travel = scrollTrack.clientHeight - bounds.height;
    if (travel <= 0) return;
    const ratio = (list.scrollHeight - list.clientHeight) / travel;
    if (event.target !== scrollThumb)
      list.scrollTop =
        (event.clientY -
          scrollTrack.getBoundingClientRect().top -
          bounds.height / 2) *
        ratio;
    drag = { y: event.clientY, top: list.scrollTop, ratio };
    scrollTrack.setPointerCapture(event.pointerId);
    scrollArea.classList.add("is-dragging");
  };
  scrollTrack.onpointermove = (event) => {
    if (drag) list.scrollTop = drag.top + (event.clientY - drag.y) * drag.ratio;
  };
  scrollTrack.onlostpointercapture = () => {
    drag = null;
    scrollArea.classList.remove("is-dragging");
  };
  for (const button of Array.from(list.children))
    scrollObserver.observe(button);
  return () => {
    scrollObserver.disconnect();
    list.removeEventListener("scroll", syncScrollbar);
    scrollTrack.onpointerdown =
      scrollTrack.onpointermove =
      scrollTrack.onlostpointercapture =
        null;
  };
}
