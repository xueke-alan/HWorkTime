"use strict";
const path = require("node:path");
const { buildSync, transformSync } = require("esbuild");
const { createHash } = require("node:crypto");

// file:// blocks module fetches. Keep esbuild's shared dependency graph and
// deliver its chunks through the same classic script loader as the game engines.
function fileWorkspaceBundle(root, write, check) {
  const directory = "assets/js/ui/file-chunks";
  const build = buildSync({
    absWorkingDir: root,
    entryPoints: ["src/file-workspace.ts"],
    outdir: directory,
    bundle: true,
    splitting: true,
    format: "esm",
    charset: "utf8",
    jsx: "automatic",
    target: "es2022",
    minify: true,
    metafile: true,
    legalComments: "eof",
    define: { "process.env.NODE_ENV": '"production"' },
    write: false,
  });
  const outputs = build.metafile.outputs;
  const names = new Map();
  for (const [file, info] of Object.entries(outputs)) {
    if (!file.endsWith(".js")) continue;
    // Stable resource names; the Pages manifest versions the bytes separately.
    const identity =
      info.entryPoint || Object.keys(info.inputs).sort().join("\n");
    names.set(
      file,
      createHash("sha256").update(identity).digest("hex").slice(0, 16),
    );
  }
  if (new Set(names.values()).size !== names.size)
    throw Error("Duplicate local module identity");
  const entryFile = [...names.keys()].find(
    (file) => outputs[file].entryPoint === "src/file-workspace.ts",
  );
  const entryStyles = outputs[entryFile].cssBundle;
  for (const file of build.outputFiles) {
    const relative = path.relative(root, file.path).split(path.sep).join("/");
    if (relative.endsWith(".css")) {
      if (relative === entryStyles)
        write("assets/js/ui/workspace-file.min.css", file.text);
      else if (
        !Object.keys(outputs[relative].inputs).every((input) =>
          Object.hasOwn(outputs[entryStyles].inputs, input),
        )
      ) {
        throw Error(
          "File entry is missing a deferred component stylesheet: " + relative,
        );
      }
      continue;
    }
    const deps = {},
      info = outputs[relative];
    const rewrittenImports = new Set();
    let source = file.text;
    for (const { path: target, kind } of info.imports) {
      const spec = "./" + path.posix.basename(target);
      const id = names.get(target);
      if (!id) throw Error("Missing local module " + target);
      if (kind === "dynamic-import") {
        if (rewrittenImports.has(spec)) continue;
        rewrittenImports.add(spec);
        const token = "import(" + JSON.stringify(spec) + ")";
        if (!source.includes(token))
          throw Error("Unexpected dynamic import in " + relative);
        source = source.replaceAll(
          token,
          "WorkTimeApp.ui.fileChunks.load(" + JSON.stringify(id) + ")",
        );
      } else deps[spec] = id;
    }
    const common = transformSync(source, {
      charset: "utf8",
      format: "cjs",
      minify: true,
      target: "es2022",
      legalComments: "eof",
    }).code;
    write(
      directory + "/" + names.get(relative) + ".js",
      "WorkTimeApp.ui.fileChunks.define(" +
        JSON.stringify(names.get(relative)) +
        "," +
        JSON.stringify(deps) +
        ",function(require,module,exports){" +
        require("terser").minify_sync(common, {
          ecma: 2022,
          compress: { passes: 2 },
          mangle: true,
          format: { comments: "some" },
        }).code +
        "\n" +
        "});\n",
    );
  }
  const entry = [...names].find(
    ([file]) => outputs[file].entryPoint === "src/file-workspace.ts",
  )[1];
  const fs = require("node:fs");
  const outputDirectory = path.join(root, directory);
  const active = new Set([...names.values()].map((id) => id + ".js"));
  for (const item of fs.readdirSync(outputDirectory, { withFileTypes: true })) {
    if (
      !item.isFile() ||
      !/^[a-f0-9]{16}\.js$/.test(item.name) ||
      active.has(item.name)
    )
      continue;
    const file = path.join(outputDirectory, item.name);
    const signature =
      'WorkTimeApp.ui.fileChunks.define("' + item.name.slice(0, -3) + '",';
    if (!fs.readFileSync(file, "utf8").startsWith(signature))
      throw Error(
        "Unexpected file in generated module directory: " + item.name,
      );
    if (check) throw Error("Stale generated file module: " + item.name);
    fs.unlinkSync(file);
  }
  write(
    "assets/js/ui/workspace-file.min.js",
    fs
      .readFileSync(
        path.join(root, "assets/js/ui/file-chunk-loader.js"),
        "utf8",
      )
      .replace(/\r\n/g, "\n") +
      "\nWorkTimeApp.ui.loadFileWorkspace = () => WorkTimeApp.ui.fileChunks.load(" +
      JSON.stringify(entry) +
      ");\n",
  );
}
module.exports = { fileWorkspaceBundle };
