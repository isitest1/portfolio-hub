import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageProvider';
import Home from './pages/Home';
import ProjectDetail from './pages/ProjectDetail';
import NotFound from './pages/NotFound';

const basename = import.meta.env.BASE_URL;

/** ルート定義。ブラウザ（BrowserRouter）とビルド時の書き出し（StaticRouter, entry-server.tsx）で共用する */
export function AppRoutes() {
  return (
    <Routes>
      {/* 「/」の正は /ja（ビルドの dist/index.html も /ja へ転送する。prerender.ts 参照） */}
      <Route path="/" element={<Navigate to="/ja" replace />} />
      <Route
        path="/:lang"
        element={
          <LanguageProvider>
            <Home />
          </LanguageProvider>
        }
      />
      <Route
        path="/:lang/projects/:id"
        element={
          <LanguageProvider>
            <ProjectDetail />
          </LanguageProvider>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <AppRoutes />
    </BrowserRouter>
  );
}
