import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
