import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

// GitHub Pages 404.html からの ?/path 復元
const redirect = new URLSearchParams(window.location.search).get('/');
if (redirect !== null) {
  const restored = redirect.replace(/~and~/g, '&');
  window.history.replaceState(null, '', import.meta.env.BASE_URL + restored + window.location.hash);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
