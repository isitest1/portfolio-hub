import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 独自ドメイン（margheritaworks.com）でルート配信するため base は '/'。
// リポジトリ名サブパス配信に戻す場合のみ VITE_BASE で上書きする。
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/',
});
