import { defineConfig } from "vite";
import { copyFileSync, cpSync } from "fs";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        content: "src/Content/content.js",
        background: "src/Background/background.ts",
        options: "src/Options/options.js",
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
        copyFileSync("src/manifest.json", "dist/manifest.json");
        cpSync("src/icons", "dist/icons", { recursive: true });
        copyFileSync("src/Popup/popup.html", "dist/popup.html");
        copyFileSync("src/Options/options.html", "dist/options.html");
      },
    },
  ],
});
