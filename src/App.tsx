import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LanguageProvider, detectLang } from './i18n/LanguageProvider';
import Home from './pages/Home';
import ProjectDetail from './pages/ProjectDetail';
import NotFound from './pages/NotFound';

const basename = import.meta.env.BASE_URL;

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<Navigate to={'/' + detectLang()} replace />} />
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
    </BrowserRouter>
  );
}
