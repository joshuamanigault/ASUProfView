import { defineConfig } from "vite";
import { copyFileSync, cpSync } from "fs";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        content: "src/content.js",
        background: "src/background.ts",
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
    outDir: "dist",
    emptyOutDir: true,
  },
  plugins: [
    {
      name: "copy-assets",
      writeBundle() {
          // Copy necessary static files to dist
          copyFileSync(resolve("src/popup.html"), resolve("dist/popup.html"));
          copyFileSync(resolve("src/manifest.json"), resolve("dist/manifest.json"));
          copyFileSync(resolve("src/options.html"), resolve("dist/options.html"));
          copyFileSync(resolve("src/options.js"), resolve("dist/options.js"));
          cpSync(resolve("src/icons"), resolve("dist/icons"), { recursive: true });
      },
    },
  ],
});
