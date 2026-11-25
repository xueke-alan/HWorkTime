"use strict";
const globals = require("globals");
// Runtime namespaces are classic-script contracts declared by the ordered entry point.
const runtime = Object.fromEntries(
  ["WorkTimeApp"].map((name) => [name, "readonly"]),
);
const rules = {
  "no-undef": "error",
  "no-dupe-args": "error",
  "no-dupe-keys": "error",
  "no-unreachable": "error",
  "valid-typeof": "error",
  "no-constant-condition": ["error", { checkLoops: false }],
  "no-unused-vars": [
    "warn",
    {
      vars: "local",
      args: "none",
      caughtErrors: "none",
      ignoreRestSiblings: true,
    },
  ],
};
module.exports = [
  ...require("eslint-plugin-vue").configs["flat/essential"],
  {
    files: ["src/**/*.vue"],
    languageOptions: {
      parserOptions: { parser: require("@typescript-eslint/parser") },
    },
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: { parser: require("@typescript-eslint/parser") },
    rules: { "no-debugger": "error" },
  },
  {
    ignores: [
      "node_modules/**",
      ".refactor-backups/**",
      "assets/vendor/**",
      "assets/data/**",
      "scripts/vendor/**",
    ],
  },
  {
    files: ["assets/js/**/*.js", "tools/**/*.js"],
    languageOptions: {
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...runtime,
      },
    },
    rules,
  },
  {
    // Historical namespaces belong only to the standalone conversion page.
    files: ["tools/**/*.js"],
    languageOptions: {
      globals: {
        WorkLegacyV2: "readonly",
        WorkBackupConversion: "readonly",
      },
    },
  },
  {
    files: ["scripts/**/*.cjs", "tests/**/*.cjs", "eslint.config.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: { ...globals.node, ...globals.browser, ...runtime },
    },
    rules,
  },
];
