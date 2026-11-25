import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
export default defineConfig({
  base: "./",
  plugins: [vue()],
  build: {
    outDir: "dist/settings",
    rollupOptions: {
      input: "src/settings-entry.ts",
      output: { entryFileNames: "settings.js" },
    },
  },
});
