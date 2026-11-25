import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
export default defineConfig({
  base: "./",
  plugins: [vue()],
  build: {
    outDir: "dist/workspace",
    manifest: true,
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
