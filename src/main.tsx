import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

// 末尾スラッシュ（/ja/ など）は付けない形が正。GitHub Pages では 404.html（SPA）経由で来るので、ここで外す
if (window.location.pathname.length > 1 && window.location.pathname.endsWith('/')) {
  window.history.replaceState(
    null,
    '',
    window.location.pathname.replace(/\/+$/, '') + window.location.search + window.location.hash
  );
}

const root = document.getElementById('root')!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// 書き出し済みのページ（/ja, /en, /ja/projects/x …）は本文を引き継ぐ。404.html などの空のページは描画から行う
if (root.hasChildNodes()) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
