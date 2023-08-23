import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "esnext",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        content: "./src/ext/content.ts",
        background: "./src/ext/background.ts",
        popup: "./src/popup/index.html",
        options: "./src/settings/options.html",
      },
      output: {
        assetFileNames: "[name][extname]",
        entryFileNames: "[name].js",
      },
    },
  },
});
