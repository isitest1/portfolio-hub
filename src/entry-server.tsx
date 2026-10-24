import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { AppRoutes } from './App';

/** ビルド時（scripts/prerender.ts）に、各ルートの本文を HTML にする */
export function render(url: string): string {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url} basename={import.meta.env.BASE_URL}>
        <AppRoutes />
      </StaticRouter>
    </StrictMode>
  );
}
