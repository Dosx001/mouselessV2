export default {
  build: {
    target: 'esnext',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        content: './src/ext/content.ts',
        background: './src/ext/background.ts',
        popup: './src/popup/index.html',
        options: './src/settings/options.html',
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
};
