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
        manifest_version: 2,
        content_scripts: [
          {
            matches: ["<all_urls>"],
            js: ["src/ext/content.ts"],
          },
        ],
        background: {
          scripts: ["src/ext/background.ts"],
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
        browser_action: {
          default_icon: {
            "32": "icon-32.png",
            "48": "icon-48.png",
            "64": "icon-64.png",
            "128": "icon-128.png",
          },
          default_popup: "src/popup/index.html",
        },
        browser_specific_settings: {
          gecko: {
            id: "@mouselessV2",
          },
        },
        permissions: [
          "<all_urls>",
          "activeTab",
          "clipboardRead",
          "clipboardWrite",
          "storage",
          "tabs",
        ],
      },
    }),
  ],
});
