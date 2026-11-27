"use strict";
const fs = require("node:fs");
const catalog = require("../../assets/icons/tabler.json");
const controlIconCatalog = Object.fromEntries(
  [
    "caret-down",
    "check",
    "close",
    "error",
    "info",
    "more-horiz",
    "add",
    "progress-activity",
    "warning",
  ].map((id) => [id, catalog[id]]),
);

// Place drawing attributes inside each symbol: parent SVGs include custom
// progress rings and may use a different fill, stroke or coordinate system.
const drawingAttributes =
  'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

function iconBody(glyph) {
  const svg = fs.readFileSync(
    require.resolve(`@tabler/icons/outline/${glyph}.svg`),
    "utf8",
  );
  const match =
    /^<svg\b[^>]*viewBox="0 0 24 24"[^>]*>([\s\S]+)<\/svg>\s*$/.exec(svg);
  if (!match) throw Error("Unexpected Tabler SVG for " + glyph);
  return match[1].trim().replace(/\r\n/g, "\n");
}

function symbolBody(glyph) {
  return `<g ${drawingAttributes}>${iconBody(glyph)}</g>`;
}

function iconSymbols(entries = catalog) {
  return Object.entries(entries).map(
    ([id, glyph]) =>
      ` <symbol id="icon-${id}" viewBox="0 0 24 24">${symbolBody(glyph)}</symbol>`,
  );
}

function standaloneIcon(glyph) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" ${drawingAttributes}>${iconBody(glyph)}</svg>\n`;
}

module.exports = {
  iconBody,
  symbolBody,
  iconSymbols,
  standaloneIcon,
  controlIconCatalog,
};
