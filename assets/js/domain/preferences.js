"use strict";
/** Theme identities shared by backup validation, preference storage and presentation. */
const WorkTimeDomainPreferences = (() => {
  const themes = Object.freeze(
    [
      { id: "green", name: "清新绿", color: "#157e68" },
      { id: "blue", name: "天空蓝", color: "#2563a6" },
      { id: "purple", name: "柔和紫", color: "#7652a3" },
      { id: "orange", name: "暖橙色", color: "#a85616" },
      { id: "gold", name: "琥珀金", color: "#846312" },
      { id: "red", name: "朱砂红", color: "#ad3e3e" },
      { id: "pink", name: "樱花粉", color: "#c44782" },
      { id: "brown", name: "可可棕", color: "#805b43" },
      { id: "black", name: "经典黑", color: "#222222" },
    ].map((theme) => Object.freeze(theme)),
  );
  // Archives and paint caches may still contain the retired shades.
  const aliases = Object.freeze({
    rose: "pink",
    slate: "black",
    cyan: "blue",
    mint: "green",
    olive: "green",
  });
  const isTheme = (id) =>
    themes.some((theme) => theme.id === id) || Object.hasOwn(aliases, id);
  return Object.freeze({
    themes,
    isTheme,
    normalize: (id) =>
      Object.hasOwn(aliases, id) ? aliases[id] : isTheme(id) ? id : "green",
  });
})();

WorkTimeApp.domain.preferences = WorkTimeDomainPreferences;
