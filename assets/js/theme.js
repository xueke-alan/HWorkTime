"use strict";
/** Render the shared preference owner's theme and picker; no storage writes. */
(() => {
  const preferences = WorkTimeApp.services.preferences.page;
  const { themes, normalize } = WorkTimeApp.domain.preferences;
  const favicon = document.querySelector('link[rel="icon"]');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const originalIcon = favicon?.getAttribute("href");
  let current = "green";
  let unsubscribeTheme = null;
  function connect() {
    if (!unsubscribeTheme)
      unsubscribeTheme = preferences.subscribe((state) =>
        apply(state.pageTheme),
      );
    apply(preferences.state.pageTheme);
  }
  function apply(id) {
    const theme = normalize(id);
    const root = document.documentElement;
    if (current === theme && root.dataset.theme === theme) return theme;
    current = theme;
    const color = themes.find((item) => item.id === theme).color;
    root.dataset.theme = theme;
    themeColor?.setAttribute("content", color);
    if (originalIcon) {
      favicon.setAttribute(
        "href",
        theme === "green"
          ? originalIcon
          : originalIcon.replace("%2324775f", "%23" + color.slice(1)),
      );
    }
    document.dispatchEvent(new Event("worktime:themechange"));
    return theme;
  }
  WorkTimeApp.ui.theme = Object.freeze({
    apply,
    dispose() {
      unsubscribeTheme?.();
      unsubscribeTheme = null;
    },
  });
  connect();
})();
