import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // 5173 lo usa otro proyecto: este va fijo en 5174 (falla en vez de saltar a otro puerto)
  server: { port: 5174, strictPort: true },
  preview: { port: 4174, strictPort: true },
});
