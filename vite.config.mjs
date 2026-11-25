import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
export default defineConfig({
  base: "./",
  plugins: [vue()],
  build: {
    outDir: "dist/settings",
    manifest: true,
    rollupOptions: {
      preserveEntrySignatures: "strict",
      input: {
        settings: "src/settings-entry.ts",
        agenda: "src/agenda/mount.ts",
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === "agenda" ? "agenda-[hash].js" : "[name].js",
      },
    },
  },
});
