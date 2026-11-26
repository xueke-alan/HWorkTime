"use strict";
WorkTimeApp.ui.fileChunks = (() => {
  const definitions = new Map(),
    loaded = new Map(),
    pending = new Map();
  async function initialize(id) {
    await WorkTimeApp.services.assets.script(
      "assets/js/ui/file-chunks/" + id + ".js",
    );
    const { deps, factory } = definitions.get(id);
    await Promise.all(Object.values(deps).map(load));
    const module = { exports: {} };
    factory((name) => loaded.get(deps[name]), module, module.exports);
    loaded.set(id, module.exports);
    return module.exports;
  }
  function load(id) {
    if (!pending.has(id))
      pending.set(
        id,
        initialize(id).catch((error) => {
          pending.delete(id);
          throw error;
        }),
      );
    return pending.get(id);
  }
  return {
    load,
    define(id, deps, factory) {
      definitions.set(id, { deps, factory });
    },
  };
})();
