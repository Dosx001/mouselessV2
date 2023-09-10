import { defineConfig } from "vite";
import webExtension, { readJsonFile } from "vite-plugin-web-extension";

const target = process.env.TARGET || "firefox";

function generateManifest() {
  // readJsonFile instead of import() to avoid caching while development
  const manifest = readJsonFile("src/manifest.json");
  const pkg = readJsonFile("package.json");
  return {
    ...manifest,
    name: pkg.name,
    description: pkg.description,
    version: pkg.version,
  };
}

export default defineConfig({
  plugins: [
    webExtension({
      browser: target,
      manifest: generateManifest,
      watchFilePaths: ["package.json", "src/manifest.json"],
    }),
  ],
});
