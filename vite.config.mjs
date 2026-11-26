import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function livePreview() {
  return {
    name: "hworktime-live-preview",
    configurePreviewServer(server) {
      const workerPath = server.config.base + "service-worker.js";
      const worker = `
        self.addEventListener("install", (event) => {
          event.waitUntil(self.skipWaiting());
        });
        self.addEventListener("activate", (event) => {
          event.waitUntil(self.clients.claim());
        });
      `;
      server.middlewares.use((request, response, next) => {
        if (request.url?.split("?")[0] !== workerPath) return next();
        // Replace any offline worker previously installed at the preview URL.
        // Without a fetch handler, each preview navigation goes to the server.
        response.setHeader("Content-Type", "text/javascript; charset=utf-8");
        response.setHeader("Cache-Control", "no-store");
        response.end(worker);
      });
    },
  };
}

export default defineConfig({
  base: "./",
  appType: "mpa",
  plugins: [react(), livePreview()],
  build: {
    outDir: "dist/workspace",
    manifest: true,
    minify: "terser",
    terserOptions: { ecma: 2022, compress: { passes: 2 } },
    cssCodeSplit: false,
    rollupOptions: {
      preserveEntrySignatures: "strict",
      input: {
        converter: "src/converter/mount.ts",
        workspace: "src/workspace-entry.ts",
        agenda: "src/agenda/mount.ts",
      },
      output: {
        entryFileNames: "[name]-[hash].js",
      },
    },
  },
});
