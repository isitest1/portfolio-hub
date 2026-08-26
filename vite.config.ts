import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages: リポジトリ名を base に入れる（ユーザーページなら '/' に変更）
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/portfolio-hub/',
});
