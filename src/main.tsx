import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

// GitHub Pages 404.html からの ?/path 復元
// 404.html は "?/ja/projects/x&foo=bar" のようなクエリを作る（"/" の後は "=" を含まない）ため、
// URLSearchParams ではキーが "/ja/projects/x" になってしまい取得できない。文字列操作で復元する。
if (window.location.search[1] === '/') {
  const decoded = window.location.search
    .slice(1)
    .split('&')
    .map((s) => s.replace(/~and~/g, '&'))
    .join('?');
  window.history.replaceState(null, '', window.location.pathname.slice(0, -1) + decoded + window.location.hash);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
