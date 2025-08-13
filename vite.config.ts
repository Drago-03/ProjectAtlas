/** Vite config for ProjectAtlas webview React SPA */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';
export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'src', 'webview'),
  build: { outDir: path.resolve(__dirname, 'dist', 'webview'), emptyOutDir: true, sourcemap: true, assetsDir: '.' }
});
