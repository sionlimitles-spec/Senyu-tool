import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    target: 'es2020',
    sourcemap: false,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 300,
    assetsInlineLimit: 4096,
  },
  server: { port: 5173, host: true },
  preview: { port: 4173 },
});
