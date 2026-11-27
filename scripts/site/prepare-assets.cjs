"use strict";
/** Reproducible runtime catalogs; editorial locale sources remain separate. */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const acorn = require("acorn");
const assert = require("node:assert/strict");
const { minify_sync: minify } = require("terser");
const CleanCSS = require("clean-css");
const postcss = require("postcss");
const root = path.resolve(__dirname, "../..");
function prepareAssets({ check = false } = {}) {
  function write(relative, source) {
    const file = path.join(root, relative);
    if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === source) return;
    if (check) {
      throw Error(
        "Stale runtime asset: " + relative + "; run npm run prepare:assets",
      );
    } else {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const temporary =
        file + "." + require("node:crypto").randomUUID() + ".tmp";
      try {
        fs.writeFileSync(temporary, source, { flag: "wx" });
        fs.renameSync(temporary, file);
      } finally {
        if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
      }
    }
  }
  // Embed pinned Tabler SVGs so controls also work on file://.
  const {
    iconSymbols,
    standaloneIcon,
    controlIconCatalog,
  } = require("./tabler-icons.cjs");
  const symbols = iconSymbols();
  write("assets/icons/local-cafe.svg", standaloneIcon("coffee"));
  const entryHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const sprite = /(<svg class="icon-sprite"[^>]*>)[\s\S]*?<\/svg>/g;
  if ([...entryHtml.matchAll(sprite)].length !== 1)
    throw Error("Expected one icon sprite in index.html");
  const eol = entryHtml.includes("\r\n") ? "\r\n" : "\n";
  write(
    "index.html",
    entryHtml.replace(sprite, (_, opening) =>
      [opening, ...symbols, "</svg>"].join(eol),
    ),
  );
  // The standalone converter shares ConfigProvider icons with the workspace.
  const converterHtml = fs.readFileSync(
    path.join(root, "tools/convert-backup.html"),
    "utf8",
  );
  const controlSprite = [
    '<svg class="icon-sprite" xmlns="http://www.w3.org/2000/svg" width="0" height="0" aria-hidden="true" style="position:absolute;overflow:hidden">',
    ...iconSymbols(controlIconCatalog),
    "</svg>",
  ].join("\n");
  write(
    "tools/convert-backup.html",
    converterHtml.includes('class="icon-sprite"')
      ? converterHtml.replace(
          /<svg class="icon-sprite"[^>]*>[\s\S]*?<\/svg>/,
          controlSprite,
        )
      : converterHtml.replace("<body>", "<body>" + controlSprite),
  );
  // Generate identities/dependencies before embedding this catalog in view-runtime.
  // Classic bundles also work when a browser forbids ES module imports over file://.
  require("./file-workspace-bundle.cjs").fileWorkspaceBundle(
    root,
    write,
    check,
  );
  for (const [name, entry] of Object.entries({
    converter: "src/converter/mount.ts",
  })) {
    const bundle = require("esbuild").buildSync({
      absWorkingDir: root,
      entryPoints: [entry],
      outfile: "assets/js/ui/" + name + "-file.min.js",
      bundle: true,
      format: "iife",
      jsx: "automatic",
      target: "es2022",
      minify: true,
      legalComments: "eof",
      define: { "process.env.NODE_ENV": '"production"' },
      write: false,
    });
    for (const file of bundle.outputFiles) {
      write(path.relative(root, file.path), file.text.replace(/\r\n/g, "\n"));
    }
  }
  const games = [
    "2048",
    "minesweeper",
    "snake",
    "sudoku",
    "jump",
    "sokoban",
    "link",
    "garden",
    "tank",
    "xiangqi",
    "gomoku",
    "sliding-puzzle",
    "klotski",
    "lights-out",
    "jungle",
    "ultimate-ttt",
    "uno",
    "aeroplane",
  ];
  const entries = games.map((id) => {
    const source = fs.readFileSync(
      path.join(root, "assets/js/games", id + ".js"),
      "utf8",
    );
    const tree = acorn.parse(source, { ecmaVersion: "latest" });
    const call = tree.body.find(
      (node) => node.expression?.callee?.property?.name === "register",
    ).expression;
    const metadata = Object.fromEntries(
      call.arguments[0].properties
        .filter((node) =>
          ["id", "nameKey", "descriptionKey", "icon"].includes(node.key.name),
        )
        .map((node) => [node.key.name, node.value.value]),
    );
    const rules = [];
    if (id === "lights-out") rules.push("assets/data/lights-out-legacy.js");
    if (id === "gomoku") rules.push("assets/data/gomoku-legacy.js");
    if (
      [
        "sudoku",
        "sokoban",
        "xiangqi",
        "gomoku",
        "lights-out",
        "klotski",
      ].includes(id)
    )
      rules.push("assets/data/" + id + ".js");
    if (id === "aeroplane") rules.push("assets/js/games/dice3d.js");
    if (id === "tank") rules.push("assets/js/games/tank-stages.js");
    if (id === "gomoku")
      rules.push(
        "assets/js/games/gomoku-search.js",
        "assets/js/games/gomoku-engine.js",
      );
    if (id === "ultimate-ttt")
      rules.push("assets/js/games/ultimate-ttt-engine.js");
    if (id === "xiangqi") rules.push("assets/js/games/xiangqi-engine.js");
    if (id === "jungle")
      rules.push(
        "assets/js/games/jungle-art.js",
        "assets/js/games/jungle-engine.js",
      );
    rules.push("assets/js/games/" + id + "-rules.js");
    if (id === "uno")
      rules.push(
        "assets/js/games/uno-ai.js",
        "assets/js/games/uno-model.js",
        "assets/js/games/uno-view.js",
        "assets/js/games/uno-ranking.js",
      );
    if (id === "aeroplane") rules.push("assets/js/games/aeroplane-ai.js");
    let archiveMetadata = {};
    if (id === "klotski") {
      const bank = { WorkTimeApp: { data: {} } };
      vm.runInNewContext(
        fs.readFileSync(path.join(root, "assets/data/klotski.js"), "utf8"),
        bank,
      );
      archiveMetadata = {
        retiredIds: bank.WorkTimeApp.data.klotskiRetired.map((l) => l.id),
      };
    }
    return {
      ...metadata,
      ...archiveMetadata,
      rules,
      source: "assets/js/games/" + id + ".js",
      style: "assets/css/" + id + ".css",
    };
  });
  write(
    "assets/js/games/catalog.js",
    '"use strict";\n// Generated menu identities; game implementations load only on demand.\nWorkTimeApp.games.define(' +
      JSON.stringify(entries) +
      ");\n",
  );
  // Calendar cells only use the lunar month and day. Generate their month
  // boundaries from the same provider used for the detailed almanac.
  const { Solar } = require(path.join(root, "assets/vendor/lunar.js"));
  let first = Solar.fromYmd(1900, 1, 1);
  const starts = [],
    months = [],
    monthNames = [],
    dayNames = [];
  let offset = 0;
  assert.equal(first.getLunar().getDay(), 1);
  for (let day = 0; day < 30; day++)
    dayNames.push(first.next(day).getLunar().getDayInChinese());
  while (first.getYear() <= 2100) {
    const lunarMonth = first.getLunar();
    const number = lunarMonth.getMonth();
    monthNames[Math.abs(number) - 1] = lunarMonth
      .getMonthInChinese()
      .replace(/^[闰閏]/, "");
    const after29 = first.next(29);
    const length = after29.getLunar().getDay() === 1 ? 29 : 30;
    starts.push(offset);
    months.push(number);
    offset += length;
    first = length === 29 ? after29 : after29.next(1);
  }
  write(
    "assets/data/lunar-months.js",
    "// Generated from lunar.js (MIT, 6tail). See licenses/lunar-javascript.txt.\nWorkTimeApp.data.lunarMonths=" +
      JSON.stringify({ starts, months, monthNames, dayNames }) +
      ";\n",
  );
  // Keep the complete upstream API available to the almanac and festival details.
  const lunar = minify(
    fs.readFileSync(path.join(root, "assets/vendor/lunar.js"), "utf8"),
    {
      compress: false,
      mangle: true,
      format: { comments: false },
    },
  );
  write(
    "assets/vendor/lunar.min.js",
    "/*! Generated from lunar.js; Copyright (c) 2018 6tail. MIT: licenses/lunar-javascript.txt */\n" +
      lunar.code +
      "\n",
  );
  // Keep editable UI modules separate while bounding offline startup bytes.
  // Preserve classic-script dependency order, expressions and exported names.
  // Compact contiguous entry groups to leave room for every active locale.
  for (const [name, modules] of [
    [
      "core",
      [
        "domain/time",
        "domain/state",
        "domain/calendar",
        "domain/records",
        "domain/schedule",
        "domain/batch",
        "domain/statistics",
        "domain/observations",
        "domain/agenda",
        "domain/validation",
        "legacy-v2",
        "legacy-conversion",
        "services/typing-storage",
        "services/vocabulary-storage",
        "services/vocabulary-idle",
        "archive",
        "ui/presentation",
        "ui/elements",
        "ui/storage-status",
        "ui/workspace",
        "services/application",
        "services/template-share",
        "services/save-session",
        "services/derived",
        "services/import-index",
        "services/bootstrap",
        "services/clock",
        "services/clipboard",
        "services/downloads",
        "auto-backup-folder-loader",
        "services/pwa-install",
        "indexed-storage",
        "imports",
        "backup",
      ],
    ],
    [
      "application",
      [
        "ui/hold-action",
        "ui/notifications",
        "ui/summary",
        "ui/calendar-renderer",
        "ui/calendar",
        "ui/analysis-graphics",
        "ui/sidebar-panels",
        "controllers/templates",
        "controllers/secondary",
        "controllers/day-editor",
        "controllers/dialogs",
        "calendar-weather",
      ],
    ],
  ]) {
    const runtime = minify(
      modules
        .map((module) =>
          fs.readFileSync(path.join(root, "assets/js", module + ".js"), "utf8"),
        )
        .join("\n;\n"),
      { compress: true, mangle: true, format: { comments: false } },
    );
    write(
      "assets/js/ui/" + name + "-runtime.min.js",
      "// Generated by scripts/site/prepare-assets.cjs; edit the source modules.\n" +
        runtime.code +
        "\n",
    );
  }
  const secondary = minify(
    [
      "controllers/schedule-range",
      "controllers/settings",
      "controllers/personal-settings",
      "controllers/imports",
      "games/ui",
      "music-i18n",
      "reader-i18n",
    ]
      .map((name) =>
        fs.readFileSync(path.join(root, "assets/js", name + ".js"), "utf8"),
      )
      .join("\n;\n"),
    { compress: true, mangle: true, format: { comments: false } },
  );
  write(
    "assets/js/ui/secondary-runtime.min.js",
    "// Generated by scripts/site/prepare-assets.cjs; edit the source modules.\n" +
      secondary.code +
      "\n",
  );
  const mediaText = ["music", "reader"]
    .map((name) =>
      fs.readFileSync(
        path.join(root, "assets/js/" + name + "-i18n.js"),
        "utf8",
      ),
    )
    .join("\n");
  write(
    "assets/js/ui/media-text-runtime.min.js",
    minify(mediaText, { compress: true, mangle: true }).code + "\n",
  );
  // Preserve expressions and exported properties; only local names/format shrink.
  const agendaFeature = minify(
    [
      "agenda-schedule",
      "agenda-layout",
      "agenda-drag",
      "agenda-timeline-math",
      "agenda-timetable",
      "agenda-card-renderer",
      "agenda-chip-motion",
      "agenda",
    ]
      .map((name) =>
        fs.readFileSync(path.join(root, "assets/js/ui", name + ".js"), "utf8"),
      )
      .join("\n;\n"),
    { compress: true, mangle: true, format: { comments: false } },
  );
  write("assets/js/ui/agenda-feature.min.js", agendaFeature.code + "\n");
  const agenda = minify(
    [
      "popover",
      "date-picker",
      "agenda-entry",
      "analysis",
      "analysis-renderer",
      "editor",
      "../services/backup-cache",
      "../services/runtime-folder-text",
      "../services/runtime-folder",
      "../services/auto-backup-folder",
      "../controllers/backup",
      "../controllers/navigation",
    ]
      .map((name) =>
        fs.readFileSync(path.join(root, "assets/js/ui", name + ".js"), "utf8"),
      )
      .join("\n;\n"),
    { compress: true, mangle: true, format: { comments: false } },
  );
  write(
    "assets/js/ui/agenda-runtime.min.js",
    "// Generated by scripts/site/prepare-assets.cjs; edit the UI source modules.\n" +
      agenda.code +
      "\n",
  );
  // Optional workspaces stay lazy, but their small modules share one request.
  // Keep dependency order and retry the whole unit if its download fails.
  for (const feature of ["music", "reader"]) {
    const modules = [
      `services/${feature}-storage`,
      `services/${feature}-library`,
      ...(feature === "reader" ? ["services/reader-adapters"] : []),
      `controllers/${feature}`,
      "controllers/workspace-expansion",
      "ui/runtime-import",
      `ui/${feature}`,
    ];
    const runtime = minify(
      modules
        .map((name) =>
          fs.readFileSync(path.join(root, "assets/js", name + ".js"), "utf8"),
        )
        .join("\n;\n"),
      { compress: true, mangle: true, format: { comments: false } },
    );
    write(
      `assets/js/ui/${feature}-runtime.min.js`,
      "// Generated by scripts/site/prepare-assets.cjs; edit the source modules.\n" +
        runtime.code +
        "\n",
    );
  }
  const typingRuntime = minify(
    [
      "typing-engine",
      "../data/typing/catalog",
      "controllers/workspace-expansion",
      "ui/typing",
    ]
      .map((name) =>
        fs.readFileSync(path.join(root, "assets/js", name + ".js"), "utf8"),
      )
      .join("\n;\n"),
    { compress: true, mangle: true, format: { comments: false } },
  );
  write(
    "assets/js/ui/typing-runtime.min.js",
    "// Generated by scripts/site/prepare-assets.cjs.\n" +
      typingRuntime.code +
      "\n",
  );
  // Larger view definitions are staged after core services, before the app.
  const vocabularyRuntime = minify(
    ["ui/vocabulary"]
      .map((name) =>
        fs.readFileSync(path.join(root, "assets/js", name + ".js"), "utf8"),
      )
      .join("\n;\n"),
    { compress: true, mangle: true, format: { comments: false } },
  );
  write(
    "assets/js/ui/vocabulary-runtime.min.js",
    "// Generated by scripts/site/prepare-assets.cjs.\n" +
      vocabularyRuntime.code +
      "\n",
  );
  for (const [name, modules] of [
    [
      "date",
      [
        "../data/sources",
        "../data/lunar-months",
        "date-info",
        "../data/weather-cities",
        "weather-config",
        "weather",
        "weather-ui",
        "work-countdown",
        "payday",
        "animation-compat",
        "motion",
      ],
    ],
    ["games-panel", ["controllers/games"]],
    [
      "view",
      [
        "games/registry",
        "games/catalog",
        "services/game-archive",
        "ui/media-text-runtime.min",
        "music",
        "reader",
        "typing",
        "vocabulary",
        "date-info-ui",
        "year-view",
        "summary-numbers",
        "ui/application-runtime.min",
        "ui/agenda-runtime.min",
      ],
    ],
    [
      "startup",
      ["app", "onboarding", "background", "notification-motion", "startup"],
    ],
  ]) {
    const runtime = minify(
      modules
        .map((module) =>
          fs.readFileSync(path.join(root, "assets/js", module + ".js"), "utf8"),
        )
        .join("\n;\n"),
      { compress: true, mangle: true, format: { comments: false } },
    );
    write(
      "assets/js/ui/" + name + "-runtime.min.js",
      "// Generated by scripts/site/prepare-assets.cjs; edit the source modules.\n" +
        runtime.code +
        "\n",
    );
  }
  // All sources share the same directory, so relative URLs keep their meaning.
  // Compact with cascade-aware merging; keep unrelated rule restructuring disabled.
  const styles = [
    "tokens",
    "base",
    "layout",
    "games",
    "editor",
    "dialogs",
    "date-info",
    "weather",
    "summary",
    "calendar",
    "agenda",
    "controls",
    "icons",
    "motion",
    "i18n",
  ];
  // CleanCSS preserves some selector whitespace; normalize Windows checkouts
  // so generated bytes also match a clean Git archive or Linux build.
  const cssSource = postcss.parse(
    styles
      .map((name) =>
        fs
          .readFileSync(path.join(root, "assets/css", name + ".css"), "utf8")
          .replace(/\r\n?/g, "\n"),
      )
      .join("\n"),
  );
  // Explanatory comments stay in editable sources, without consuming the
  // offline entry's byte budget. Preserve license comments and declaration order.
  cssSource.walkComments((comment) => {
    if (!comment.text.startsWith("!")) comment.remove();
  });
  const css = new CleanCSS({
    level: {
      1: { all: true },
      2: {
        mergeIntoShorthands: false,
        restructureRules: false,
      },
    },
    rebase: false,
  }).minify(cssSource.toString());
  if (css.errors.length) throw Error(css.errors.join("\n"));
  write(
    "assets/css/site-runtime.css",
    "/* Generated by scripts/site/prepare-assets.cjs; edit the component styles. */\n" +
      css.styles +
      "\n",
  );
  const data = {};
  const context = vm.createContext({ WorkTimeApp: { data } });
  vm.runInContext(
    fs.readFileSync(path.join(root, "assets/data/klotski-names.js"), "utf8"),
    context,
  );
  const locales = ["zh-CN", "en", "zh-TW", "zh-HK", "ko", "ja"];
  for (const name of [
    ...locales,
    ...locales.slice(1).map((id) => "content-" + id),
    "media",
    "oa",
    "additions",
    "snake",
    "sudoku",
    "jump",
    "sokoban",
    "link",
    "garden",
    "tank",
    "xiangqi",
    "gomoku",
    "sliding-puzzle",
    "klotski",
    "lights-out",
    "jungle",
    "ultimate-ttt",
    "uno",
    "aeroplane",
    "typing",
    "vocabulary",
  ])
    vm.runInContext(
      fs.readFileSync(
        path.join(root, "assets/js/locales", name + ".js"),
        "utf8",
      ),
      context,
    );
  const catalogKeys = Object.keys(data.locales["zh-CN"]);
  // Navigation, backup summaries and playback shortcuts are visible before their feature opens.
  const sharedLabels = new Set([
    "title",
    "name",
    "description",
    "subtitle",
    "tab",
    "start",
    "retry",
    "loading",
    "loadFailed",
    "close",
    "backupIncluded",
    "backupPreserved",
    "previous",
    "next",
    "play",
    "pause",
    "placeholderTitle",
    "placeholderMessage",
    "placeholderClose",
  ]);
  const gameLabels = new Set(
    entries.flatMap((entry) => [entry.nameKey, entry.descriptionKey]),
  );
  function languageModule(key) {
    const parts = key.split(".");
    if (sharedLabels.has(parts.at(-1)) || gameLabels.has(key)) return "core";
    if (parts[0] === "media" && ["reader", "music"].includes(parts[1]))
      return parts[1];
    if (["typing", "vocabulary"].includes(parts[0])) return parts[0];
    // Shared game-menu, archive and history labels stay in the shell.
    if (
      parts[0] === "games" &&
      parts.length >= 3 &&
      !["progress", "history", "archive", "menu"].includes(parts[1])
    )
      return "games";
    return "core";
  }
  const groups = Object.groupBy(catalogKeys, languageModule);
  const runtime = vm.createContext({ WorkTimeApp: { data: {} } });
  for (const id of locales) {
    const content =
      id === "en" ? data.contentEnglish : data.contentLocales?.[id] || {};
    // The base catalog is loaded before every optional locale. Reuse its key
    // order on disk, then reconstruct complete independent catalogs at runtime.
    assert.deepEqual(
      Object.keys(data.locales[id]).sort(),
      [...catalogKeys].sort(),
      "Runtime catalog keys: " + id,
    );
    const values = (keys) =>
      JSON.stringify(keys.map((key) => data.locales[id][key]));
    const catalog =
      id === "zh-CN"
        ? JSON.stringify(
            Object.fromEntries(
              groups.core.map((key) => [key, data.locales[id][key]]),
            ),
          )
        : `Object.fromEntries(WorkTimeApp.data.localeGroups.core.map((key,i)=>[key,values[i]]))`;
    const expression =
      id === "zh-CN" ? catalog : `(values=>${catalog})(${values(groups.core)})`;
    let source =
      '"use strict";\n// Generated by scripts/site/prepare-assets.cjs.\nWorkTimeApp.data.locales ||= {};\nWorkTimeApp.data.locales[' +
      JSON.stringify(id) +
      "] = " +
      expression +
      ";\nWorkTimeApp.data.contentLocales ||= {};\nWorkTimeApp.data.contentLocales[" +
      JSON.stringify(id) +
      "] = " +
      JSON.stringify(content) +
      ";\n" +
      (id === "en"
        ? "WorkTimeApp.data.contentEnglish = WorkTimeApp.data.contentLocales.en;\n"
        : "");
    if (id === "zh-CN") {
      source +=
        'WorkTimeApp.data.localeGroups={core:Object.keys(WorkTimeApp.data.locales["zh-CN"])};\n';
    }
    vm.runInContext(source, runtime);
    for (const [group, keys] of Object.entries(groups)) {
      if (group === "core") continue;
      const target = `WorkTimeApp.data.locales[${JSON.stringify(id)}]`;
      const groupName = JSON.stringify(group);
      const part =
        id === "zh-CN"
          ? `{const messages=${JSON.stringify(Object.fromEntries(keys.map((key) => [key, data.locales[id][key]])))};WorkTimeApp.data.localeGroups[${groupName}]=Object.keys(messages);Object.assign(${target},messages);}\n`
          : `{const values=${values(keys)};const keys=WorkTimeApp.data.localeGroups[${groupName}];const catalog=${target};keys.forEach((key,i)=>catalog[key]=values[i]);}\n`;
      write(`assets/js/locales/runtime/${group}/${id}.js`, part);
      vm.runInContext(part, runtime);
    }
    assert.deepEqual(
      Object.entries(runtime.WorkTimeApp.data.locales[id]).sort(),
      Object.entries(data.locales[id]).sort(),
      "Runtime catalog must preserve all translations: " + id,
    );
    write("assets/js/locales/runtime/" + id + ".js", source);
  }
  write(
    "offline-shell.js",
    require("../lib/offline-shell.cjs").offlineShell(root),
  );
}
if (require.main === module)
  prepareAssets({ check: process.argv.includes("--check") });
module.exports = { prepareAssets };
