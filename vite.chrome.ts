import { defineConfig } from "vite";
import webExtension from "@samrum/vite-plugin-web-extension";
import pkg from "./package.json";

export default defineConfig({
  build: {
    target: "esnext",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        assetFileNames: "[name][extname]",
        entryFileNames: "[name].js",
      },
    },
  },
  plugins: [
    webExtension({
      manifest: {
        name: pkg.name,
        version: pkg.version,
        description: pkg.description,
        manifest_version: 3,
        content_scripts: [
          {
            matches: ["<all_urls>"],
            js: ["src/ext/content.ts"],
          },
        ],
        background: {
          service_worker: "src/ext/service-worker.ts",
        },
        options_ui: {
          page: "src/settings/options.html",
        },
        icons: {
          "32": "icon-32.png",
          "48": "icon-48.png",
          "64": "icon-64.png",
          "128": "icon-128.png",
        },
        action: {
          default_icon: {
            "32": "icon-32.png",
            "48": "icon-48.png",
            "64": "icon-64.png",
            "128": "icon-128.png",
          },
          default_popup: "src/popup/index.html",
        },
        permissions: [
          "scripting",
          "storage",
          "tabs",
        ],
        host_permissions: ["*://*/*"]
      },
    }),
  ],
});
