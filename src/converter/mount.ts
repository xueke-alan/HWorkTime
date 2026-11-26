import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { BackupConverter } from "./BackupConverter";
import { ApplicationTheme } from "../ApplicationTheme";

const host = document.getElementById("converter");
if (!host) throw new Error("Missing backup converter container");
const root = createRoot(host);
root.render(
  createElement(ApplicationTheme, null, createElement(BackupConverter)),
);

window.addEventListener("pagehide", (event) => {
  if (!event.persisted) root.unmount();
});
