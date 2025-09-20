import { defineConfig } from "vite";
import { copyFileSync } from "fs";
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
      name: "copy-manifest",
      writeBundle() {
        copyFileSync(
          resolve("src/manifest.json"),
          resolve("dist/manifest.json")
        );
      },
    },
  ],
});
