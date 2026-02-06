/*
 * @Author       : wfl
 * @LastEditors  : wfl
 * @description  : 
 * @updateInfo   : 
 * @Date         : 2026-01-20 16:21:52
 * @LastEditTime : 2026-01-23 12:34:09
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: {
    port: 5170,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
});
