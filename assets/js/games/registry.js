"use strict";
/** Classic-script game catalog. Factories own only their supplied container.
 * create({container, signal}) returns {dispose, resize?, pause?, resume?}.
 * dispose is required; signal is aborted before dispose on every departure.
 * resize receives {width, height} in CSS pixels. Games may persist their own
 * state separately; the shell never reads or writes work records or game saves.
 */
WorkTimeApp.games = (() => {
  const entries = new Map();
  const definitions = new Map();
  async function load(id, rulesOnly = false) {
    if (!rulesOnly) WorkTimeApp.services.gamePrefetch?.prioritize(id);
    const definition = definitions.get(id);
    if (!definition) {
      if (entries.has(id)) return entries.get(id);
      throw Error("Unknown game: " + id);
    }
    await WorkTimeApp.services.assets.scripts(definition.rules);
    if (!rulesOnly) {
      await WorkTimeApp.services.assets.script(
        "assets/js/ui/secondary-runtime.min.js",
        { fetchPriority: "high" },
      );
      await Promise.all([
        WorkTimeApp.ui.loadGameViews(),
        WorkTimeApp.i18n.loadModule("games"),
        WorkTimeApp.services.assets.style("assets/css/game-session.css", {
          before: document.querySelector('link[rel="stylesheet"]'),
        }),
        WorkTimeApp.services.assets.style(definition.style),
        WorkTimeApp.services.assets.script(definition.source),
      ]);
    }
    return entries.get(id);
  }
  return {
    define(catalog) {
      for (const definition of catalog) {
        if (definitions.has(definition.id) || entries.has(definition.id))
          throw Error("Duplicate game definition");
        definitions.set(definition.id, Object.freeze(definition));
        entries.set(
          definition.id,
          Object.freeze({ ...definition, lazy: true }),
        );
      }
    },
    load,
    resources: () => [...definitions.values()],
    prepareArchive: (ids = [...definitions.keys()]) =>
      Promise.all(ids.map((id) => load(id, true))),
    register(entry) {
      if (
        !entry ||
        typeof entry.id !== "string" ||
        !/^[a-z][a-z0-9-]*$/.test(entry.id) ||
        typeof entry.nameKey !== "string" ||
        !entry.nameKey ||
        typeof entry.descriptionKey !== "string" ||
        !entry.descriptionKey ||
        typeof entry.create !== "function" ||
        (entries.has(entry.id) && !entries.get(entry.id).lazy)
      )
        throw Error("Invalid or duplicate game registration");
      entries.set(entry.id, Object.freeze({ ...entry }));
    },
    list() {
      const { t, locale } = WorkTimeApp.i18n;
      const collator = new Intl.Collator(locale, { numeric: true });
      return [...entries.values()].sort(
        (a, b) =>
          collator.compare(t(a.nameKey), t(b.nameKey)) ||
          a.id.localeCompare(b.id),
      );
    },
    get: (id) => entries.get(id),
    createIcon(icon = "sports-esports") {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "ui-icon");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");
      const use = document.createElementNS(svg.namespaceURI, "use");
      use.setAttribute("href", "#icon-" + icon);
      svg.append(use);
      return svg;
    },
  };
})();
